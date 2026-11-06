import { AlertTriangle, CheckCircle2, Glasses, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import {
  api,
  errorText,
  post,
  type Lesson,
  type ReportStep,
  type VrRequest,
} from '../api';
import {
  criterionText,
  errorLabels,
  formatDateTime,
  formatDuration,
  formatScore,
  label,
  plural,
  stepLabels,
  useLoad,
} from '../format';
import {
  Card,
  ErrorState,
  Loading,
  Notice,
  OutcomeBadge,
  PageTitle,
  PracticeBadge,
  Stat,
  VrStatusBadge,
} from '../ui';

function StepRow({ step }: { step: ReportStep }) {
  const errors = step.errors ?? [];
  const Icon = errors.some((e) => e.critical)
    ? XCircle
    : errors.length
      ? AlertTriangle
      : CheckCircle2;
  const color = errors.some((e) => e.critical)
    ? 'text-rose-300'
    : errors.length
      ? 'text-amber-300'
      : 'text-emerald-300';
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-sm font-medium text-white">
          <Icon className={`h-4 w-4 shrink-0 ${color}`} />
          {label(stepLabels, step.step_id)}
        </span>
        <span className="text-xs text-white/45">
          {step.duration_ms ? formatDuration(step.duration_ms / 1000) : ''}
          {step.hints ? ` · ${plural(step.hints, 'dica', 'dicas')}` : ''}
        </span>
      </div>
      {errors.map((e, i) => (
        <p
          key={i}
          className={`mt-1.5 pl-6 text-sm ${e.critical ? 'text-rose-200' : 'text-amber-100/90'}`}
        >
          {e.critical ? 'Crítico: ' : ''}
          {label(errorLabels, e.type)}
          {e.elapsed_seconds ? (
            <span className="text-white/40">
              {' '}
              · aos {formatDuration(e.elapsed_seconds)}
            </span>
          ) : null}
        </p>
      ))}
    </li>
  );
}

export default function Sessao() {
  const { requestId = '' } = useParams();
  const { user } = useAuth();
  const [action, setAction] = useState('');
  const vr = useLoad(
    () => api<VrRequest>(`/vr-requests/${requestId}?refresh=true`),
    [requestId],
    4000
  );
  const lesson = useLoad(async () => {
    if (!vr.data) return null;
    const lessons = await api<Lesson[]>(
      `/courses/${vr.data.course_id}/lessons`
    ).catch(() => [] as Lesson[]);
    return lessons.find((l) => l.id === vr.data!.lesson_id) ?? null;
  }, [vr.data?.id]);

  if (vr.loading && !vr.data) return <Loading />;
  if (vr.error && !vr.data)
    return <ErrorState message={vr.error} onRetry={() => void vr.reload()} />;
  const r = vr.data!;
  const result = r.last_result;
  const practice = r.mode === 'practice';
  const learner = user?.role === 'learner';
  const criterion = lesson.data
    ? criterionText(lesson.data.passing_score, lesson.data.max_critical_errors)
    : undefined;
  const canCancel =
    r.status === 'pending' && (!learner || r.requested_by === user?.id);

  async function cancel() {
    setAction('');
    try {
      vr.setData(await post<VrRequest>(`/vr-requests/${r.id}/cancel`));
    } catch (caught) {
      setAction(errorText(caught));
    }
  }

  return (
    <>
      <PageTitle
        back={learner ? '/app/desempenho' : '/app/sessoes'}
        title={
          practice
            ? 'Rodada de teste'
            : learner
              ? r.lesson_title
              : (r.student_name ?? 'Sessão VR')
        }
        subtitle={
          <>
            {practice || !learner ? `${r.lesson_title} · ` : ''}
            {r.course_title ? `${r.course_title} · ` : ''}
            {formatDateTime(r.created_at)}
            {r.quest_name ? ` · ${r.quest_name}` : ''}
            {!practice && r.requested_by_name && !learner
              ? ` · iniciada por ${r.requested_by_name}`
              : ''}
          </>
        }
        actions={
          <>
            {practice ? <PracticeBadge /> : null}
            <VrStatusBadge status={r.status} />
            {r.attempts ? <OutcomeBadge outcome={r.outcome} /> : null}
          </>
        }
      />

      {r.status === 'pending' ? (
        <Card className="mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-3 text-sm text-white/75">
              <Glasses className="h-5 w-5 shrink-0 text-cyan-200" />
              Enviado. No Quest, aperte “Iniciar treinamento”.
            </p>
            {canCancel ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => void cancel()}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}
      {r.status === 'running' && !r.attempts ? (
        <div className="mb-5">
          <Notice>
            Treinamento em andamento. O resultado aparece aqui ao final de cada
            tentativa.
          </Notice>
        </div>
      ) : null}
      {practice && r.attempts ? (
        <div className="mb-5">
          <Notice tone="warn">
            Rodada de teste: este resultado não conta para nenhum aluno.
          </Notice>
        </div>
      ) : null}
      {action ? (
        <div className="mb-5">
          <Notice tone="error">{action}</Notice>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Melhor nota"
          value={formatScore(r.best_score)}
          hint={criterion}
        />
        <Stat label="Tentativas" value={r.attempts} />
        <Stat
          label="Erros críticos"
          value={r.critical_errors ?? '—'}
          hint="Na última tentativa"
          tone={r.critical_errors ? 'bad' : undefined}
        />
        <Stat
          label="Duração"
          value={formatDuration(result?.duration_seconds)}
          hint="Da última tentativa"
        />
      </div>

      {r.attempt_results.length > 1 ? (
        <Card title="Tentativas" flush className="mt-5">
          <table className="p-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Nota</th>
                <th>Erros críticos</th>
                <th>Resultado</th>
                <th>Término</th>
              </tr>
            </thead>
            <tbody>
              {[...r.attempt_results]
                .sort((a, b) => a.number - b.number)
                .map((a) => (
                  <tr key={a.number}>
                    <td className="tabular-nums">{a.number}ª</td>
                    <td className="tabular-nums">{formatScore(a.score)}</td>
                    <td className="tabular-nums">{a.critical_errors ?? '—'}</td>
                    <td>
                      {a.completion === 'abandoned' ? (
                        <span className="text-white/50">Interrompida</span>
                      ) : a.passed ? (
                        <span className="text-emerald-200">Aprovada</span>
                      ) : (
                        <span className="text-amber-200">
                          Abaixo do critério
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-white/55">
                      {formatDateTime(a.ended_at)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {result?.steps?.length ? (
        <Card title="Etapa por etapa" className="mt-5">
          <ol className="-my-3 divide-y divide-white/[0.06]">
            {result.steps.map((step, i) => (
              <StepRow key={`${step.step_id}-${i}`} step={step} />
            ))}
          </ol>
        </Card>
      ) : null}
    </>
  );
}
