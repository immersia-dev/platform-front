import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Glasses,
  Lightbulb,
  ListChecks,
  OctagonAlert,
  RefreshCw,
  Target,
  Timer,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { AttemptRow, LearnerAnalytics, NextStep } from './api';
import { Meter, ScoreLine, ValueColumns } from './charts';
import {
  competencyName,
  withoutKind,
  formatDate,
  formatDateTime,
  formatDuration,
  formatGain,
  formatMinutes,
  formatRelative,
  formatScore,
  levelLabels,
  levelPill,
  pct,
  plural,
  ratePct,
  startLink,
} from './format';
import { Card, ComplianceBadge, Empty, Kpi, Progress } from './ui';

// Ficha de acompanhamento de um aluno: próximos passos, números, evolução, treinamentos, competências,
// cursos e todas as tentativas. self = o próprio aluno (links para os cursos dele; sem dados de colegas).

/** Texto de um próximo passo: o nome da etapa entre aspas e sempre o curso a que pertence. */
function stepText(step: NextStep) {
  const kindOf = step.kind.includes('quiz')
    ? 'quiz'
    : step.kind.includes('vr')
      ? 'vr'
      : null;
  const name = kindOf
    ? withoutKind(step.lesson_title, kindOf)
    : step.lesson_title;
  const lesson = name ? `“${name}”` : '';
  const course = step.course_title ? `Curso ${step.course_title}` : '';
  const focus = step.competency_id
    ? `Foque em ${competencyName(step.competency_id).toLocaleLowerCase('pt-BR')}.`
    : '';
  const join = (...parts: string[]) => parts.filter(Boolean).join(' · ');
  switch (step.kind) {
    case 'reciclagem':
      return {
        icon: RefreshCw,
        title: 'Fazer a reciclagem',
        detail: join(course, 'a validade terminou'),
        tone: 'bad',
      };
    case 'repetir_vr':
      return {
        icon: Glasses,
        title: `Repetir o treinamento VR ${lesson}`,
        detail: join(
          course,
          `melhor nota ${formatScore(step.best_score)}, mínimo ${formatScore(step.passing_score)}`,
          focus
        ),
        tone: 'bad',
      };
    case 'reforcar_competencia':
      return {
        icon: Target,
        title: `Reforçar ${competencyName(step.competency_id).toLocaleLowerCase('pt-BR')}`,
        detail: join(
          course,
          'você errou nesta etapa mais do que a média da organização'
        ),
        tone: 'warn',
      };
    case 'estudar_material':
      return {
        icon: BookOpen,
        title: `Estudar ${lesson}`,
        detail: course,
        tone: 'info',
      };
    case 'responder_quiz':
      return {
        icon: ListChecks,
        title: `Responder o quiz ${lesson}`,
        detail: join(course, `mínimo ${formatScore(step.passing_score)}`),
        tone: 'info',
      };
    case 'refazer_quiz':
      return {
        icon: ListChecks,
        title: `Refazer o quiz ${lesson}`,
        detail: join(
          course,
          `melhor nota ${formatScore(step.best_score)}, mínimo ${formatScore(step.passing_score)}`
        ),
        tone: 'warn',
      };
    case 'iniciar_vr':
      return {
        icon: Glasses,
        title: `Fazer o treinamento VR ${lesson}`,
        detail: course,
        tone: 'info',
      };
    default:
      return {
        icon: RefreshCw,
        title: 'Reciclagem em breve',
        detail: join(course, `válido até ${formatDate(step.valid_until)}`),
        tone: 'warn',
      };
  }
}

const toneRing = {
  bad: 'border-rose-300/20 bg-rose-400/[0.07] text-rose-200',
  warn: 'border-amber-300/20 bg-amber-400/[0.07] text-amber-200',
  info: 'border-cyan-300/20 bg-cyan-400/[0.07] text-cyan-200',
} as const;

