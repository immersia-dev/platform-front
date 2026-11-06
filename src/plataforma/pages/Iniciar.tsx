import { Archive, Check, Glasses, Play, UsersRound } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import {
  api,
  errorText,
  post,
  type Analytics,
  type Classroom,
  type Course,
  type LearningPath,
  type Lesson,
  type VrRequest,
} from '../api';
import {
  courseCover,
  criterionText,
  formatCode,
  formatRelative,
  formatScore,
  plural,
  useLoad,
} from '../format';
import {
  Avatar,
  Card,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageTitle,
  SearchField,
  Segmented,
} from '../ui';

type Training = {
  key: string;
  lessonId: string;
  title: string;
  course: string;
  cover: string | null;
  criterion: string;
  classCourseId?: string;
  enrollmentId?: string;
  passed?: number;
  total?: number;
  status?: ReactNode;
};

function Step({
  n,
  title,
  children,
  aside,
}: {
  n: number;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-white">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-400/15 text-xs text-cyan-100">
            {n}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}

/** Cartão do treinamento com a foto de capa do curso (ou um degradê), como na galeria do aluno. */
function TrainingCard({
  training: t,
  active,
  onClick,
  children,
}: {
  training: Training;
  active: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition ${active ? 'border-cyan-300/60 ring-2 ring-cyan-300/30' : 'border-white/10 hover:border-white/25'} bg-white/[0.03]`}
    >
      <span className="relative block h-32 overflow-hidden">
        {t.cover ? (
          <img
            src={t.cover}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20">
            <Glasses className="h-9 w-9 text-white/50" />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-[#0b0918] via-[#0b0918]/30 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <Glasses className="h-3.5 w-3.5" /> VR
        </span>
        {active ? (
          <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-cyan-300 text-[#0b0918]">
            <Check className="h-4 w-4" />
          </span>
        ) : null}
        <span className="absolute inset-x-3 bottom-2.5">
          <span className="block font-semibold leading-snug text-white">
            {t.title}
          </span>
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-2 p-3.5">
        <span className="text-xs text-white/50">{t.criterion}</span>
        {children}
      </span>
    </button>
  );
}

function LessonStatus({ lesson }: { lesson: LearningPath['lessons'][number] }) {
  if (lesson.vr_status === 'pending' || lesson.vr_status === 'running')
    return (
      <span className="status-pill border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
        Em andamento
      </span>
    );
  if (lesson.vr_outcome === 'passed')
    return (
      <span className="status-pill status-pill-success">
        Aprovado · {formatScore(lesson.best_score)}
      </span>
    );
  if (lesson.attempts)
    return (
      <span className="status-pill border-amber-300/25 bg-amber-400/10 text-amber-100">
        Abaixo do critério · {formatScore(lesson.best_score)}
      </span>
    );
  return <span className="status-pill status-pill-muted">Não fez</span>;
}

/** Iniciar: turma → treinamento → aluno (instrutor), ou só o treinamento (aluno e rodada de teste); depois o código. */
export default function Iniciar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isInstructor = user?.role === 'instructor';
  const [mode, setMode] = useState<'assessment' | 'practice'>(
    isInstructor && params.get('modo') === 'teste' ? 'practice' : 'assessment'
  );
  const [classId, setClassId] = useState(params.get('turma') ?? '');
  const [trainingKey, setTrainingKey] = useState('');
  const [enrollmentId, setEnrollmentId] = useState(
    params.get('matricula') ?? ''
  );
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const wantedLesson = params.get('licao');

  const data = useLoad(async () => {
    if (!isInstructor)
      return {
        paths: await api<LearningPath[]>('/me/learning'),
        classes: [] as Classroom[],
        practice: [] as Training[],
        lastActivity: {} as Record<string, string | null>,
      };
    const [paths, classes, courses, analytics] = await Promise.all([
      api<LearningPath[]>('/compliance'),
      api<Classroom[]>('/classes'),
      api<Course[]>('/courses'),
      api<Analytics>('/analytics?days=0').catch(() => null),
    ]);
    // última tentativa de cada turma, para ordenar por atividade recente
    const lastActivity: Record<string, string | null> = {};
    for (const c of analytics?.classes ?? [])
      lastActivity[c.class_id] = c.last_attempt_at;
    const practice: Training[] = [];
    for (const course of courses.filter(
      (c) => c.published_at && !c.archived_at
    )) {
      const lessons = await api<Lesson[]>(
        `/courses/${course.id}/lessons`
      ).catch(() => [] as Lesson[]);
      for (const l of lessons.filter((x) => x.type === 'vr_training'))
        practice.push({
          key: l.id,
          lessonId: l.id,
          title: l.title,
          course: course.title,
          cover: courseCover(course.cover_url),
          criterion: criterionText(l.passing_score, l.max_critical_errors),
        });
    }
    return { paths, classes, practice, lastActivity };
  }, [isInstructor]);

  const paths = useMemo(() => data.data?.paths ?? [], [data.data]);

  // instrutor: turmas com alunos; treinamentos VR da turma; alunos da turma com a situação no treinamento
  const classes = useMemo(() => {
    const counts = new Map<string, Set<string>>();
    for (const p of paths) {
      const set = counts.get(p.class_id) ?? new Set<string>();
      set.add(p.enrollment_id);
      counts.set(p.class_id, set);
    }
    return (data.data?.classes ?? []).map((c) => ({
      ...c,
      learners: counts.get(c.id)?.size ?? 0,
      lastActivity: data.data?.lastActivity[c.id] ?? null,
    }));
  }, [data.data, paths]);

  // escolha da turma: ativas ou arquivadas, busca, ordenação e "mostrar mais" quando são muitas
  const CLASS_LIMIT = 12;
  const [classQuery, setClassQuery] = useState('');
  const [classScope, setClassScope] = useState<'active' | 'archived'>('active');
  const [classSort, setClassSort] = useState<'activity' | 'name' | 'learners'>(
    'activity'
  );
  const [allClasses, setAllClasses] = useState(false);
  const archivedCount = classes.filter((c) => c.archived_at).length;
  const activeCount = classes.length - archivedCount;
  const classMatches = useMemo(() => {
    const plain = (text: string) =>
      text
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const term = plain(classQuery.trim());
    return classes
      .filter(
        (c) =>
          (classScope === 'archived') === Boolean(c.archived_at) &&
          (!term || plain(c.name).includes(term))
      )
      .sort((a, b) => {
        const byName = a.name.localeCompare(b.name, 'pt-BR');
        if (classSort === 'name') return byName;
        if (classSort === 'learners') return b.learners - a.learners || byName;
        return (
          (b.lastActivity ?? '').localeCompare(a.lastActivity ?? '') || byName
        );
      });
  }, [classes, classQuery, classScope, classSort]);
  const shownClasses =
    allClasses || classMatches.length <= CLASS_LIMIT
      ? classMatches
      : [
          ...classMatches.slice(0, CLASS_LIMIT),
          ...classMatches.slice(CLASS_LIMIT).filter((c) => c.id === classId), // a escolhida sempre aparece
        ];

  const trainings: Training[] = useMemo(() => {
    if (mode === 'practice') return data.data?.practice ?? [];
    const out = new Map<string, Training>();
    for (const p of paths) {
      if (isInstructor && p.class_id !== classId) continue;
      for (const l of p.lessons.filter((x) => x.type === 'vr_training')) {
        const key = isInstructor
          ? `${p.class_course_id}:${l.id}`
          : `${p.enrollment_id}:${p.class_course_id}:${l.id}`;
        const item = out.get(key) ?? {
          key,
          lessonId: l.id,
          title: l.title,
          course: p.course_title,
          cover: courseCover(p.course_cover_url),
          criterion: criterionText(l.passing_score, l.max_critical_errors),
          classCourseId: p.class_course_id,
          enrollmentId: isInstructor ? undefined : p.enrollment_id,
          passed: 0,
          total: 0,
          status: isInstructor ? undefined : <LessonStatus lesson={l} />,
        };
        item.total = (item.total ?? 0) + 1;
        if (l.vr_outcome === 'passed') item.passed = (item.passed ?? 0) + 1;
        out.set(key, item);
      }
    }
    return [...out.values()];
  }, [mode, data.data, paths, isInstructor, classId]);
  const training = trainings.find((t) => t.key === trainingKey);

  // treinamento: busca (título ou curso), filtro de curso e ordenação; o escolhido nunca some
  const [trainingQuery, setTrainingQuery] = useState('');
  const [trainingCourse, setTrainingCourse] = useState('');
  const [trainingSort, setTrainingSort] = useState<'course' | 'name' | 'todo'>(
    'course'
  );
  const trainingCourses = useMemo(
    () =>
      [...new Set(trainings.map((t) => t.course))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [trainings]
  );
  const trainingList = useMemo(() => {
    const plain = (text: string) =>
      text
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const term = plain(trainingQuery.trim());
    const pending = (t: Training) => (t.total ?? 0) - (t.passed ?? 0);
    // outra turma pode não ter o curso escolhido: aí o filtro deixa de valer
    const courseFilter = trainingCourses.includes(trainingCourse)
      ? trainingCourse
      : '';
    return trainings
      .filter(
        (t) =>
          t.key === trainingKey ||
          ((!term || plain(`${t.title} ${t.course}`).includes(term)) &&
            (!courseFilter || t.course === courseFilter))
      )
      .sort((a, b) => {
        const byName = a.title.localeCompare(b.title, 'pt-BR');
        if (trainingSort === 'name') return byName;
        if (trainingSort === 'todo') return pending(b) - pending(a) || byName;
        return a.course.localeCompare(b.course, 'pt-BR') || byName;
      });
  }, [
    trainings,
    trainingQuery,
    trainingCourse,
    trainingSort,
    trainingKey,
    trainingCourses,
  ]);

  // aluno: busca, situação no treinamento e ordenação (quem ainda não foi aprovado vem primeiro)
  const [learnerStatus, setLearnerStatus] = useState<'all' | 'todo' | 'passed'>(
    'all'
  );
  const [learnerSort, setLearnerSort] = useState<
    'status' | 'name' | 'fewer' | 'score'
  >('status');
  const inTraining = useMemo(() => {
    if (!isInstructor || !training?.classCourseId) return [];
    return paths
      .filter((p) => p.class_course_id === training.classCourseId)
      .flatMap((p) => {
        const lesson = p.lessons.find((l) => l.id === training.lessonId);
        return lesson ? [{ path: p, lesson }] : [];
      });
  }, [isInstructor, training, paths]);
  const passedCount = inTraining.filter(
    (r) => r.lesson.vr_outcome === 'passed'
  ).length;
  const learners = useMemo(() => {
    const plain = (text: string) =>
      text
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const term = plain(search.trim());
    // não fez → abaixo do critério → aprovado
    const rank = (r: (typeof inTraining)[number]) =>
      r.lesson.vr_outcome === 'passed' ? 2 : r.lesson.attempts ? 1 : 0;
    return inTraining
      .filter(
        (r) =>
          (!term || plain(r.path.student_name).includes(term)) &&
          (learnerStatus === 'all' ||
            (learnerStatus === 'passed') ===
              (r.lesson.vr_outcome === 'passed') ||
            r.path.enrollment_id === enrollmentId)
      )
      .sort((a, b) => {
        const byName = a.path.student_name.localeCompare(
          b.path.student_name,
          'pt-BR'
        );
        if (learnerSort === 'name') return byName;
        if (learnerSort === 'fewer')
          return a.lesson.attempts - b.lesson.attempts || byName;
        if (learnerSort === 'score')
          return (
            Number(b.lesson.best_score ?? -1) -
              Number(a.lesson.best_score ?? -1) || byName
          );
        return rank(a) - rank(b) || byName;
      });
  }, [inTraining, search, learnerStatus, learnerSort, enrollmentId]);
  const learner =
    learners.find((r) => r.path.enrollment_id === enrollmentId) ?? null;

  // escolhas únicas já vêm marcadas; o link pode trazer turma, treinamento e aluno
  useEffect(() => {
    if (!data.data || !isInstructor || mode !== 'assessment' || classId) return;
    const fromLink = paths.find(
      (p) => p.enrollment_id === enrollmentId
    )?.class_id;
    const withLearners = classes.filter((c) => c.learners && !c.archived_at);
    if (fromLink) setClassId(fromLink);
    else if (withLearners.length === 1) setClassId(withLearners[0].id);
  }, [data.data, isInstructor, mode, classId, classes, paths, enrollmentId]);
  useEffect(() => {
    if (trainings.some((t) => t.key === trainingKey)) return;
    const wanted =
      trainings.find(
        (t) =>
          t.lessonId === wantedLesson &&
          (!t.enrollmentId || !enrollmentId || t.enrollmentId === enrollmentId)
      ) ??
      (!isInstructor
        ? trainings.find((t) => !(t.passed && t.passed === t.total))
        : undefined);
    setTrainingKey(
      wanted?.key ?? (trainings.length === 1 ? trainings[0].key : '')
    );
  }, [trainings, trainingKey, wantedLesson, enrollmentId, isInstructor]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!training) return setError('Escolha o treinamento.');
    if (isInstructor && mode === 'assessment' && !learner)
      return setError('Escolha o aluno.');
    if (code.replace('-', '').length < 6)
      return setError('Digite os 6 caracteres que aparecem no Quest.');
    const body =
      mode === 'practice'
        ? { lesson_id: training.lessonId }
        : {
            enrollment_id: isInstructor
              ? learner?.path.enrollment_id
              : training.enrollmentId,
            class_course_id: training.classCourseId,
            lesson_id: training.lessonId,
          };
    setSending(true);
    try {
      const created = await post<VrRequest>('/vr-requests', {
        code,
        mode,
        ...body,
      });
      navigate(`/app/sessoes/${created.id}`);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSending(false);
    }
  }

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  if (!isInstructor && !trainings.length)
    return (
      <>
        <PageTitle title="Iniciar treinamento" />
        <Card>
          <Empty title="Nenhum treinamento VR por enquanto">
            Ele aparece aqui quando sua turma tiver um curso com VR.
          </Empty>
        </Card>
      </>
    );

  const assessment = isInstructor && mode === 'assessment';
  const numbers = {
    turma: 1,
    treinamento: assessment ? 2 : 1,
    aluno: 3,
    codigo: assessment ? (training ? 4 : 3) : 2,
  };

  return (
    <>
      <PageTitle
        title="Iniciar treinamento"
        actions={
          isInstructor ? (
            <Segmented
              value={mode}
              onChange={(value) => {
                setMode(value);
                setTrainingKey('');
                setError('');
              }}
              options={[
                { value: 'assessment', label: 'Para um aluno' },
                { value: 'practice', label: 'Rodada de teste' },
              ]}
            />
          ) : null
        }
      />

      <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {assessment ? (
            <Step n={numbers.turma} title="Turma">
              {classes.length ? (
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <SearchField
                    value={classQuery}
                    onChange={setClassQuery}
                    placeholder="Buscar turma"
                    className="w-full sm:w-56"
                  />
                  {archivedCount ? (
                    <Segmented
                      value={classScope}
                      onChange={(v) => {
                        setClassScope(v);
                        setAllClasses(false);
                      }}
                      options={[
                        { value: 'active', label: `Ativas ${activeCount}` },
                        {
                          value: 'archived',
                          label: `Arquivadas ${archivedCount}`,
                        },
                      ]}
                    />
                  ) : null}
                  <select
                    className="admin-select sm:ml-auto sm:w-52"
                    value={classSort}
                    onChange={(e) =>
                      setClassSort(e.target.value as typeof classSort)
                    }
                    aria-label="Ordenar turmas"
                  >
                    <option value="activity">Atividade recente</option>
                    <option value="name">Nome</option>
                    <option value="learners">Mais alunos</option>
                  </select>
                </div>
              ) : null}
              {classes.length && !classMatches.length ? (
                <p className="text-sm text-white/50">
                  {classQuery
                    ? 'Nenhuma turma encontrada.'
                    : classScope === 'archived'
                      ? 'Nenhuma turma arquivada.'
                      : 'Nenhuma turma ativa.'}
                </p>
              ) : classes.length ? (
                <>
                  {classScope === 'archived' ? (
                    <p className="mb-2 text-xs text-white/45">
                      Turma arquivada não inicia treinamento: o gestor pode
                      reativá-la em Turmas.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {shownClasses.map((c) => {
                      const archived = Boolean(c.archived_at);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={archived}
                          aria-pressed={c.id === classId}
                          title={
                            c.lastActivity
                              ? `Última tentativa ${formatRelative(c.lastActivity)}`
                              : 'Sem tentativas ainda'
                          }
                          onClick={() => {
                            setClassId(c.id);
                            setTrainingKey('');
                            setEnrollmentId('');
                          }}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${c.id === classId ? 'border-cyan-300/50 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25'}`}
                        >
                          {archived ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <UsersRound className="h-4 w-4" />
                          )}{' '}
                          {c.name}
                          <span className="text-xs text-white/45">
                            {c.learners}
                          </span>
                        </button>
                      );
                    })}
                    {classMatches.length > CLASS_LIMIT ? (
                      <button
                        type="button"
                        className="p-action self-center"
                        onClick={() => setAllClasses(!allClasses)}
                      >
                        {allClasses
                          ? 'Mostrar menos'
                          : `Mais ${classMatches.length - CLASS_LIMIT}`}
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <Empty title="Você ainda não está em nenhuma turma">
                  O gestor da organização inclui instrutores nas turmas.
                </Empty>
              )}
            </Step>
          ) : null}

          <Step n={numbers.treinamento} title="Treinamento">
            {trainings.length > 1 ? (
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <SearchField
                  value={trainingQuery}
                  onChange={setTrainingQuery}
                  placeholder="Buscar treinamento ou curso"
                  className="w-full sm:min-w-48 sm:flex-1"
                />
                {trainingCourses.length > 1 ? (
                  <select
                    className="admin-select sm:w-60"
                    value={
                      trainingCourses.includes(trainingCourse)
                        ? trainingCourse
                        : ''
                    }
                    onChange={(e) => setTrainingCourse(e.target.value)}
                    aria-label="Curso"
                  >
                    <option value="">Todos os cursos</option>
                    {trainingCourses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select
                  className="admin-select sm:w-44"
                  value={trainingSort}
                  onChange={(e) =>
                    setTrainingSort(e.target.value as typeof trainingSort)
                  }
                  aria-label="Ordenar treinamentos"
                >
                  <option value="course">Por curso</option>
                  <option value="name">Nome</option>
                  {assessment ? (
                    <option value="todo">Mais alunos a fazer</option>
                  ) : null}
                </select>
              </div>
            ) : null}
            {trainings.length && !trainingList.length ? (
              <p className="text-sm text-white/50">
                Nenhum treinamento encontrado.
              </p>
            ) : trainings.length ? (
              <div className="space-y-5">
                {[...new Set(trainingList.map((t) => t.course))].map(
                  (courseTitle) => {
                    const inCourse = trainingList.filter(
                      (t) => t.course === courseTitle
                    );
                    return (
                      <section key={courseTitle}>
                        <p className="mb-2 flex items-center gap-2 text-xs text-white/50">
                          <span className="font-medium uppercase tracking-wide text-cyan-100/80">
                            Curso
                          </span>
                          <span className="text-white/80">{courseTitle}</span>
                          <span className="text-white/35">
                            ·{' '}
                            {inCourse.length === 1
                              ? '1 treinamento VR'
                              : `${inCourse.length} treinamentos VR`}
                          </span>
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {inCourse.map((t) => (
                            <TrainingCard
                              key={t.key}
                              training={t}
                              active={t.key === trainingKey}
                              onClick={() => setTrainingKey(t.key)}
                            >
                              {t.status ? <span>{t.status}</span> : null}
                              {assessment && t.total ? (
                                <span className="text-xs text-white/55">
                                  {t.passed}/{t.total} aprovados
                                </span>
                              ) : null}
                            </TrainingCard>
                          ))}
                        </div>
                      </section>
                    );
                  }
                )}
              </div>
            ) : (
              <Empty
                title={
                  assessment && !classId
                    ? 'Escolha a turma'
                    : 'Nenhum treinamento VR aqui'
                }
              />
            )}
          </Step>

          {assessment && training ? (
            <Step
              n={numbers.aluno}
              title="Aluno"
              aside={
                <span className="text-xs text-white/45">
                  {learners.length === inTraining.length
                    ? plural(learners.length, 'aluno', 'alunos')
                    : `${learners.length} de ${inTraining.length}`}
                </span>
              }
            >
              {inTraining.length ? (
                <div className="mb-3 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <SearchField
                      value={search}
                      onChange={setSearch}
                      placeholder="Buscar pelo nome"
                      className="w-full sm:flex-1"
                    />
                    <select
                      className="admin-select sm:w-44"
                      value={learnerSort}
                      onChange={(e) =>
                        setLearnerSort(e.target.value as typeof learnerSort)
                      }
                      aria-label="Ordenar alunos"
                    >
                      <option value="status">Situação</option>
                      <option value="name">Nome</option>
                      <option value="fewer">Menos tentativas</option>
                      <option value="score">Maior nota</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <Segmented
                      value={learnerStatus}
                      onChange={setLearnerStatus}
                      options={[
                        { value: 'all', label: `Todos ${inTraining.length}` },
                        {
                          value: 'todo',
                          label: `A fazer ${inTraining.length - passedCount}`,
                        },
                        { value: 'passed', label: `Aprovados ${passedCount}` },
                      ]}
                    />
                  </div>
                </div>
              ) : null}
              {learners.length ? (
                <ul className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
                  {learners.map(({ path, lesson }) => {
                    const active = path.enrollment_id === enrollmentId;
                    const busy =
                      lesson.vr_status === 'pending' ||
                      lesson.vr_status === 'running';
                    return (
                      <li key={path.enrollment_id}>
                        <button
                          type="button"
                          aria-pressed={active}
                          disabled={busy}
                          onClick={() => setEnrollmentId(path.enrollment_id)}
                          className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition disabled:opacity-50 ${active ? 'border-cyan-300/50 bg-cyan-400/10' : 'border-transparent hover:bg-white/[0.04]'}`}
                        >
                          <Avatar name={path.student_name} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white">
                              {path.student_name}
                            </span>
                            <span className="block text-xs text-white/40">
                              {lesson.attempts
                                ? plural(
                                    lesson.attempts,
                                    'tentativa',
                                    'tentativas'
                                  )
                                : 'Nenhuma tentativa'}
                            </span>
                          </span>
                          <span className="hidden sm:inline">
                            <LessonStatus lesson={lesson} />
                          </span>
                          {active ? (
                            <Check className="h-4 w-4 shrink-0 text-cyan-200" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty
                  title={
                    search
                      ? 'Ninguém com esse nome'
                      : inTraining.length
                        ? learnerStatus === 'passed'
                          ? 'Ninguém aprovado ainda'
                          : 'Todos já foram aprovados'
                        : 'Nenhum aluno nesta turma'
                  }
                />
              )}
            </Step>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-6 lg:col-span-2">
          <Card>
            <h2 className="mb-1 flex items-center gap-2.5 text-base font-semibold text-white">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-400/15 text-xs text-cyan-100">
                {numbers.codigo}
              </span>
              Código do Quest
            </h2>
            <p className="mb-4 text-sm text-white/50">
              Coloque o Quest e digite o código que aparece no painel.
            </p>
            <input
              className="p-code"
              value={code}
              onChange={(e) => setCode(formatCode(e.target.value))}
              placeholder="K7Q-4M2"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Código mostrado no Quest"
            />

            <dl className="mt-5 space-y-2 text-sm">
              {assessment ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-white/45">Aluno</dt>
                  <dd className="truncate text-right text-white">
                    {learner?.path.student_name ?? '—'}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-white/45">Curso</dt>
                <dd className="truncate text-right text-white">
                  {training?.course ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/45">Treinamento VR</dt>
                <dd className="truncate text-right text-white">
                  {training?.title ?? '—'}
                </dd>
              </div>
            </dl>

            {mode === 'practice' ? (
              <div className="mt-4">
                <Notice tone="warn">
                  Rodada de teste: o Quest avisa que é um teste e o resultado
                  não conta para ninguém.
                </Notice>
              </div>
            ) : null}
            {error ? (
              <div className="mt-4">
                <Notice tone="error">{error}</Notice>
              </div>
            ) : null}

            <button
              type="submit"
              className="primary-btn mt-5 w-full"
              disabled={sending}
            >
              <Play className="h-4 w-4" />
              {sending ? 'Enviando ao Quest…' : 'Enviar para o Quest'}
            </button>
          </Card>
        </div>
      </form>
    </>
  );
}
