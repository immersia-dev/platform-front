import { Eye } from 'lucide-react';
import { useParams } from 'react-router-dom';

import {
  api,
  post,
  type Course,
  type Lesson,
  type LessonContent,
  type QuizResult,
} from '../api';
import { criterionText, useLoad } from '../format';
import { formatMinutesShort, kindMeta, lessonKind } from '../lessons';
import {
  LessonBody,
  LessonNav,
  LessonOutline,
  QuizRunner,
} from '../LessonView';
import { Card, ErrorState, Loading, Notice, PageTitle } from '../ui';

/** Ver uma etapa como o aluno vê (Immersia e gestor). O quiz é corrigido sem registrar nada. */
export default function EtapaPrevia() {
  const { courseId = '', lessonId = '' } = useParams();
  const base = `/app/cursos/${courseId}`;
  const data = useLoad(async () => {
    const [course, lessons, content] = await Promise.all([
      api<Course>(`/courses/${courseId}`),
      api<Lesson[]>(`/courses/${courseId}/lessons`),
      api<LessonContent>(`/lessons/${lessonId}/content`),
    ]);
    return { course, lessons, content };
  }, [courseId, lessonId]);

  if (data.loading && !data.data) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const { course, lessons, content } = data.data;
  const index = lessons.findIndex((l) => l.id === lessonId);
  const kind = lessonKind(content);
  const meta = kindMeta[kind];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const minutes = formatMinutesShort(content.duration_minutes);
  // o quiz da pré-visualização é corrigido no servidor, sem o gabarito no navegador e sem registrar
  const learnerView: LessonContent = content.quiz
    ? {
        ...content,
        quiz: {
          questions: content.quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            multiple: q.multiple,
            options: q.options,
          })),
        },
      }
    : content;
  const check = (answers: Record<string, string[]>) =>
    post<QuizResult>(`/lessons/${lessonId}/quiz/check`, { answers });

  return (
    <>
      <PageTitle
        back={base}
        backLabel={course.title}
        title={content.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{course.title}</span>
            <span className="text-white/30">·</span>
            <span>
              Etapa {index + 1} de {lessons.length}
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
          </span>
        }
      />
      <div className="mb-5">
        <Notice>
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4" /> Pré-visualização: é assim que o aluno vê
            esta etapa. Nada é registrado.
          </span>
        </Notice>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card>
            {kind === 'quiz' ? (
              <QuizRunner
                key={content.id}
                content={learnerView}
                onSubmit={check}
                preview
              />
            ) : kind === 'vr' ? (
              <p className="text-white/70">
                Prática no Quest ·{' '}
                {criterionText(
                  content.passing_score,
                  content.max_critical_errors
                )}
                . O aluno inicia com o código que aparece no óculos.
              </p>
            ) : (
              <LessonBody content={content} />
            )}
          </Card>
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
            done={false}
            finishHref={base}
          />
        </div>
        <div className="lg:sticky lg:top-6">
          <LessonOutline
            current={lessonId}
            items={lessons.map((l) => ({
              id: l.id,
              title: l.title,
              kind: lessonKind(l),
              done: false,
              minutes: l.duration_minutes,
              href: `${base}/etapas/${l.id}`,
            }))}
          />
        </div>
      </div>
    </>
  );
}