export function NextSteps({
  data,
  self,
  limit,
  canStart = true,
}: {
  data: LearnerAnalytics;
  self: boolean;
  limit?: number;
  canStart?: boolean;
}) {
  const steps = limit ? data.next_steps.slice(0, limit) : data.next_steps;
  const classOf = (enrollmentId: string | null) =>
    data.classes.find((c) => c.enrollment_id === enrollmentId)?.class_id;
  if (!steps.length)
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-100">
        <CheckCircle2 className="h-5 w-5 shrink-0" /> Tudo em dia. Nenhuma
        pendência por enquanto.
      </div>
    );
  return (
    <ul className="space-y-2.5">
      {steps.map((step, i) => {
        const t = stepText(step);
        const Icon = t.icon;
        const vr =
          ['repetir_vr', 'iniciar_vr', 'reforcar_competencia'].includes(
            step.kind
          ) && step.lesson_id;
        const course =
          self && step.enrollment_id && step.class_course_id
            ? `/app/meus-cursos/${step.enrollment_id}/${step.class_course_id}`
            : null;
        return (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:flex-row sm:items-center"
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${toneRing[t.tone as keyof typeof toneRing]}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{t.title}</p>
              <p className="text-xs text-white/50">{t.detail}</p>
            </div>
            {vr && canStart ? (
              <Link
                className="primary-btn shrink-0 sm:w-auto sm:px-4"
                to={startLink({
                  classId: classOf(step.enrollment_id),
                  lessonId: step.lesson_id,
                  enrollmentId: step.enrollment_id,
                })}
              >
                <Glasses className="h-4 w-4" /> Iniciar
              </Link>
            ) : course &&
              step.lesson_id &&
              step.kind !== 'reforcar_competencia' ? (
              <Link
                className="secondary-btn shrink-0"
                to={`${course}/etapas/${step.lesson_id}`}
              >
                {step.kind.includes('quiz') ? 'Responder' : 'Abrir'}
              </Link>
            ) : course ? (
              <Link className="secondary-btn shrink-0" to={course}>
                Abrir curso
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Par rótulo/valor do cartão de dados. */
function Info({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs text-white/45">{name}</dt>
      <dd className="min-w-0 text-right text-sm text-white/85">{children}</dd>
    </div>
  );
}

/** Número da carga operacional, com ícone e linha de apoio. */
function Load({
  icon: Icon,
  name,
  value,
  hint,
  tone,
}: {
  icon: typeof Clock;
  name: string;
  value: ReactNode;
  hint: string;
  tone?: 'bad' | 'warn';
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-xs text-white/50">
        <Icon
          className={`h-3.5 w-3.5 ${tone === 'bad' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : 'text-cyan-200'}`}
        />
        {name}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${tone === 'bad' ? 'text-rose-100' : 'text-white'}`}
      >
        {value}
      </p>
      <p className="text-[11px] text-white/40">{hint}</p>
    </div>
  );
}

function ScoreChip({ row }: { row: AttemptRow }) {
  return (
    <span
      className={`inline-grid h-8 w-11 place-items-center rounded-lg text-sm font-semibold tabular-nums ${row.passed ? 'bg-emerald-400/10 text-emerald-100' : 'bg-amber-400/10 text-amber-100'}`}
      title={row.passed ? 'No critério' : 'Abaixo do critério'}
    >
      {formatScore(row.score)}
    </span>
  );
}

/** Todas as tentativas no VR, da mais recente, com o curso de cada treinamento. */
function AttemptsTable({ data }: { data: LearnerAnalytics }) {
  const rows = [...data.timeline].reverse();
  if (!rows.length)
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty title="Nenhuma tentativa ainda" />
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="p-table">
        <thead>
          <tr>
            <th>Nota</th>
            <th>Treinamento VR</th>
            <th>Critério</th>
            <th className="text-right">Críticos</th>
            <th className="text-right">Duração</th>
            <th>Data</th>
            <th aria-label="Sessão" />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.attempt_id}>
              <td>
                <ScoreChip row={t} />
              </td>
              <td>
                <p className="whitespace-nowrap text-white">{t.lesson_title}</p>
                <p className="text-xs text-white/40">
                  {t.course_title ? `${t.course_title} · ` : ''}
                  {t.number}ª tentativa
                </p>
              </td>
              <td className="whitespace-nowrap">
                {t.passed ? (
                  <span className="text-emerald-200">No critério</span>
                ) : (
                  <span className="text-amber-200">Abaixo</span>
                )}
                {t.passing_score != null ? (
                  <span className="ml-1.5 text-xs text-white/35">
                    mín. {formatScore(t.passing_score)}
                  </span>
                ) : null}
              </td>
              <td
                className={`text-right tabular-nums ${t.critical_errors ? 'text-rose-200' : 'text-white/45'}`}
              >
                {t.critical_errors}
              </td>
              <td className="whitespace-nowrap text-right tabular-nums">
                {formatDuration(t.duration_seconds)}
              </td>
              <td className="whitespace-nowrap text-white/60">
                {formatDateTime(t.ended_at)}
              </td>
              <td className="whitespace-nowrap text-right">
                <Link
                  to={`/app/sessoes/${t.vr_request_id}`}
                  className="p-action p-action-accent"
                >
                  Sessão
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LearnerReport({
  data,
  self = false,
  canStart = true,
}: {
  data: LearnerAnalytics;
  self?: boolean;
  canStart?: boolean;
}) {
  const k = data.kpis;
  const reference =
    data.timeline.find((t) => t.passing_score != null)?.passing_score ?? null;
  const perAttempt = (n: number) =>
    k.attempts ? (n / k.attempts).toFixed(1).replace('.', ',') : '—';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={Target}
          label="Nota média"
          value={formatScore(k.avg_score)}
          tone={
            k.avg_score != null &&
            k.cohort_avg_score != null &&
            k.avg_score < k.cohort_avg_score - 5
              ? 'warn'
              : undefined
          }
          hint={
            k.cohort_avg_score != null
              ? `Organização: ${formatScore(k.cohort_avg_score)}`
              : plural(k.attempts, 'tentativa', 'tentativas')
          }
        />
        <Kpi
          icon={Award}
          label="Melhor nota"
          value={formatScore(k.best_score)}
          hint={`Aprovação ${pct(k.pass_rate)}`}
        />
        <Kpi
          icon={TrendingUp}
          label="Evolução"
          value={
            k.improvement == null ? '—' : `${formatGain(k.improvement)} pts`
          }
          tone={k.improvement != null && k.improvement > 0 ? 'ok' : undefined}
          hint="Da 1ª à última tentativa"
        />
        <Kpi
          icon={Clock}
          label="Tempo em VR"
          value={formatMinutes(k.training_minutes)}
          hint={plural(k.attempts, 'tentativa', 'tentativas')}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card title={self ? 'Seus próximos passos' : 'Próximos passos'}>
            <NextSteps data={data} self={self} canStart={canStart} />
          </Card>

          <Card title="Curva de aprendizagem">
            <ScoreLine
              reference={reference}
              empty="Nenhuma tentativa ainda."
              points={data.timeline.map((t) => ({
                label: formatDate(t.ended_at).slice(0, 5),
                value: t.score,
                detail: (
                  <>
                    <p>
                      Nota {formatScore(t.score)} ·{' '}
                      {t.passed ? 'no critério' : 'abaixo do critério'}
                    </p>
                    <p>
                      {t.lesson_title} · {t.number}ª tentativa
                    </p>
                  </>
                ),
              }))}
            />
          </Card>

          <div className="grid items-start gap-5 md:grid-cols-2">
            <Card title="Nota por tentativa">
              <ValueColumns
                height={180}
                reference={reference}
                empty="Nenhuma tentativa ainda."
                points={data.by_attempt_number.map((p) => ({
                  label: p.label,
                  value: p.avg_score,
                  detail: (
                    <>
                      <p>Nota média {formatScore(p.avg_score)}</p>
                      <p>{pct(p.pass_rate)} no critério</p>
                    </>
                  ),
                }))}
              />
            </Card>

            <Card title="Por treinamento">
              {data.lessons.length ? (
                <ul className="space-y-5">
                  {data.lessons.map((l) => (
                    <li key={l.lesson_id}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <span className="min-w-0 text-sm font-medium text-white">
                          {l.title}
                        </span>
                        {l.passed ? (
                          <span className="status-pill status-pill-success shrink-0">
                            Aprovado
                          </span>
                        ) : (
                          <span className="status-pill shrink-0 border-amber-300/25 bg-amber-400/10 text-amber-100">
                            Abaixo
                          </span>
                        )}
                      </div>
                      <Meter
                        value={l.avg_score ?? 0}
                        reference={l.cohort_avg_score}
                        tone={l.passed ? 'cyan' : 'warn'}
                      />
                      <p className="mt-1.5 text-xs text-white/45">
                        Média{' '}
                        <span className="font-semibold tabular-nums text-white">
                          {formatScore(l.avg_score)}
                        </span>
                        {l.cohort_avg_score != null
                          ? ` · organização ${formatScore(l.cohort_avg_score)}`
                          : ''}
                        {l.passing_score != null
                          ? ` · mínimo ${formatScore(l.passing_score)}`
                          : ''}
                      </p>
                      <dl className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                        {[
                          ['Melhor', formatScore(l.best_score)],
                          ['Última', formatScore(l.last_score)],
                          ['Tentativas', l.attempts],
                          ['Tempo', formatMinutes(l.minutes)],
                        ].map(([n, v]) => (
                          <div
                            key={n}
                            className="rounded-xl bg-white/[0.04] px-1 py-1.5"
                          >
                            <dt className="text-[10px] text-white/45">{n}</dt>
                            <dd className="whitespace-nowrap text-sm font-semibold tabular-nums text-white">
                              {v}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="Nenhum treinamento VR ainda" />
              )}
            </Card>
          </div>

          <Card title="Competências">
            {data.competencies.length ? (
              <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                {data.competencies.map((c) => (
                  <li key={c.competency_id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-white/85">
                        {competencyName(c.competency_id)}
                      </span>
                      <span className={levelPill[c.level]}>
                        {levelLabels[c.level]}
                      </span>
                    </div>
                    <Meter
                      value={(1 - c.error_rate) * 100}
                      reference={
                        c.cohort_error_rate != null
                          ? (1 - c.cohort_error_rate) * 100
                          : null
                      }
                      tone={
                        c.level === 'reforcar'
                          ? 'bad'
                          : c.level === 'dominada'
                            ? 'ok'
                            : 'warn'
                      }
                    />
                    <p className="mt-1 text-xs text-white/40">
                      {ratePct(1 - c.error_rate)} de acerto
                      {c.cohort_error_rate != null
                        ? ` · organização ${ratePct(1 - c.cohort_error_rate)}`
                        : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Sem dados por competência">
                Aparecem depois do primeiro treinamento VR.
              </Empty>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title={self ? 'Seus dados' : 'Dados'}>
            <dl className="divide-y divide-white/[0.06]">
              {data.student.email ? (
                <Info name="E-mail">
                  <span className="block truncate">{data.student.email}</span>
                </Info>
              ) : null}
              <Info name="Conta">
                {data.student.active ? (
                  <span className="status-pill status-pill-success">Ativa</span>
                ) : (
                  <span className="status-pill status-pill-muted">Inativa</span>
                )}
              </Info>
              <Info name="Última atividade">
                <span title={formatDateTime(k.last_attempt_at)}>
                  {k.last_attempt_at ? formatRelative(k.last_attempt_at) : '—'}
                </span>
              </Info>
              {data.classes.length ? (
                data.classes.map((c) => (
                  <Info key={c.enrollment_id} name="Turma">
                    <span className="block truncate">{c.class_name}</span>
                    <span className="block text-xs text-white/40">
                      desde {formatDate(c.enrolled_at)}
                    </span>
                  </Info>
                ))
              ) : (
                <Info name="Turma">Sem turma ativa</Info>
              )}
            </dl>
          </Card>

          <Card title="Carga operacional">
            <div className="grid grid-cols-2 gap-2.5">
              <Load
                icon={Timer}
                name="Tempo médio"
                value={formatDuration(k.avg_duration_seconds)}
                hint="por tentativa"
              />
              <Load
                icon={TriangleAlert}
                name="Erros"
                value={k.errors}
                hint={`${perAttempt(k.errors)} por tentativa`}
                tone={k.errors ? 'warn' : undefined}
              />
              <Load
                icon={OctagonAlert}
                name="Críticos"
                value={k.critical_errors}
                hint={`${perAttempt(k.critical_errors)} por tentativa`}
                tone={k.critical_errors ? 'bad' : undefined}
              />
              <Load
                icon={Lightbulb}
                name="Dicas"
                value={k.hints_used}
                hint={`${perAttempt(k.hints_used)} por tentativa`}
              />
            </div>
          </Card>

          <Card title={self ? 'Meus cursos' : 'Cursos'}>
            {data.paths.length ? (
              <ul className="divide-y divide-white/[0.06]">
                {data.paths.map((p) => {
                  const certified = ['apto', 'a_vencer', 'vencido'].includes(
                    p.status
                  );
                  const inner = (
                    <>
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-white">
                            {p.course_title}
                          </span>
                          <span className="block truncate text-xs text-white/45">
                            {p.class_name}
                            {p.valid_until
                              ? ` · válido até ${formatDate(p.valid_until)}`
                              : ''}
                          </span>
                        </span>
                        <ComplianceBadge status={p.status} />
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-3">
                        <Progress value={p.completion_percent} />
                        {certified && !self ? (
                          <Link
                            to={`/app/certificados/${p.enrollment_id}/${p.class_course_id}`}
                            className="p-action p-action-accent"
                          >
                            Certificado
                          </Link>
                        ) : null}
                      </span>
                    </>
                  );
                  return (
                    <li
                      key={`${p.enrollment_id}:${p.class_course_id}`}
                      className="py-3 first:pt-0 last:pb-0"
                    >
                      {self ? (
                        <Link
                          to={`/app/meus-cursos/${p.enrollment_id}/${p.class_course_id}`}
                          className="block hover:opacity-90"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div>
                          {inner}
                          <Link
                            to={`/app/alunos/${data.student.id}/cursos/${p.enrollment_id}/${p.class_course_id}`}
                            className="mt-2 p-action p-action-accent"
                          >
                            Desempenho no curso
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty title="Sem cursos ativos" />
            )}
          </Card>
        </div>
      </div>

      <Card
        title="Tentativas"
        flush
        action={
          data.timeline.length ? (
            <span className="text-xs text-white/45">
              {plural(data.timeline.length, 'tentativa', 'tentativas')}
            </span>
          ) : null
        }
      >
        <AttemptsTable data={data} />
      </Card>
    </div>
  );
}
