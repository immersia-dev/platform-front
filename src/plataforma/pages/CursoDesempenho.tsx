import {
  BookOpenCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Glasses,
  ListChecks,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { api, type CourseAnalytics, type LearnerAnalytics } from '../api';
import { Meter, ScoreLine, ValueColumns } from '../charts';
import {
  competencyName,
  formatDate,
  formatDuration,
  formatMinutes,
  formatScore,
  levelLabels,
  levelPill,
  plural,
  ratePct,
  useLoad,
} from '../format';
import { NextSteps } from '../LearnerReport';
import { kindMeta, lessonKind } from '../lessons';
import {
  Card,
  ComplianceBadge,
  Empty,
  ErrorState,
  Kpi,
  Loading,
  PageTitle,
} from '../ui';

const days = (value: number | null | undefined) =>
  value == null
    ? null
    : value < 1
      ? 'menos de 1 dia'
      : plural(Math.round(value), 'dia', 'dias');

/**
 * O desempenho num curso: etapas, tempo, cada quiz (com as perguntas que mais erra) e cada treinamento VR do curso.
 * Serve ao aluno (/app/desempenho/...) e a quem o acompanha (/app/alunos/:aluno/cursos/...).
 */
export default function CursoDesempenho() {
  const { studentId, enrollmentId = '', classCourseId = '' } = useParams();
  const self = !studentId;
  const data = useLoad(
    () =>
      api<CourseAnalytics>(
        self
          ? `/me/courses/${enrollmentId}/${classCourseId}/analytics`
          : `/analytics/learners/${studentId}/courses/${enrollmentId}/${classCourseId}`
      ),
    [studentId, enrollmentId, classCourseId]
  );
  const back = self ? '/app/desempenho' : `/app/alunos/${studentId}`;
  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <>
        <PageTitle
          back={back}
          backLabel={self ? 'Meu desempenho' : 'Ficha do aluno'}
          title="Curso"
        />
        <ErrorState
          message={data.error || 'Curso não encontrado.'}
          onRetry={() => void data.reload()}
        />
      </>
    );
  const { course, path, kpis, lessons, vr, quizzes } = data.data;
  const lessonHref = (id: string) =>
    self
      ? `/app/meus-cursos/${enrollmentId}/${classCourseId}/etapas/${id}`
      : null;
  // NextSteps só precisa dos próximos passos e das turmas (para o atalho do VR)
  const stepsData = {
    next_steps: data.data.next_steps,
    classes: [
      {
        enrollment_id: path.enrollment_id,
        class_id: path.class_id,
        class_name: path.class_name,
      },
    ],
  } as unknown as LearnerAnalytics;

  return (
    <>
      <PageTitle
        back={back}
        backLabel={self ? 'Meu desempenho' : 'Ficha do aluno'}
        title={course.course_title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {path.class_name}
            <ComplianceBadge status={path.status} />
          </span>
        }
        actions={
          self ? (
            <Link
              to={`/app/meus-cursos/${enrollmentId}/${classCourseId}`}
              className="secondary-btn"
            >
              Abrir o curso
            </Link>
          ) : null
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={BookOpenCheck}
            label="Progresso"
            value={`${kpis.completion_percent}%`}
            hint={`${kpis.lessons_done} de ${kpis.lessons_total} etapas`}
          />
          <Kpi
            icon={Clock}
            label="Tempo de estudo"
            value={formatMinutes(kpis.study_minutes)}
            hint="Real no quiz e no VR"
          />
          <Kpi
            icon={CalendarCheck}
            label={
              kpis.days_to_complete != null ? 'Concluído em' : 'Começou em'
            }
            value={
              days(kpis.days_to_complete) ??
              (kpis.started_at ? formatDate(kpis.started_at) : '—')
            }
            hint={
              kpis.days_to_complete != null
                ? 'Da matrícula à conclusão'
                : kpis.started_at
                  ? 'Primeira atividade'
                  : 'Ainda não começou'
            }
          />
          {quizzes.length ? (
            <Kpi
              icon={ListChecks}
              label="Quizzes"
              value={formatScore(kpis.quiz_avg_score)}
              hint={
                kpis.quiz_attempts
                  ? kpis.quiz_avg_seconds != null
                    ? `Nota média · ${formatDuration(kpis.quiz_avg_seconds)} por tentativa`
                    : 'Nota média'
                  : 'Nenhuma tentativa ainda'
              }
            />
          ) : (
            <Kpi
              icon={Glasses}
              label="Treinamentos VR"
              value={formatScore(kpis.vr_best_score)}
              hint={
                kpis.vr_attempts ? 'Melhor nota' : 'Nenhuma tentativa ainda'
              }
            />
          )}
        </div>

        {self ? (
          <Card title="Próximos passos neste curso">
            <NextSteps data={stepsData} self />
          </Card>
        ) : null}

        <Card title="Etapas" flush>
          <div className="overflow-x-auto">
            <table className="p-table">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Situação</th>
                  <th className="text-right">Tentativas</th>
                  <th className="text-right">Melhor nota</th>
                  <th className="text-right">Tempo</th>
                  <th>Concluída em</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l, i) => {
                  const kind = lessonKind(l);
                  const meta = kindMeta[kind];
                  const href = lessonHref(l.lesson_id);
                  const graded = kind === 'quiz' || kind === 'vr';
                  const status = l.completed_at
                    ? graded && l.passed === false
                      ? { text: 'Abaixo do critério', cls: 'text-amber-200' }
                      : { text: 'Concluída', cls: 'text-emerald-200' }
                    : l.attempts
                      ? { text: 'Em andamento', cls: 'text-cyan-100' }
                      : { text: 'Não iniciada', cls: 'text-white/45' };
                  return (
                    <tr key={l.lesson_id}>
                      <td>
                        <span className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
                            <meta.icon className="h-4 w-4 text-white/60" />
                          </span>
                          <span className="min-w-0">
                            {href ? (
                              <Link to={href} className="p-link block truncate">
                                {i + 1}. {l.title}
                              </Link>
                            ) : (
                              <span className="block truncate text-white">
                                {i + 1}. {l.title}
                              </span>
                            )}
                            <span className="block text-xs text-white/40">
                              {meta.label}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className={`whitespace-nowrap ${status.cls}`}>
                        {status.text}
                      </td>
                      <td className="text-right tabular-nums">
                        {graded ? l.attempts : '—'}
                      </td>
                      <td className="text-right tabular-nums">
                        {graded ? formatScore(l.best_score) : '—'}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {l.minutes
                          ? formatMinutes(l.minutes)
                          : l.attempts || l.completed_at
                            ? '< 1 min'
                            : '—'}
                      </td>
                      <td className="whitespace-nowrap text-white/60">
                        {formatDate(l.completed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {quizzes.map((q) => (
          <Card
            key={q.lesson_id}
            title={q.title}
            action={
              <span className="status-pill border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                Quiz
              </span>
            }
          >
            {q.attempts.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Nota por tentativa
                  </p>
                  <ValueColumns
                    height={190}
                    reference={q.passing_score}
                    points={q.attempts.map((a) => ({
                      label: `${a.number}ª`,
                      value: a.score,
                      detail: (
                        <p>
                          {a.correct} de {a.total} certas ·{' '}
                          {formatDuration(a.duration_seconds)} ·{' '}
                          {formatDate(a.created_at)}
                        </p>
                      ),
                    }))}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Acerto por pergunta, em todas as tentativas
                  </p>
                  <ul className="space-y-3">
                    {[...q.questions]
                      .sort((a, b) => (a.right_rate ?? 1) - (b.right_rate ?? 1))
                      .map((question) => (
                        <li key={question.id}>
                          <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                            <span className="min-w-0 text-white/80">
                              {question.text}
                            </span>
                            {question.last_right != null ? (
                              question.last_right ? (
                                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-200">
                                  <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                  acertou na última
                                </span>
                              ) : (
                                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-rose-200">
                                  <XCircle className="h-3.5 w-3.5" /> errou na
                                  última
                                </span>
                              )
                            ) : null}
                          </div>
                          <Meter
                            value={(question.right_rate ?? 0) * 100}
                            tone={
                              (question.right_rate ?? 0) >= 0.7
                                ? 'ok'
                                : (question.right_rate ?? 0) >= 0.4
                                  ? 'warn'
                                  : 'bad'
                            }
                          />
                          <p className="mt-1 text-[11px] text-white/40">
                            {ratePct(question.right_rate)} de acerto
                          </p>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Empty title="Nenhuma tentativa ainda" />
            )}
          </Card>
        ))}

        {vr.map((t) => (
          <Card
            key={t.lesson_id}
            title={t.title}
            action={
              <span className="status-pill border-violet-300/25 bg-violet-400/10 text-violet-100">
                Treinamento VR
              </span>
            }
          >
            {t.attempts.length ? (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Nota em cada tentativa
                  </p>
                  <ScoreLine
                    height={200}
                    reference={t.passing_score}
                    points={t.attempts.map((a) => ({
                      label: formatDate(a.ended_at).slice(0, 5),
                      value: a.score,
                      detail: (
                        <>
                          <p>
                            {a.number}ª tentativa ·{' '}
                            {a.passed ? 'no critério' : 'abaixo do critério'}
                          </p>
                          <p>
                            {formatDuration(a.duration_seconds)}
                            {a.critical_errors
                              ? ` · ${plural(a.critical_errors, 'erro crítico', 'erros críticos')}`
                              : ''}
                          </p>
                        </>
                      ),
                    }))}
                  />
                </div>
                <div className="lg:col-span-2">
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Competências
                  </p>
                  {t.competencies.length ? (
                    <ul className="space-y-3">
                      {t.competencies.slice(0, 6).map((c) => (
                        <li key={c.competency_id}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate text-white/80">
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
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/45">
                      O treinamento ainda não enviou as etapas.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Empty title="Nenhuma tentativa ainda" />
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
