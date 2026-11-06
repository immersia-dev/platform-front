import { CheckCircle2, Glasses } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  api,
  errorText,
  post,
  type LearningPath,
  type LessonContent,
  type QuizAttemptRow,
  type QuizResult,
} from '../api';
import {
  criterionText,
  formatDate,
  formatScore,
  plural,
  startLink,
  useLoad,
} from '../format';
import { formatMinutesShort, kindMeta, lessonKind } from '../lessons';
import {
  LessonBody,
  LessonNav,
  LessonOutline,
  QuizRunner,
} from '../LessonView';
import { Card, Empty, ErrorState, Loading, Notice, PageTitle } from '../ui';

/** O aluno estuda uma etapa do curso: lê, assiste, abre a apostila ou responde o quiz. */
export default function Etapa() {
  const { enrollmentId = '', classCourseId = '', lessonId = '' } = useParams();
  const base = `/app/meus-cursos/${enrollmentId}/${classCourseId}`;
  const data = useLoad(async () => {
    const [paths, content] = await Promise.all([
      api<LearningPath[]>('/me/learning'),
      api<LessonContent>(`/lessons/${lessonId}/content`),
    ]);
    const path =
      paths.find(
        (p) =>
          p.enrollment_id === enrollmentId &&
          p.class_course_id === classCourseId
      ) ?? null;
    const history =
      content.type === 'quiz'
        ? await api<QuizAttemptRow[]>(
            `/class-courses/${classCourseId}/quiz/${lessonId}/attempts?enrollment_id=${enrollmentId}`
          ).catch(() => [] as QuizAttemptRow[])
        : [];
    return { path, content, history };
  }, [enrollmentId, classCourseId, lessonId]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (data.loading && !data.data) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const { path, content, history } = data.data;
  if (!path)
    return (
      <>
        <PageTitle back="/app/meus-cursos" title="Etapa" />
        <Card>
          <Empty title="Curso não encontrado">
            Ele pode ter sido retirado da sua turma.
          </Empty>
        </Card>
      </>
    );

  const index = path.lessons.findIndex((l) => l.id === lessonId);
  const item = path.lessons[index];
  const kind = lessonKind(content);
  const meta = kindMeta[kind];
  const prev = path.lessons[index - 1];
  const next = path.lessons[index + 1];
  const done =
    Boolean(item?.completed_at) &&
    (kind !== 'vr' || item?.vr_outcome === 'passed');
  const minutes = formatMinutesShort(content.duration_minutes);

  async function complete() {
    setBusy(true);
    setError('');
    try {
      await post(`/class-courses/${classCourseId}/complete-material`, {
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
      });
      await data.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  const submitQuiz = async (
    answers: Record<string, string[]>,
    seconds: number
  ) => {
    const result = await post<QuizResult>(
      `/class-courses/${classCourseId}/quiz`,
      {
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        answers,
        duration_seconds: seconds,
      }
    );
    void data.reload(true);
    return result;
  };

  const action =
    kind === 'quiz' ? (
      <span
        className={`text-sm ${done ? 'text-emerald-200' : 'text-white/55'}`}
      >
        {done ? (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Aprovado com{' '}
            {formatScore(item?.best_score)}
          </span>
        ) : (
          `Conclui com nota ${formatScore(content.passing_score)} ou mais`
        )}
      </span>
    ) : kind === 'vr' ? (
      <span
        className={`text-sm ${done ? 'text-emerald-200' : 'text-white/55'}`}
      >
        {done ? 'No critério' : 'Conclui pelo resultado no Quest'}
      </span>
    ) : done ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
        <CheckCircle2 className="h-4 w-4" /> Concluída em{' '}
        {formatDate(item?.completed_at)}
      </span>
    ) : (
      <button
        type="button"
        className="primary-btn w-full sm:w-auto sm:px-6"
        disabled={busy}
        onClick={() => void complete()}
      >
        <CheckCircle2 className="h-4 w-4" />{' '}
        {busy ? 'Salvando…' : 'Marcar como concluída'}
      </button>
    );

  return (
    <>
      <PageTitle
        back={base}
        backLabel={path.course_title}
        title={content.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Etapa {index + 1} de {path.lessons.length}
            </span>
            <span className="text-white/30">·</span>
            <span className="inline-flex items-center gap-1">
              <meta.icon className="h-3.5 w-3.5" /> {meta.label}
            </span>
            {minutes ? (
              <>
                <span className="text-white/30">·</span>
                <span>{minutes}</span>
              </>
            ) : null}
            {done ? (
              <span className="status-pill status-pill-success">Concluída</span>
            ) : null}
          </span>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <Card>
            {kind === 'quiz' ? (
              <QuizRunner
                key={content.id}
                content={content}
                onSubmit={submitQuiz}
                history={history}
                passedWith={done ? (item?.best_score ?? null) : null}
              />
            ) : kind === 'vr' ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-violet-400/10 text-violet-100">
                  <Glasses className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-200/80">
                    Treinamento VR do curso {path.course_title}
                  </p>
                  <p className="mt-1 text-white/80">
                    Para aprovar:{' '}
                    {criterionText(
                      content.passing_score,
                      content.max_critical_errors
                    )}
                    {item?.best_score != null
                      ? ` · sua melhor nota é ${formatScore(item.best_score)} em ${plural(item.attempts, 'tentativa', 'tentativas')}`
                      : ' · coloque o Quest e digite o código que aparece no painel'}
                  </p>
                </div>
                <Link
                  className="primary-btn sm:w-auto sm:px-5"
                  to={startLink({
                    classId: path.class_id,
                    lessonId,
                    enrollmentId,
                  })}
                >
                  <Glasses className="h-4 w-4" />{' '}
                  {item?.attempts ? 'Tentar de novo' : 'Iniciar no Quest'}
                </Link>
              </div>
            ) : (
              <LessonBody content={content} />
            )}
          </Card>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <LessonNav
            prev={
              prev
                ? { title: prev.title, href: `${base}/etapas/${prev.id}` }
                : null
            }
            next={
              next
                ? { title: next.title, href: `${base}/etapas/${next.id}` }
                : null
            }
            done={done}
            finishHref={base}
          >
            {action}
          </LessonNav>
        </div>

        <div className="lg:sticky lg:top-6">
          <LessonOutline
            current={lessonId}
            items={path.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              kind: lessonKind(l),
              done:
                Boolean(l.completed_at) &&
                (l.type !== 'vr_training' || l.vr_outcome === 'passed'),
              minutes: l.duration_minutes,
              href: `${base}/etapas/${l.id}`,
            }))}
          />
        </div>
      </div>
    </>
  );
}
