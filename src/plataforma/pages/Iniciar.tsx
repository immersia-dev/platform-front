import {
  Archive,
  Check,
  ChevronDown,
  Circle,
  FlaskConical,
  Glasses,
  Play,
  UsersRound,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
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
  type Quest,
  type VrRequest,
} from '../api';
import {
  courseCover,
  criterionText,
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

/** Uma das escolhas (treinamento, aluno, Quest): cabeçalho numerado e lista que rola por dentro. */
function Panel({
  id,
  n,
  title,
  done,
  aside,
  waiting,
  children,
}: {
  id: string;
  n: number;
  title: string;
  done: boolean;
  aside?: ReactNode;
  /** o que falta antes desta escolha (ex.: "Escolha o treinamento primeiro") */
  waiting?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`flex min-h-0 scroll-mt-24 flex-col rounded-3xl border bg-white/[0.04] p-4 backdrop-blur-xl transition sm:p-5 ${done ? 'border-white/10' : 'border-white/15'}`}
    >
      <header className="mb-3 flex min-h-7 items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-white">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs ${done ? 'bg-emerald-400/20 text-emerald-200' : 'bg-cyan-400/15 text-cyan-100'}`}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : n}
          </span>
          {title}
        </h2>
        {aside}
      </header>
      {waiting ? (
        <div className="grid min-h-32 flex-1 place-items-center rounded-2xl border border-dashed border-white/10 px-4 text-center text-sm text-white/45">
          {waiting}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/** Lista que rola dentro do painel (no celular, com altura máxima). */
function ScrollList({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul
      aria-label={label}
      className="-mx-1 max-h-[24rem] min-h-0 flex-1 space-y-1 overflow-y-auto px-1 lg:max-h-none"
    >
      {children}
    </ul>
  );
}

/** Miniatura da capa do curso (ou um degradê com os óculos). */
function Thumb({ cover }: { cover: string | null }) {
  return (
    <span className="relative block h-11 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10">
      {cover ? (
        <img src={cover} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20">
          <Glasses className="h-5 w-5 text-white/55" />
        </span>
      )}
    </span>
  );
}

/** Linha selecionável das listas: destaque e marca quando escolhida. */
function OptionRow({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? 'border-cyan-300/50 bg-cyan-400/10' : 'border-transparent hover:bg-white/[0.05]'}`}
    >
      {children}
      {active ? <Check className="h-4 w-4 shrink-0 text-cyan-200" /> : null}
    </button>
  );
}

/** Caixa de escolha com painel suspenso (a turma): fecha ao escolher, com Esc ou clicando fora. */
function Dropdown({
  label,
  value,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  value: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node))
        onOpenChange(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, onOpenChange]);
  return (
    <div ref={box} className="relative">
      <span className="mb-1.5 block text-xs font-medium text-white/50">
        {label}
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => onOpenChange(!open)}
        className={`flex w-full items-center gap-2 rounded-[20px] border bg-black/22 px-4 py-2.5 text-left text-sm text-white transition hover:border-white/25 ${open ? 'border-cyan-300/70' : 'border-white/12'}`}
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/60 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-white/12 bg-[#15122a] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        >
          {children}
        </div>
      ) : null}
    </div>
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

