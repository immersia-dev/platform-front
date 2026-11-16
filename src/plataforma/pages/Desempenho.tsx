import {
  BookOpenCheck,
  CalendarCheck,
  ChevronRight,
  Clock,
  GraduationCap,
  Glasses,
  ListChecks,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { api, type LearnerAnalytics } from '../api';
import { Meter, ScoreLine } from '../charts';
import {
  competencyName,
  courseCover,
  formatDate,
  formatDuration,
  formatMinutes,
  formatScore,
  formatShortDateTime,
  levelLabels,
  levelPill,
  pct,
  plural,
  ratePct,
  useLoad,
} from '../format';
import { NextSteps } from '../LearnerReport';
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
    ? '—'
    : value < 1
      ? 'menos de 1 dia'
      : plural(Math.round(value), 'dia', 'dias');

/** Meu desempenho: o retrato de todos os cursos; cada curso abre a sua página. */
export default function Desempenho() {
  const data = useLoad(() => api<LearnerAnalytics>('/me/analytics'), []);
  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const d = data.data;
  const k = d.kpis;
  const vrReference =
    d.timeline.find((t) => t.passing_score != null)?.passing_score ?? null;

  return (
    <>
      <PageTitle title="Meu desempenho" subtitle="Todos os seus cursos" />
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-white/45">
            Cursos e tempo
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={GraduationCap}
              label="Cursos concluídos"
              value={`${k.courses_done}/${d.courses.length}`}
              hint={`Progresso médio ${k.completion_percent}%`}
            />
            <Kpi
              icon={BookOpenCheck}
              label="Etapas concluídas"
              value={`${k.lessons_done}/${k.lessons_total}`}
              hint="Em todos os cursos"
            />
            <Kpi
              icon={Clock}
              label="Tempo de estudo"
              value={formatMinutes(k.study_minutes)}
              hint="Leituras, vídeos, quizzes e VR"
              help="Tempo real no quiz e no VR; nas leituras e vídeos, a duração estimada da etapa."
            />
            <Kpi
              icon={CalendarCheck}
              label="Tempo para concluir"
              value={days(k.avg_days_to_complete)}
              hint={
                k.avg_days_to_complete == null
                  ? 'Nenhum curso concluído ainda'
                  : 'Média, da matrícula à conclusão'
              }
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-white/45">
            Quizzes e treinamentos VR
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={ListChecks}
              label="Nota média nos quizzes"
              value={formatScore(k.quiz_avg_score)}
              hint={plural(k.quiz_attempts, 'tentativa', 'tentativas')}
            />
            <Kpi
              icon={Timer}
              label="Tempo de resposta"
              value={formatDuration(k.quiz_avg_seconds)}
              hint="Média por tentativa de quiz"
            />
            <Kpi
              icon={Glasses}
              label="Nota média no VR"
              value={formatScore(k.avg_score)}
              hint={
                k.best_score != null
                  ? `Melhor nota ${formatScore(k.best_score)}`
                  : plural(k.attempts, 'tentativa', 'tentativas')
              }
            />
            <Kpi
              icon={Trophy}
              label="Aprovado na 1ª tentativa"
              value={pct(k.quiz_first_try_pass_rate)}
              hint={`Nos quizzes · no VR ${pct(k.vr_first_try_pass_rate)}`}
            />
          </div>
        </section>

        <Card title="Seus próximos passos">
          <NextSteps data={d} self />
        </Card>

        <Card title="Meus cursos" flush>
          {d.courses.length ? (
            <ul className="divide-y divide-white/[0.06] px-3 pb-2 sm:px-4">
              {d.courses.map((c) => {
                const cover = courseCover(c.cover_url);
                return (
                  <li key={`${c.enrollment_id}:${c.class_course_id}`}>
                    <Link
                      to={`/app/desempenho/${c.enrollment_id}/${c.class_course_id}`}
                      className="group flex flex-col gap-3 rounded-2xl px-2 py-3.5 transition hover:bg-white/[0.03] sm:flex-row sm:items-center"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3.5">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="h-12 w-20 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="grid h-12 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-600/20 to-fuchsia-600/15">
                            <GraduationCap className="h-5 w-5 text-white/45" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-white group-hover:text-cyan-100">
                            {c.course_title}
                          </span>
                          <span className="block text-xs text-white/45">
                            {c.class_name} · {c.lessons_done} de{' '}
                            {c.lessons_total} etapas ·{' '}
                            {formatMinutes(c.study_minutes)}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-4 pl-[6.1rem] sm:pl-0">
                        <span className="w-28">
                          <Meter value={c.completion_percent} />
                          <span className="mt-1 block text-[11px] tabular-nums text-white/45">
                            {c.completion_percent}%
                          </span>
                        </span>
                        <span className="hidden w-24 text-right text-xs leading-relaxed text-white/55 md:block">
                          {c.quiz_lessons
                            ? c.quiz_attempts
                              ? `Quiz ${formatScore(c.quiz_avg_score)}`
                              : 'Quiz por fazer'
                            : ''}
                          {c.quiz_lessons && c.vr_lessons ? <br /> : null}
                          {c.vr_lessons
                            ? c.vr_attempts
                              ? `VR ${formatScore(c.vr_best_score)}`
                              : 'VR por fazer'
                            : ''}
                        </span>
                        <ComplianceBadge status={c.status} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-white/70" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 pb-5 sm:px-6">
              <Empty title="Nenhum curso por enquanto" />
            </div>
          )}
        </Card>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Card title="Notas nos quizzes">
            <ScoreLine
              height={200}
              empty="Nenhum quiz respondido ainda."
              points={d.quiz_timeline.map((q) => ({
                label: formatShortDateTime(q.created_at),
                value: q.score,
                detail: (
                  <>
                    <p>
                      Nota {formatScore(q.score)} ·{' '}
                      {q.passed ? 'aprovado' : 'abaixo da nota mínima'}
                    </p>
                    <p>
                      “{q.lesson_title}” · {q.course_title}
                    </p>
                  </>
                ),
              }))}
            />
          </Card>
          <Card title="Notas nos treinamentos VR">
            <ScoreLine
              height={200}
              reference={vrReference}
              empty="Nenhum treinamento VR feito ainda."
              points={d.timeline.map((t) => ({
                label: formatDate(t.ended_at).slice(0, 5),
                value: t.score,
                detail: (
                  <>
                    <p>
                      Nota {formatScore(t.score)} ·{' '}
                      {t.passed ? 'no critério' : 'abaixo do critério'}
                    </p>
                    <p>
                      “{t.lesson_title}”
                      {t.course_title ? ` · ${t.course_title}` : ''}
                    </p>
                  </>
                ),
              }))}
            />
          </Card>
        </div>

        {d.competencies.length ? (
          <Card title="Competências nos treinamentos VR">
            <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2 3xl:grid-cols-3">
              {d.competencies.map((c) => (
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
          </Card>
        ) : (
          <p className="flex items-center gap-2 text-xs text-white/40">
            <Target className="h-3.5 w-3.5" /> As competências aparecem depois
            do primeiro treinamento VR.
          </p>
        )}
      </div>
    </>
  );
}
