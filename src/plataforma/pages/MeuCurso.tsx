import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Glasses,
  GraduationCap,
  Play,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import {
  api,
  type CourseAnalytics,
  type LearningPath,
  type PathLesson,
} from '../api';
import {
  complianceHelp,
  courseCover,
  criterionText,
  formatDate,
  formatHours,
  formatMinutes,
  formatScore,
  plural,
  startLink,
  useLoad,
} from '../format';
import { formatMinutesShort, kindMeta, lessonKind } from '../lessons';
import {
  Card,
  ComplianceBadge,
  ErrorState,
  Loading,
  Notice,
  PageTitle,
} from '../ui';

function LessonItem({
  path,
  lesson,
  index,
}: {
  path: LearningPath;
  lesson: PathLesson;
  index: number;
}) {
  const kind = lessonKind(lesson);
  const meta = kindMeta[kind];
  const done = Boolean(lesson.completed_at);
  const vr = kind === 'vr';
  const quiz = kind === 'quiz';
  const passed = lesson.vr_outcome === 'passed';
  const finished = done && (!vr || passed);
  const Icon = finished ? CheckCircle2 : meta.icon;
  const href = `/app/meus-cursos/${path.enrollment_id}/${path.class_course_id}/etapas/${lesson.id}`;
  const minutes = formatMinutesShort(lesson.duration_minutes);

  const detail = vr
    ? lesson.best_score != null
      ? `Treinamento VR · melhor nota ${formatScore(lesson.best_score)} em ${plural(lesson.attempts, 'tentativa', 'tentativas')} · ${passed ? 'no critério' : `abaixo do critério (${criterionText(lesson.passing_score, lesson.max_critical_errors)})`}`
      : `Treinamento VR · ${criterionText(lesson.passing_score, lesson.max_critical_errors)}`
    : quiz
      ? done
        ? `Quiz · aprovado com ${formatScore(lesson.best_score)}`
        : lesson.attempts
          ? `Quiz · melhor nota ${formatScore(lesson.best_score)}, mínimo ${formatScore(lesson.passing_score)}`
          : `Quiz · mínimo ${formatScore(lesson.passing_score)}${minutes ? ` · ${minutes}` : ''}`
      : done
        ? `${meta.label} · concluída em ${formatDate(lesson.completed_at)}`
        : `${meta.label}${minutes ? ` · ${minutes}` : ''}`;
  const warn =
    (vr && done && !passed) || (quiz && !done && lesson.attempts > 0);

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${finished ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : vr ? 'border-violet-300/25 bg-violet-400/10 text-violet-100' : quiz ? 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/[0.05] text-white/60'}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-white/40">Etapa {index + 1}</p>
          <Link
            to={href}
            className="font-medium text-white hover:text-cyan-200"
          >
            {lesson.title}
          </Link>
          <p
            className={`text-xs ${warn ? 'text-amber-200/90' : 'text-white/45'}`}
          >
            {detail}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 pl-[3.4rem] sm:pl-0">
        {vr && lesson.vr_request_id ? (
          <Link
            className="secondary-btn"
            to={`/app/sessoes/${lesson.vr_request_id}`}
          >
            Resultado
          </Link>
        ) : null}
        {vr ? (
          !passed ? (
            <Link
              className="primary-btn sm:w-auto sm:px-4"
              to={startLink({
                classId: path.class_id,
                lessonId: lesson.id,
                enrollmentId: path.enrollment_id,
              })}
            >
              <Glasses className="h-4 w-4" />{' '}
              {lesson.attempts ? 'Tentar de novo' : 'Iniciar'}
            </Link>
          ) : null
        ) : (
          <Link
            className={
              finished ? 'secondary-btn' : 'primary-btn sm:w-auto sm:px-4'
            }
            to={href}
          >
            <meta.icon className="h-4 w-4" />{' '}
            {finished
              ? 'Rever'
              : quiz && lesson.attempts
                ? 'Tentar de novo'
                : meta.open}
          </Link>
        )}
      </div>
    </li>
  );
}

