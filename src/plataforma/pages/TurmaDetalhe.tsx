import {
  Archive,
  BarChart3,
  Glasses,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import {
  api,
  errorText,
  post,
  type Analytics,
  type Assignment,
  type Classroom,
  type Course,
  type Enrollment,
  type LearnerSignal,
  type LearningPath,
  type PathLesson,
  type User,
} from '../api';
import {
  Donut,
  Matrix,
  Meter,
  ScoreLine,
  ValueColumns,
  type MatrixCell,
} from '../charts';
import {
  bucketLabel,
  competencyName,
  complianceColor,
  complianceHelp,
  complianceLabels,
  complianceOrder,
  errorLabels,
  formatDate,
  formatGain,
  formatRelative,
  formatScore,
  label,
  pct,
  plural,
  ratePct,
  riskHelp,
  riskLabels,
  riskPill,
  signalHelp,
  signalLabels,
  signalPill,
  startLink,
  stepLabels,
  useLoad,
  validityText,
  usePaged,
} from '../format';
import {
  Avatar,
  Card,
  ComplianceBadge,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Kpi,
  Loading,
  Notice,
  PageTitle,
  Progress,
  Segmented,
  Pager,
  SearchField,
} from '../ui';
import { InstructorPicker } from './Turmas';

type Modal = null | 'edit' | 'enroll' | 'course' | 'archive' | 'end';
type Tab = 'geral' | 'progresso' | 'gestao';
type Period = '30' | '90' | '0';

const tabs: Tab[] = ['geral', 'progresso', 'gestao'];

/** Quem precisa de ajuda aparece primeiro na tabela de alunos. */
const signalRank: Record<LearnerSignal, number> = {
  reforco: 0,
  atencao: 1,
  sem_tentativa: 2,
  bom: 3,
};

const normalize = (text: string) =>
  text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Célula da matriz de progresso: material concluído, VR aprovado, abaixo do critério ou em curso. */
function lessonCell(lesson: PathLesson): MatrixCell {
  if (lesson.type === 'material')
    return lesson.completed_at
      ? {
          tone: 'ok',
          text: '✓',
          title: `${lesson.title}: concluído em ${formatDate(lesson.completed_at)}`,
        }
      : { tone: 'none', title: `${lesson.title}: não concluído` };
  const tries = plural(lesson.attempts, 'tentativa', 'tentativas');
  if (lesson.vr_outcome === 'passed')
    return {
      tone: 'ok',
      text: formatScore(lesson.best_score),
      title: `${lesson.title}: aprovado, melhor nota ${formatScore(lesson.best_score)} · ${tries}`,
    };
  if (lesson.best_score != null)
    return {
      tone: 'warn',
      text: formatScore(lesson.best_score),
      title: `${lesson.title}: abaixo do critério (mínimo ${formatScore(lesson.passing_score)}), melhor nota ${formatScore(lesson.best_score)} · ${tries}`,
    };
  if (lesson.vr_status === 'pending' || lesson.vr_status === 'running')
    return {
      tone: 'info',
      text: 'Em curso',
      title: `${lesson.title}: sessão aberta no Quest`,
    };
  return { tone: 'none', title: `${lesson.title}: sem tentativa` };
}

function statusTone(status: LearningPath['status']): MatrixCell['tone'] {
  if (status === 'apto') return 'ok';
  if (status === 'vencido') return 'bad';
  if (status === 'revisar' || status === 'a_vencer') return 'warn';
  if (status === 'em_andamento') return 'info';
  return 'none';
}

function errorTone(rate: number): 'ok' | 'warn' | 'bad' {
  return rate >= 0.4 ? 'bad' : rate >= 0.2 ? 'warn' : 'ok';
}

function Legend() {
  const items = [
    [
      'border-emerald-300/25 bg-emerald-400/15 text-emerald-100',
      '✓',
      'Material concluído',
    ],
    [
      'border-emerald-300/25 bg-emerald-400/15 text-emerald-100',
      '85',
      'VR no critério (melhor nota)',
    ],
    [
      'border-amber-300/25 bg-amber-400/15 text-amber-100',
      '62',
      'VR abaixo do critério',
    ],
    ['border-cyan-300/20 bg-cyan-400/10 text-cyan-100', '…', 'Sessão em curso'],
    ['border-white/[0.06] bg-white/[0.03] text-white/35', '—', 'Não iniciado'],
  ] as const;
  return (
    <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/55">
      {items.map(([style, sample, text]) => (
        <li key={text} className="inline-flex items-center gap-1.5">
          <span
            className={`grid h-5 min-w-7 place-items-center rounded-md border px-1 tabular-nums ${style}`}
          >
            {sample}
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}

function Overview({
  analytics,
  classId,
  instructor,
}: {
  analytics: Analytics;
  classId: string;
  instructor: boolean;
}) {
  const [query, setQuery] = useState('');
  const k = analytics.kpis;
  const reference =
    analytics.lessons.length === 1 ? analytics.lessons[0].passing_score : null;
  const slices = complianceOrder
    .map((key) => ({
      key,
      label: complianceLabels[key],
      value: k.status_counts[key] ?? 0,
      color: complianceColor[key],
    }))
    .filter((s) => s.value);
  const hard = (
    analytics.hard_steps.length
      ? analytics.hard_steps
      : [...analytics.steps].sort((a, b) => b.error_rate - a.error_rate)
  )
    .filter((s) => s.error_rate > 0)
    .slice(0, 4);
  const needle = normalize(query.trim());
  const learners = analytics.learners
    .filter((l) => !l.class_id || l.class_id === classId)
    .filter((l) => !needle || normalize(l.name).includes(needle))
    .sort(
      (a, b) =>
        signalRank[a.signal] - signalRank[b.signal] ||
        a.name.localeCompare(b.name, 'pt-BR')
    );
  const paged = usePaged(learners, 20, query);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi
          icon={GraduationCap}
          label="Alunos"
          value={k.learners}
          hint={`${k.active_learners} treinaram`}
        />
        <Kpi
          icon={UsersRound}
          label="Participação"
          value={pct(k.participation)}
          tone={
            k.participation != null && k.participation < 60 ? 'warn' : undefined
          }
          hint={k.no_attempt ? `${k.no_attempt} sem tentativa` : 'Todos'}
          help="Alunos que fizeram ao menos uma tentativa no VR no período"
        />
        <Kpi
          icon={Star}
          label="Nota média"
          value={formatScore(k.avg_score)}
          tone={
            k.avg_score == null
              ? undefined
              : k.avg_score < 70
                ? 'bad'
                : k.avg_score < 80
                  ? 'warn'
                  : 'ok'
          }
          hint={
            reference != null ? `mínimo ${formatScore(reference)}` : '0 a 100'
          }
        />
        <Kpi
          icon={Target}
          label="Aprovação"
          value={pct(k.pass_rate)}
          hint={`1ª tentativa ${pct(k.first_try_pass_rate)}`}
          help="Tentativas que atingiram o critério"
        />
        <Kpi
          icon={TrendingUp}
          label="Evolução"
          value={formatGain(k.improvement)}
          tone={
            k.improvement == null
              ? undefined
              : k.improvement > 0
                ? 'ok'
                : k.improvement < 0
                  ? 'bad'
                  : undefined
          }
          hint="pontos, 1ª → última"
          help="Ganho médio de nota da primeira para a última tentativa de cada aluno"
        />
        <Kpi
          icon={ShieldCheck}
          label="Aptos"
          value={k.paths ? `${k.apto}/${k.paths}` : '—'}
          tone={k.expiring ? 'warn' : undefined}
          hint={
            k.expiring ? `${k.expiring} vencendo ou vencidos` : 'Aluno × curso'
          }
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-5">
        <Card title="Situação dos alunos" className="lg:col-span-2">
          {k.paths ? (
            <Donut
              slices={slices}
              center={`${k.completion_percent}%`}
              caption="progresso médio"
              size={140}
            />
          ) : (
            <Empty title="Nenhum aluno com curso" />
          )}
        </Card>
        <Card title="Curva da turma" className="lg:col-span-3">
          <ScoreLine
            reference={reference}
            points={analytics.timeline.map((p) => ({
              label: bucketLabel(p.date, analytics.period.bucket),
              value: p.avg_score,
              detail: p.attempts ? (
                <>
                  <p>Nota média {formatScore(p.avg_score)}</p>
                  <p>
                    {plural(p.attempts, 'tentativa', 'tentativas')} ·{' '}
                    {pct(p.pass_rate)} no critério
                  </p>
                </>
              ) : (
                <p>Sem tentativas</p>
              ),
            }))}
          />
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="Nota por tentativa">
          <ValueColumns
            height={250}
            reference={reference}
            points={analytics.by_attempt_number.map((p) => ({
              label: `${p.label} tentativa`,
              value: p.avg_score,
              detail: (
                <>
                  <p>Nota média {formatScore(p.avg_score)}</p>
                  <p>
                    {plural(p.attempts, 'tentativa', 'tentativas')} ·{' '}
                    {pct(p.pass_rate)} no critério
                  </p>
                </>
              ),
            }))}
          />
        </Card>
        <Card title="Onde erram">
          {hard.length ? (
            <ul className="space-y-4">
              {hard.map((s) => (
                <li key={`${s.lesson_id}:${s.step_id}`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-white/85">
                      {label(stepLabels, s.step_id)}
                      {s.competency_id ? (
                        <span className="ml-2 text-xs text-white/40">
                          {competencyName(s.competency_id)}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="shrink-0 tabular-nums text-white/70"
                      title="Passagens pela etapa com algum erro"
                    >
                      {ratePct(s.error_rate)}
                    </span>
                  </div>
                  <Meter
                    value={s.error_rate * 100}
                    tone={errorTone(s.error_rate)}
                  />
                  <p className="mt-1.5 truncate text-xs text-white/45">
                    {s.top_errors[0]
                      ? `Mais comum: ${label(errorLabels, s.top_errors[0].type)} (${s.top_errors[0].count})`
                      : 'Sem tipo de erro registrado'}
                    {s.critical_errors ? (
                      <span className="ml-2 text-rose-200">
                        {plural(s.critical_errors, 'crítico', 'críticos')}
                      </span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Nenhum erro registrado no período" />
          )}
        </Card>
      </div>

      <Card
        title={`Alunos (${analytics.learners.length})`}
        flush
        action={
          analytics.learners.length > 6 ? (
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Buscar aluno"
              className="w-44 sm:w-60"
            />
          ) : null
        }
      >
        {!learners.length ? (
          <Empty title="Nenhum aluno" />
        ) : (
          <div className="overflow-x-auto">
            <table className="p-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Situação</th>
                  <th className="text-right" title="Nota média no período">
                    Média
                  </th>
                  <th className="text-right">Última</th>
                  <th
                    className="text-right"
                    title="Primeira → última tentativa"
                  >
                    Evolução
                  </th>
                  <th className="text-right">Tentativas</th>
                  <th className="text-right">Erros</th>
                  <th className="text-right">Críticos</th>
                  <th>Atividade</th>
                  <th>Progresso</th>
                  {instructor ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {paged.items.map((l) => (
                  <tr key={l.student_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={l.name} />
                        <div className="min-w-0">
                          <Link
                            to={`/app/alunos/${l.student_id}`}
                            className="p-link whitespace-nowrap font-medium"
                          >
                            {l.name}
                          </Link>
                          <p className="mt-0.5">
                            <span
                              className={`${signalPill[l.signal]} !py-0 text-[11px]`}
                              title={signalHelp[l.signal]}
                            >
                              {signalLabels[l.signal]}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {l.compliance ? (
                        <ComplianceBadge status={l.compliance} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatScore(l.avg_score)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatScore(l.last_score)}
                    </td>
                    <td
                      className={`text-right tabular-nums ${
                        l.trend == null
                          ? 'text-white/40'
                          : l.trend > 0
                            ? 'text-emerald-200'
                            : l.trend < 0
                              ? 'text-rose-200'
                              : ''
                      }`}
                    >
                      {formatGain(l.trend)}
                    </td>
                    <td className="text-right tabular-nums">{l.attempts}</td>
                    <td className="text-right tabular-nums">{l.errors}</td>
                    <td
                      className={`text-right tabular-nums ${l.critical_errors ? 'text-rose-200' : ''}`}
                    >
                      {l.critical_errors}
                    </td>
                    <td className="whitespace-nowrap text-white/60">
                      {l.last_attempt_at
                        ? formatRelative(l.last_attempt_at)
                        : '—'}
                    </td>
                    <td>
                      <Progress value={l.completion_percent} />
                    </td>
                    {instructor ? (
                      <td className="text-right">
                        <Link
                          to={startLink({
                            classId,
                            enrollmentId: l.enrollment_id,
                          })}
                          className="p-action p-action-accent"
                          title={`Iniciar o VR para ${l.name}`}
                        >
                          <Glasses className="h-3.5 w-3.5" /> VR
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager {...paged} noun="alunos" />
      </Card>
    </div>
  );
}

function ProgressTab({ paths }: { paths: LearningPath[] }) {
  if (!paths.length)
    return (
      <Card>
        <Empty title="Sem progresso para mostrar">
          A turma precisa de alunos e de pelo menos um curso.
        </Empty>
      </Card>
    );
  const groups = new Map<string, LearningPath[]>();
  for (const p of paths)
    groups.set(p.class_course_id, [
      ...(groups.get(p.class_course_id) ?? []),
      p,
    ]);
  return (
    <div className="space-y-5">
      {[...groups.values()].map((rows) => {
        const lessons = [...rows[0].lessons].sort(
          (a, b) => a.position - b.position
        );
        const sorted = [...rows].sort((a, b) =>
          a.student_name.localeCompare(b.student_name, 'pt-BR')
        );
        const done = rows.filter((r) =>
          ['apto', 'a_vencer'].includes(r.status)
        ).length;
        return (
          <Card
            key={rows[0].class_course_id}
            title={rows[0].course_title}
            action={
              <span className="text-xs tabular-nums text-white/50">
                {done}/{rows.length} aptos
              </span>
            }
          >
            <Legend />
            <Matrix
              columns={[
                ...lessons.map((l) => ({
                  key: l.id,
                  label: `${l.position}. ${l.title}`,
                  hint:
                    l.type === 'vr_training'
                      ? `Treinamento VR · mínimo ${formatScore(l.passing_score)}`
                      : 'Material',
                })),
                { key: 'progress', label: 'Progresso' },
                { key: 'status', label: 'Situação' },
              ]}
              rows={sorted.map((r) => ({
                key: r.enrollment_id,
                label: (
                  <Link
                    to={`/app/alunos/${r.student_id}`}
                    className="whitespace-nowrap hover:text-cyan-100"
                  >
                    {r.student_name}
                  </Link>
                ),
                cells: [
                  ...[...r.lessons]
                    .sort((a, b) => a.position - b.position)
                    .map(lessonCell),
                  {
                    tone:
                      r.completion_percent === 100
                        ? 'ok'
                        : r.completion_percent
                          ? 'info'
                          : 'none',
                    text: `${r.completion_percent}%`,
                    title: `${r.completed_lessons} de ${r.total_lessons} etapas concluídas`,
                  },
                  {
                    tone: statusTone(r.status),
                    text: complianceLabels[r.status],
                    title: complianceHelp[r.status],
                  },
                ],
              }))}
            />
          </Card>
        );
      })}
    </div>
  );
}

export default function TurmaDetalhe() {
  const { classId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const manager = user?.role === 'org_admin';
  const instructor = user?.role === 'instructor';
  const [params, setParams] = useSearchParams();
  const tab: Tab = tabs.includes(params.get('aba') as Tab)
    ? (params.get('aba') as Tab)
    : 'geral';
  const [period, setPeriod] = useState<Period>('90');
  const data = useLoad(async () => {
    const [classroom, enrollments, assignments, paths, people, courses] =
      await Promise.all([
        api<Classroom>(`/classes/${classId}`),
        api<Enrollment[]>(`/classes/${classId}/enrollments`),
        api<Assignment[]>(`/classes/${classId}/courses`),
        api<LearningPath[]>(`/compliance?class_id=${classId}`),
        api<User[]>('/users'),
        api<Course[]>('/courses'),
      ]);
    return { classroom, enrollments, assignments, paths, people, courses };
  }, [classId]);
  const stats = useLoad(
    () => api<Analytics>(`/analytics?class_id=${classId}&days=${period}`),
    [classId, period]
  );
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [courseId, setCourseId] = useState('');
  const [search, setSearch] = useState('');
  const [ending, setEnding] = useState<{ id: string; name: string } | null>(
    null
  );

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const { classroom, enrollments, assignments, paths, people, courses } =
    data.data;
  const names = new Map(people.map((p) => [p.id, p.name]));
  const active = enrollments.filter((e) => !e.ended_at);
  const enrolled = new Set(active.map((e) => e.student_id));
  const enrolledAt = new Map(active.map((e) => [e.id, e.enrolled_at]));
  const liveCourses = assignments.filter((a) => !a.revoked_at);
  const courseTitle = new Map(courses.map((c) => [c.id, c]));
  const assignable = courses.filter(
    (c) => !liveCourses.some((a) => a.course_id === c.id)
  );
  const candidates = people
    .filter((p) => p.role === 'student' && p.active && !enrolled.has(p.id))
    .filter(
      (p) =>
        !search.trim() || normalize(p.name).includes(normalize(search.trim()))
    );
  const archived = Boolean(classroom.archived_at);
  const summary = stats.data?.classes.find((c) => c.class_id === classId);

  function setTab(next: Tab) {
    const copy = new URLSearchParams(params);
    if (next === 'geral') copy.delete('aba');
    else copy.set('aba', next);
    setParams(copy, { replace: true });
  }

  function open(kind: Modal) {
    setError('');
    setSearch('');
    setName(classroom.name);
    setChosen(kind === 'edit' ? classroom.instructor_ids : []);
    setCourseId('');
    setModal(kind);
  }

  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      setModal(null);
      void data.reload(true);
      void stats.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  const footer = (
    text: string,
    action: () => Promise<unknown>,
    disabled = false,
    danger = false
  ) => (
    <>
      <button
        type="button"
        className="secondary-btn"
        onClick={() => setModal(null)}
      >
        Cancelar
      </button>
      <button
        type="button"
        className={danger ? 'danger-btn' : 'primary-btn sm:w-auto sm:px-5'}
        disabled={disabled}
        onClick={() => void run(action)}
      >
        {text}
      </button>
    </>
  );

  return (
    <>
      <PageTitle
        back="/app/turmas"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {classroom.name}
            {archived ? (
              <span className="status-pill status-pill-muted text-xs">
                Arquivada
              </span>
            ) : summary ? (
              <span
                className={`${riskPill[summary.risk]} text-xs`}
                title={riskHelp[summary.risk]}
              >
                {riskLabels[summary.risk]}
              </span>
            ) : null}
          </span>
        }
        subtitle={
          <>
            {classroom.instructor_ids
              .map((i) => names.get(i) ?? '—')
              .join(', ')}
            {liveCourses.length ? (
              <span className="text-white/35">
                {' · '}
                {plural(liveCourses.length, 'curso', 'cursos')} ·{' '}
                {plural(active.length, 'aluno', 'alunos')}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Link
              to={`/app/painel?turma=${classroom.id}`}
              className="secondary-btn"
            >
              <BarChart3 className="h-4 w-4" /> Painel
            </Link>
            {instructor && !archived ? (
              <Link
                to={startLink({ classId: classroom.id })}
                className="primary-btn sm:w-auto sm:px-5"
              >
                <Glasses className="h-4 w-4" /> Iniciar treinamento
              </Link>
            ) : null}
            {manager && !archived ? (
              <>
                <button
                  type="button"
                  className="primary-btn sm:w-auto sm:px-5"
                  onClick={() => open('enroll')}
                >
                  <Plus className="h-4 w-4" /> Matricular
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => open('edit')}
                >
                  <Pencil className="h-4 w-4" /> Editar
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Arquivar turma"
                  title="Arquivar turma"
                  onClick={() => open('archive')}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </>
        }
      />

      {archived ? (
        <div className="mb-5">
          <Notice tone="warn">
            <span className="inline-flex items-center gap-2">
              <Archive className="h-4 w-4" /> Turma arquivada em{' '}
              {formatDate(classroom.archived_at)}. Os resultados continuam
              guardados.
            </span>
          </Notice>
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-full overflow-x-auto">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'geral', label: 'Visão geral' },
              { value: 'progresso', label: 'Progresso' },
              { value: 'gestao', label: 'Alunos e cursos' },
            ]}
          />
        </div>
        {tab === 'geral' ? (
          <Segmented<Period>
            value={period}
            onChange={setPeriod}
            options={[
              { value: '30', label: '30 dias' },
              { value: '90', label: '90 dias' },
              { value: '0', label: 'Tudo' },
            ]}
          />
        ) : null}
      </div>

      {tab === 'geral' ? (
        stats.loading ? (
          <Loading />
        ) : stats.error || !stats.data ? (
          <ErrorState
            message={stats.error}
            onRetry={() => void stats.reload()}
          />
        ) : (
          <Overview
            analytics={stats.data}
            classId={classId}
            instructor={instructor && !archived}
          />
        )
      ) : null}

      {tab === 'progresso' ? <ProgressTab paths={paths} /> : null}

      {tab === 'gestao' ? (
        <div className="grid items-start gap-5 xl:grid-cols-3">
          <Card
            title={`Cursos (${liveCourses.length})`}
            action={
              manager && !archived && assignable.length ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => open('course')}
                >
                  <Plus className="h-4 w-4" /> Curso
                </button>
              ) : null
            }
          >
            {liveCourses.length ? (
              <ul className="-my-2 divide-y divide-white/[0.06]">
                {liveCourses.map((a) => {
                  const course = courseTitle.get(a.course_id);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">
                          {course?.title ?? 'Curso'}
                        </p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {course ? validityText(course) : ''}
                          {' · desde '}
                          {formatDate(a.assigned_at)}
                        </p>
                      </div>
                      {manager && !archived ? (
                        <button
                          type="button"
                          className="p-action p-action-danger shrink-0"
                          onClick={() =>
                            void run(() =>
                              post(`/class-courses/${a.id}/revoke`)
                            )
                          }
                        >
                          Remover
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-white/50">Nenhum curso nesta turma.</p>
            )}
          </Card>

          <Card
            title={`Alunos (${active.length})`}
            flush
            className="xl:col-span-2"
            action={
              manager && !archived ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => open('enroll')}
                >
                  <Plus className="h-4 w-4" /> Matricular
                </button>
              ) : null
            }
          >
            {!active.length ? (
              <Empty title="Nenhum aluno matriculado" />
            ) : !paths.length ? (
              <ul className="divide-y divide-white/[0.06] px-5 pb-3 sm:px-6">
                {active.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm text-white"
                  >
                    <span>{names.get(e.student_id)}</span>
                    {manager && !archived ? (
                      <button
                        type="button"
                        className="p-action p-action-danger"
                        onClick={() => {
                          setEnding({
                            id: e.id,
                            name: names.get(e.student_id) ?? 'aluno',
                          });
                          open('end');
                        }}
                      >
                        Tirar
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="overflow-x-auto">
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      {liveCourses.length > 1 ? <th>Curso</th> : null}
                      <th>Entrada</th>
                      <th>Progresso</th>
                      <th>Situação</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {paths.map((p) => (
                      <tr key={`${p.enrollment_id}:${p.class_course_id}`}>
                        <td className="whitespace-nowrap font-medium">
                          <Link
                            to={`/app/alunos/${p.student_id}`}
                            className="p-link"
                          >
                            {p.student_name}
                          </Link>
                        </td>
                        {liveCourses.length > 1 ? (
                          <td className="text-white/70">{p.course_title}</td>
                        ) : null}
                        <td className="whitespace-nowrap text-white/60">
                          {formatDate(enrolledAt.get(p.enrollment_id))}
                        </td>
                        <td>
                          <Progress value={p.completion_percent} />
                        </td>
                        <td className="whitespace-nowrap">
                          <ComplianceBadge status={p.status} />
                          {p.valid_until ? (
                            <span className="ml-2 text-xs text-white/40">
                              até {formatDate(p.valid_until)}
                            </span>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          {['apto', 'a_vencer', 'vencido'].includes(
                            p.status
                          ) ? (
                            <button
                              type="button"
                              className="mr-2 p-action"
                              title="Abrir a reciclagem: as etapas e o VR valem de novo"
                              onClick={() =>
                                void run(() =>
                                  post(
                                    `/paths/${p.enrollment_id}/${p.class_course_id}/renew`
                                  )
                                )
                              }
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> Reciclagem
                            </button>
                          ) : null}
                          {instructor &&
                          !archived &&
                          p.status !== 'apto' &&
                          p.status !== 'a_vencer' ? (
                            <Link
                              to={startLink({
                                classId: p.class_id,
                                enrollmentId: p.enrollment_id,
                              })}
                              className="p-action p-action-accent"
                            >
                              <Glasses className="h-3.5 w-3.5" /> VR
                            </Link>
                          ) : null}
                          {manager && !archived ? (
                            <button
                              type="button"
                              className="p-action p-action-danger"
                              onClick={() => {
                                setEnding({
                                  id: p.enrollment_id,
                                  name: p.student_name,
                                });
                                open('end');
                              }}
                            >
                              Tirar
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {error && !modal ? (
              <div className="px-5 pb-5 sm:px-6">
                <Notice tone="error">{error}</Notice>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      <Dialog
        open={modal === 'enroll'}
        title="Matricular alunos"
        onClose={() => setModal(null)}
        footer={footer(
          `Matricular${chosen.length ? ` (${chosen.length})` : ''}`,
          () =>
            post(`/classes/${classId}/enrollments`, { student_ids: chosen }),
          !chosen.length
        )}
      >
        <input
          className="admin-input"
          placeholder="Buscar pelo nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {candidates.length ? (
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-white/10 p-2">
            {candidates.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={chosen.includes(p.id)}
                  onChange={(e) =>
                    setChosen(
                      e.target.checked
                        ? [...chosen, p.id]
                        : chosen.filter((v) => v !== p.id)
                    )
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">
            Nenhum aluno disponível. Cadastre alunos em Pessoas.
          </p>
        )}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <Dialog
        open={modal === 'edit'}
        title="Editar turma"
        onClose={() => setModal(null)}
        footer={footer(
          'Salvar',
          () =>
            api(`/classes/${classId}`, {
              method: 'PATCH',
              json: { name, instructor_ids: chosen },
            }),
          !name.trim() || !chosen.length
        )}
      >
        <Field label="Nome">
          <input
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Instrutores">
          <InstructorPicker
            instructors={people.filter(
              (p) => p.role === 'instructor' && p.active
            )}
            value={chosen}
            onChange={setChosen}
          />
        </Field>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <Dialog
        open={modal === 'course'}
        title="Adicionar curso"
        onClose={() => setModal(null)}
        footer={footer(
          'Adicionar',
          () => post(`/classes/${classId}/courses`, { course_id: courseId }),
          !courseId
        )}
      >
        <Field label="Curso">
          <select
            className="admin-select"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Escolha</option>
            {assignable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <Dialog
        open={modal === 'end'}
        title="Tirar da turma?"
        onClose={() => setModal(null)}
        footer={footer(
          'Tirar',
          () => post(`/enrollments/${ending?.id}/end`),
          !ending,
          true
        )}
      >
        <p className="text-sm text-white/65">
          {ending?.name} deixa a turma. Resultados e certificados continuam
          guardados.
        </p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <Dialog
        open={modal === 'archive'}
        title="Arquivar turma?"
        onClose={() => setModal(null)}
        footer={footer(
          'Arquivar',
          async () => {
            await post(`/classes/${classId}/archive`);
            navigate('/app/turmas');
          },
          false,
          true
        )}
      >
        <p className="text-sm text-white/65">
          A turma sai da lista. Resultados e certificados continuam guardados.
        </p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