/**
 * Iniciar: três escolhas lado a lado, numa tela só — treinamento (com a turma, para o instrutor), aluno e Quest —
 * e um resumo fixo embaixo que mostra o que falta; o envio só libera com tudo escolhido.
 * Aluno e rodada de teste: só treinamento e Quest.
 */
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
  const [questId, setQuestId] = useState('');
  // os Quests da organização, com a situação ao vivo (livre, em uso, sem conexão)
  const quests = useLoad(() => api<Quest[]>('/quests'), [], 8000);
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
  // o aluno escolhido continua escolhido mesmo quando a busca o esconde da lista
  const learner =
    inTraining.find((r) => r.path.enrollment_id === enrollmentId) ?? null;

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

  // Quest: a lista se atualiza sozinha; com um só livre, ele já vem escolhido
  const questList = useMemo(() => quests.data ?? [], [quests.data]);
  const quest = questList.find((q) => q.id === questId) ?? null;
  const questReady = Boolean(quest && questIsFree(quest));
  const freeQuests = questList.filter(questIsFree);
  const onlyFreeQuest = freeQuests.length === 1 ? freeQuests[0].id : '';
  useEffect(() => {
    if (!questId && onlyFreeQuest) setQuestId(onlyFreeQuest);
  }, [questId, onlyFreeQuest]);

  const [classOpen, setClassOpen] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!training) return setError('Escolha o treinamento.');
    if (isInstructor && mode === 'assessment' && !learner)
      return setError('Escolha o aluno.');
    if (!questId || !questReady)
      return setError('Escolha o Quest em que o treinamento vai começar.');
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
        quest_id: questId,
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
  const chosenClass = classes.find((c) => c.id === classId) ?? null;
  const panels = {
    training: 'escolha-treinamento',
    learner: 'escolha-aluno',
    quest: 'escolha-quest',
  };

  // o resumo: cada escolha com o valor ou "falta escolher"; o botão só libera quando está tudo certo
  const summary: {
    panel: string;
    label: string;
    value: string | null;
    detail?: string;
    missing: string;
  }[] = [
    ...(assessment
      ? [
          {
            panel: panels.training,
            label: 'Turma',
            value: chosenClass?.name ?? null,
            missing: 'a turma',
          },
        ]
      : []),
    {
      panel: panels.training,
      label: 'Treinamento VR',
      value: training?.title ?? null,
      detail: training?.course,
      missing: 'o treinamento',
    },
    ...(assessment
      ? [
          {
            panel: panels.learner,
            label: 'Aluno',
            value: learner?.path.student_name ?? null,
            missing: 'o aluno',
          },
        ]
      : []),
    {
      panel: panels.quest,
      label: 'Quest',
      value: questReady ? (quest?.name ?? 'Quest') : null,
      missing: quest ? 'outro Quest' : 'o Quest',
    },
  ];
  const missing = summary.filter((s) => !s.value).map((s) => s.missing);
  const missingText = missing.length
    ? `Falta escolher ${
        missing.length === 1
          ? missing[0]
          : `${missing.slice(0, -1).join(', ')} e ${missing[missing.length - 1]}`
      }.`
    : '';
  const goTo = (panel: string) =>
    document
      .getElementById(panel)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const questStep = assessment ? 3 : 2;

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-9.75rem)] lg:min-h-[36rem]">
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

      <form
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col gap-4"
        noValidate
      >
        <div
          className={`grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] ${assessment ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]' : 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'}`}
        >
          {/* 1. Turma (instrutor) e treinamento */}
          <Panel
            id={panels.training}
            n={1}
            title="Treinamento"
            done={Boolean(training) && (!assessment || Boolean(classId))}
            aside={
              trainings.length > 1 ? (
                <span className="text-xs text-white/45">
                  {trainingList.length === trainings.length
                    ? plural(trainings.length, 'treinamento', 'treinamentos')
                    : `${trainingList.length} de ${trainings.length}`}
                </span>
              ) : null
            }
          >
            {assessment ? (
              classes.length ? (
                <div className="mb-3">
                  <Dropdown
                    label="Turma"
                    open={classOpen}
                    onOpenChange={setClassOpen}
                    value={
                      chosenClass ? (
                        <span className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4 shrink-0 text-white/55" />
                          <span className="truncate">{chosenClass.name}</span>
                          <span className="text-xs text-white/45">
                            {plural(chosenClass.learners, 'aluno', 'alunos')}
                          </span>
                        </span>
                      ) : (
                        <span className="text-amber-200">Escolha a turma</span>
                      )
                    }
                  >
                    <div className="space-y-2">
                      <SearchField
                        value={classQuery}
                        onChange={setClassQuery}
                        placeholder="Buscar turma"
                      />
                      <div className="flex flex-wrap items-center gap-2">
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
                          className="admin-select ml-auto w-44 py-2"
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
                      {classScope === 'archived' && classMatches.length ? (
                        <p className="text-xs text-white/45">
                          Turma arquivada não inicia treinamento: o gestor pode
                          reativá-la em Turmas.
                        </p>
                      ) : null}
                      {classMatches.length ? (
                        <ul className="max-h-64 space-y-1 overflow-y-auto">
                          {shownClasses.map((c) => {
                            const archived = Boolean(c.archived_at);
                            return (
                              <li key={c.id}>
                                <OptionRow
                                  active={c.id === classId}
                                  disabled={archived}
                                  onClick={() => {
                                    setClassId(c.id);
                                    setTrainingKey('');
                                    setEnrollmentId('');
                                    setClassOpen(false);
                                  }}
                                >
                                  {archived ? (
                                    <Archive className="h-4 w-4 shrink-0 text-white/50" />
                                  ) : (
                                    <UsersRound className="h-4 w-4 shrink-0 text-white/50" />
                                  )}
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm text-white">
                                      {c.name}
                                    </span>
                                    <span className="block text-xs text-white/40">
                                      {plural(c.learners, 'aluno', 'alunos')} ·{' '}
                                      {c.lastActivity
                                        ? `última tentativa ${formatRelative(c.lastActivity)}`
                                        : 'sem tentativas ainda'}
                                    </span>
                                  </span>
                                </OptionRow>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="px-1 py-2 text-sm text-white/50">
                          {classQuery
                            ? 'Nenhuma turma encontrada.'
                            : classScope === 'archived'
                              ? 'Nenhuma turma arquivada.'
                              : 'Nenhuma turma ativa.'}
                        </p>
                      )}
                      {classMatches.length > CLASS_LIMIT ? (
                        <button
                          type="button"
                          className="p-action"
                          onClick={() => setAllClasses(!allClasses)}
                        >
                          {allClasses
                            ? 'Mostrar menos'
                            : `Mais ${classMatches.length - CLASS_LIMIT}`}
                        </button>
                      ) : null}
                    </div>
                  </Dropdown>
                </div>
              ) : (
                <Empty title="Você ainda não está em nenhuma turma">
                  O gestor da organização inclui instrutores nas turmas.
                </Empty>
              )
            ) : null}

            {trainings.length > 1 ? (
              <div className="mb-3 space-y-2">
                <SearchField
                  value={trainingQuery}
                  onChange={setTrainingQuery}
                  placeholder="Buscar treinamento ou curso"
                />
                <div className="flex gap-2">
                  {trainingCourses.length > 1 ? (
                    <select
                      className="admin-select min-w-0 flex-1 py-2"
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
                    className={`admin-select min-w-0 py-2 ${trainingCourses.length > 1 ? 'flex-1' : 'w-full'}`}
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
              </div>
            ) : null}

            {trainings.length && !trainingList.length ? (
              <p className="px-1 py-2 text-sm text-white/50">
                Nenhum treinamento encontrado.
              </p>
            ) : trainings.length ? (
              <ScrollList label="Treinamentos">
                {[...new Set(trainingList.map((t) => t.course))].map(
                  (courseTitle) => {
                    const inCourse = trainingList.filter(
                      (t) => t.course === courseTitle
                    );
                    return (
                      <li key={courseTitle}>
                        <p className="mb-1 mt-2 flex items-center gap-2 px-1 text-xs first:mt-0">
                          <span className="truncate font-medium text-cyan-100/80">
                            {courseTitle}
                          </span>
                          <span className="shrink-0 text-white/35">
                            {inCourse.length === 1
                              ? '1 treinamento VR'
                              : `${inCourse.length} treinamentos VR`}
                          </span>
                        </p>
                        <ul className="space-y-1" role="radiogroup" aria-label={courseTitle}>
                          {inCourse.map((t) => (
                            <li key={t.key}>
                              <OptionRow
                                active={t.key === trainingKey}
                                onClick={() => setTrainingKey(t.key)}
                              >
                                <Thumb cover={t.cover} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-white">
                                    {t.title}
                                  </span>
                                  <span className="block truncate text-xs text-white/45">
                                    {t.criterion}
                                  </span>
                                  {t.status ? (
                                    <span className="mt-1 block">{t.status}</span>
                                  ) : null}
                                </span>
                                {assessment && t.total ? (
                                  <span
                                    className="shrink-0 text-right text-xs tabular-nums text-white/55"
                                    title={`${t.passed} de ${t.total} alunos aprovados`}
                                  >
                                    {t.passed}/{t.total}
                                    <span className="block text-[11px] text-white/35">
                                      aprovados
                                    </span>
                                  </span>
                                ) : null}
                              </OptionRow>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }
                )}
              </ScrollList>
            ) : assessment && !classId ? (
              classes.length ? (
                <div className="grid min-h-32 flex-1 place-items-center rounded-2xl border border-dashed border-white/10 px-4 text-center text-sm text-white/45">
                  Escolha a turma para ver os treinamentos.
                </div>
              ) : null
            ) : (
              <Empty title="Nenhum treinamento VR aqui" />
            )}
          </Panel>

          {/* 2. Aluno (instrutor, para um aluno) */}
          {assessment ? (
            <Panel
              id={panels.learner}
              n={2}
              title="Aluno"
              done={Boolean(learner)}
              waiting={
                !classId
                  ? 'Escolha a turma e o treinamento primeiro.'
                  : !training
                    ? 'Escolha o treinamento primeiro.'
                    : undefined
              }
              aside={
                training && inTraining.length ? (
                  <span className="text-xs text-white/45">
                    {learners.length === inTraining.length
                      ? plural(learners.length, 'aluno', 'alunos')
                      : `${learners.length} de ${inTraining.length}`}
                  </span>
                ) : null
              }
            >
              {inTraining.length ? (
                <div className="mb-3 space-y-2">
                  <div className="flex gap-2">
                    <SearchField
                      value={search}
                      onChange={setSearch}
                      placeholder="Buscar aluno"
                      className="min-w-0 flex-1"
                    />
                    <select
                      className="admin-select w-36 shrink-0 xl:w-40"
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
                <ScrollList label="Alunos">
                  {learners.map(({ path, lesson }) => {
                    const busy =
                      lesson.vr_status === 'pending' ||
                      lesson.vr_status === 'running';
                    return (
                      <li key={path.enrollment_id}>
                        <OptionRow
                          active={path.enrollment_id === enrollmentId}
                          disabled={busy}
                          onClick={() => setEnrollmentId(path.enrollment_id)}
                        >
                          <Avatar name={path.student_name} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white">
                              {path.student_name}
                            </span>
                            <span className="block truncate text-xs text-white/40">
                              {lesson.attempts
                                ? plural(
                                    lesson.attempts,
                                    'tentativa',
                                    'tentativas'
                                  )
                                : 'Nenhuma tentativa'}
                            </span>
                          </span>
                          <LessonStatus lesson={lesson} />
                        </OptionRow>
                      </li>
                    );
                  })}
                </ScrollList>
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
            </Panel>
          ) : null}

          {/* 3. Quest */}
          <Panel
            id={panels.quest}
            n={questStep}
            title="Quest"
            done={questReady}
            aside={
              questList.length ? (
                <span className="text-xs text-white/45">
                  {freeQuests.length === questList.length
                    ? freeQuests.length === 1
                      ? '1 disponível'
                      : `${freeQuests.length} disponíveis`
                    : `${freeQuests.length} de ${questList.length} disponíveis`}
                </span>
              ) : null
            }
          >
            <p className="mb-3 text-xs leading-relaxed text-white/50">
              O nome do óculos aparece no painel do Quest. O aluno confirma no
              próprio óculos antes de começar.
            </p>
            <QuestPicker
              quests={questList}
              loading={quests.loading}
              value={questId}
              onChange={setQuestId}
              canSetUp={isInstructor}
            />
            {questList.length && !freeQuests.length ? (
              <p className="mt-3 text-xs text-amber-100/80">
                Nenhum Quest livre agora. A lista se atualiza sozinha: quando
                um terminar ou voltar a ter conexão, ele fica disponível aqui.
              </p>
            ) : null}
            {mode === 'practice' ? (
              <div className="mt-3">
                <Notice tone="warn">
                  Rodada de teste: o Quest avisa que é um teste e o resultado
                  não conta para ninguém.
                </Notice>
              </div>
            ) : null}
          </Panel>
        </div>

        {/* resumo sempre à vista, com o que falta e o envio */}
        <div className="sticky bottom-3 z-20 rounded-3xl border border-white/12 bg-[#0f0c1f]/90 p-3 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-4 lg:static lg:shadow-none">
          {error ? (
            <div className="mb-3">
              <Notice tone="error">{error}</Notice>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <ol className="hidden min-w-0 flex-1 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap">
              {mode === 'practice' ? (
                <li className="flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                    <FlaskConical className="h-3.5 w-3.5" /> Rodada de teste
                  </span>
                </li>
              ) : null}
              {summary.map((s) => (
                <li key={s.label} className="min-w-0 sm:max-w-[16rem] lg:flex-1">
                  <button
                    type="button"
                    onClick={() => goTo(s.panel)}
                    className={`flex w-full min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition hover:border-white/25 ${s.value ? 'border-white/10 bg-white/[0.03]' : 'border-amber-300/30 bg-amber-400/[0.07]'}`}
                  >
                    {s.value ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-amber-300/80" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-wide text-white/45">
                        {s.label}
                      </span>
                      <span
                        className={`block truncate text-sm ${s.value ? 'font-medium text-white' : 'text-amber-100'}`}
                        title={s.value ? [s.value, s.detail].filter(Boolean).join(' · ') : undefined}
                      >
                        {s.value ??
                          (s.label === 'Quest' && quest
                            ? 'Ficou indisponível'
                            : 'Falta escolher')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="flex shrink-0 flex-col items-stretch gap-1.5 lg:w-60">
              <button
                type="submit"
                className="primary-btn"
                disabled={sending || missing.length > 0}
                aria-describedby="iniciar-falta"
              >
                <Play className="h-4 w-4" />
                {sending ? 'Enviando ao Quest…' : 'Enviar para o Quest'}
              </button>
              <p
                id="iniciar-falta"
                className={`text-center text-xs ${missing.length ? 'text-amber-200/90' : 'text-white/45'}`}
                aria-live="polite"
              >
                {missingText || 'Tudo pronto: o aluno confirma no óculos.'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Quest livre: pode receber o treinamento (nem em uso, nem sem conexão). */
function questIsFree(q: Quest) {
  return !q.busy && q.online !== false;
}

/** Os Quests da organização: livre (pode receber o treinamento), em uso ou sem conexão. */
function QuestPicker({
  quests,
  loading,
  value,
  onChange,
  canSetUp,
}: {
  quests: Quest[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
  canSetUp: boolean;
}) {
  if (loading && !quests.length)
    return <p className="text-sm text-white/45">Carregando os Quests…</p>;
  if (!quests.length)
    return (
      <Notice tone="warn">
        Nenhum Quest vinculado à organização.{' '}
        {canSetUp
          ? 'Vincule um em Quests: o óculos mostra o código de configuração na primeira vez.'
          : 'Peça ao gestor ou ao instrutor para vincular um em Quests.'}
      </Notice>
    );
  const state = (q: Quest) =>
    q.busy ? 'Em uso' : q.online === false ? 'Sem conexão' : 'Disponível';
  return (
    <ScrollList label="Quests">
      {quests.map((q) => {
        const free = questIsFree(q);
        return (
          <li key={q.id}>
            <OptionRow
              active={value === q.id}
              disabled={!free && value !== q.id}
              onClick={() => onChange(q.id)}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05]">
                <Glasses className="h-4 w-4 text-white/65" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                {q.name ?? 'Quest'}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${free ? 'text-emerald-300' : q.busy ? 'text-amber-300' : 'text-white/45'}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${free ? 'bg-emerald-300' : q.busy ? 'bg-amber-300' : 'bg-white/35'}`}
                />
                {state(q)}
              </span>
            </OptionRow>
          </li>
        );
      })}
    </ScrollList>
  );
}