/** Um curso do aluno: etapas e, ao lado, o progresso, a validade e o certificado. */
export default function MeuCurso() {
  const { enrollmentId = '', classCourseId = '' } = useParams();
  const data = useLoad(
    () =>
      api<CourseAnalytics>(
        `/me/courses/${enrollmentId}/${classCourseId}/analytics`
      ),
    [enrollmentId, classCourseId]
  );
  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <>
        <PageTitle
          back="/app/meus-cursos"
          backLabel="Meus cursos"
          title="Curso"
        />
        <ErrorState
          message={data.error || 'Curso não encontrado.'}
          onRetry={() => void data.reload()}
        />
      </>
    );
  const { path, kpis } = data.data;
  const cover = courseCover(path.course_cover_url);
  const certified = ['apto', 'a_vencer', 'vencido'].includes(path.status);
  const next = path.lessons.find(
    (l) =>
      !l.completed_at || (l.type === 'vr_training' && l.vr_outcome !== 'passed')
  );
  const vr = path.lessons.filter((l) => l.type === 'vr_training').length;
  const base = `/app/meus-cursos/${path.enrollment_id}/${path.class_course_id}`;

  return (
    <>
      <PageTitle
        back="/app/meus-cursos"
        backLabel="Meus cursos"
        title={path.course_title}
      />
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-white/10">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="h-40 w-full object-cover sm:h-48"
            />
          ) : (
            <div className="grid h-40 w-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20 sm:h-48">
              <GraduationCap className="h-12 w-12 text-white/45" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0918] via-[#0b0918]/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
              <span>{path.class_name}</span>
              {path.workload_hours ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{' '}
                  {formatHours(path.workload_hours)}
                </span>
              ) : null}
              <span>{plural(path.lessons.length, 'etapa', 'etapas')}</span>
              {vr ? (
                <span className="inline-flex items-center gap-1">
                  <Glasses className="h-3.5 w-3.5" />{' '}
                  {plural(vr, 'treinamento VR', 'treinamentos VR')}
                </span>
              ) : null}
            </p>
            {path.course_description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-white/65">
                {path.course_description}
              </p>
            ) : null}
          </div>
        </section>

        {path.status === 'vencido' || path.status === 'revisar' ? (
          <Notice tone="warn">{complianceHelp[path.status]}</Notice>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card title="Etapas">
            <ol className="-my-1 divide-y divide-white/[0.06]">
              {path.lessons.map((lesson, i) => (
                <LessonItem
                  key={lesson.id}
                  index={i}
                  path={path}
                  lesson={lesson}
                />
              ))}
            </ol>
          </Card>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="p-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="p-card-title">Seu progresso</h2>
                <ComplianceBadge status={path.status} />
              </div>
              <p className="mt-4 text-4xl font-semibold tabular-nums text-white">
                {path.completion_percent}
                <span className="text-xl text-white/50">%</span>
              </p>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                  style={{ width: `${path.completion_percent}%` }}
                />
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Etapas concluídas</dt>
                  <dd className="tabular-nums text-white">
                    {kpis.lessons_done} de {kpis.lessons_total}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Tempo de estudo</dt>
                  <dd className="tabular-nums text-white">
                    {formatMinutes(kpis.study_minutes)}
                  </dd>
                </div>
                {path.valid_until ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Válido até</dt>
                    <dd className="tabular-nums text-white">
                      {formatDate(path.valid_until)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-5 flex flex-col gap-2">
                {next ? (
                  <Link
                    to={`${base}/etapas/${next.id}`}
                    className="primary-btn"
                  >
                    <Play className="h-4 w-4" />{' '}
                    {kpis.lessons_done ? 'Continuar' : 'Começar'}
                    <span className="truncate font-normal text-white/75">
                      · {next.title}
                    </span>
                  </Link>
                ) : null}
                {certified ? (
                  <Link
                    to={`/app/certificados/${path.enrollment_id}/${path.class_course_id}`}
                    className="secondary-btn"
                  >
                    <Award className="h-4 w-4" /> Certificado
                  </Link>
                ) : null}
                <Link
                  to={`/app/desempenho/${path.enrollment_id}/${path.class_course_id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-1 text-sm text-cyan-200 hover:text-white"
                >
                  <BarChart3 className="h-4 w-4" /> Meu desempenho no curso
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
