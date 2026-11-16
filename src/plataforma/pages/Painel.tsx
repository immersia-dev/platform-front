import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Play,
  ShieldCheck,
  Target,
  TrendingUp,
  UserX,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { api, type Analytics, type Classroom, type Course } from '../api';
import {
  CountBars,
  Donut,
  Meter,
  ScoreLine,
  Sparkline,
  StackedBar,
  ValueColumns,
} from '../charts';
import {
  bandLabels,
  bucketLabel,
  competencyName,
  complianceColor,
  complianceLabels,
  complianceOrder,
  errorLabels,
  formatDateTime,
  formatDuration,
  formatGain,
  formatMinutes,
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
  stepLabels,
  useLoad,
  useStableHeight,
  useStuckClass,
  usePaged,
} from '../format';
import {
  Avatar,
  Card,
  ComplianceBadge,
  Empty,
  ErrorState,
  Kpi,
  Loading,
  PageTitle,
  Progress,
  Segmented,
  Pager,
  SearchField,
} from '../ui';

const PERIODS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '12 meses' },
  { value: 'all', label: 'Tudo' },
] as const;
type Period = (typeof PERIODS)[number]['value'];

type LearnerFilter =
  'all' | 'reforco' | 'atencao' | 'sem_tentativa' | 'vencendo';
type Learner = Analytics['learners'][number];

const bandTone = {
  otimo: 'ok',
  bom: 'cyan',
  atencao: 'warn',
  critico: 'bad',
} as const;

const PAGE = 15;

function matches(l: Learner, filter: LearnerFilter) {
  if (filter === 'all') return true;
  if (filter === 'vencendo')
    return l.compliance === 'a_vencer' || l.compliance === 'vencido';
  return l.signal === filter;
}

/** Bloco do painel com um título pequeno de seção. */
function Section({
  id,
  title,
  action,
  children,
}: {
  id?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-44 space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Linha de uma lista com barra: rótulo, valor à direita, barra e um detalhe opcional. */
function BarRow({
  name,
  value,
  percent,
  tone,
  detail,
  title,
}: {
  name: ReactNode;
  value: ReactNode;
  percent: number;
  tone: 'cyan' | 'ok' | 'warn' | 'bad' | 'violet';
  detail?: ReactNode;
  title?: string;
}) {
  return (
    <li title={title}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-white/85">{name}</span>
        <span className="shrink-0 tabular-nums text-white/60">{value}</span>
      </div>
      <Meter value={percent} tone={tone} />
      {detail ? (
        <p className="mt-1 truncate text-xs text-white/45">{detail}</p>
      ) : null}
    </li>
  );
}

/** Painel de acompanhamento: participação, desempenho, conformidade, dificuldades, turmas e alunos. */
export default function Painel() {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';
  const [params, setParams] = useSearchParams();
  const classId = params.get('turma') ?? '';
  const courseId = params.get('curso') ?? '';
  const period = (params.get('periodo') ?? '30') as Period;
  const [filter, setFilter] = useState<LearnerFilter>('all');
  const [search, setSearch] = useState('');

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const filters = useLoad(async () => {
    const [classes, courses] = await Promise.all([
      api<Classroom[]>('/classes'),
      api<Course[]>('/courses').catch(() => [] as Course[]),
    ]);
    return {
      classes: classes.filter((c) => !c.archived_at),
      courses: courses.filter((c) => c.published_at && !c.archived_at),
    };
  }, []);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (classId) q.set('class_id', classId);
    if (courseId) q.set('course_id', courseId);
    q.set('days', period === 'all' ? '0' : period);
    return q.toString();
  }, [classId, courseId, period]);
  const data = useLoad(() => api<Analytics>(`/analytics?${query}`), [query]);

  const a = data.data;
  const reference =
    a && a.lessons.length === 1 ? a.lessons[0].passing_score : null;
  const className = filters.data?.classes.find((c) => c.id === classId)?.name;

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (a?.learners ?? []).filter(
      (l) =>
        matches(l, filter) &&
        (!term ||
          `${l.name} ${l.class_name}`.toLocaleLowerCase('pt-BR').includes(term))
    );
  }, [a, filter, search]);
  const paged = usePaged(filtered, PAGE, `${query}|${filter}|${search}`);
  // a tabela não encolhe enquanto filtra; volta a medir com outro período, turma, curso ou ao recolher a lista
  const stickyBar = useStuckClass();
  const stableTable = useStableHeight(query);

  const focusLearners = (next: LearnerFilter) => {
    setFilter(next);
    document
      .getElementById('alunos')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const steps = a
    ? [...a.steps]
        .filter((s) => s.error_rate > 0 || s.critical_errors > 0)
        .sort(
          (x, y) =>
            y.error_rate - x.error_rate || y.critical_errors - x.critical_errors
        )
        .slice(0, 6)
    : [];
  const manyLessons = (a?.lessons.length ?? 0) > 1;
  const maxError = Math.max(1, ...(a?.error_types.map((e) => e.count) ?? []));
  const statusSlices = (counts: Record<string, number>) =>
    complianceOrder.map((s) => ({
      key: s,
      label: complianceLabels[s],
      value: counts[s] ?? 0,
      color: complianceColor[s],
    }));
  const count = (f: LearnerFilter) =>
    a?.learners.filter((l) => matches(l, f)).length ?? 0;
  const expiring = count('vencendo');
  const actions = a
    ? [
        {
          key: 'reforco' as const,
          icon: LifeBuoy,
          count: count('reforco'),
          text: 'em reforço',
          tone: 'text-rose-100 border-rose-300/20 bg-rose-400/[0.1]',
        },
        {
          key: 'sem_tentativa' as const,
          icon: UserX,
          count: count('sem_tentativa'),
          text: 'sem tentativa',
          tone: 'text-white/85 border-white/12 bg-white/[0.06]',
        },
        {
          key: 'vencendo' as const,
          icon: CalendarClock,
          count: expiring,
          text: 'vencendo ou vencidos',
          tone: 'text-amber-100 border-amber-300/20 bg-amber-400/[0.1]',
        },
      ].filter((x) => x.count > 0)
    : [];

  const learnerOptions: { value: LearnerFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'reforco', label: 'Reforço' },
    { value: 'atencao', label: 'Atenção' },
    { value: 'sem_tentativa', label: 'Sem tentativa' },
    ...(expiring ? [{ value: 'vencendo' as const, label: 'Vencendo' }] : []),
  ];

  return (
    <>
      <PageTitle
        title={className ?? 'Painel'}
        subtitle={
          className
            ? 'Painel da turma'
            : isInstructor
              ? 'Suas turmas'
              : (user?.organizationName ?? undefined)
        }
        actions={
          <>
            {classId ? (
              <Link to={`/app/turmas/${classId}`} className="secondary-btn">
                Abrir turma
              </Link>
            ) : null}
            {isInstructor ? (
              <Link to="/app/iniciar" className="primary-btn sm:w-auto sm:px-5">
                <Play className="h-4 w-4" /> Iniciar treinamento
              </Link>
            ) : null}
          </>
        }
      />

      <div ref={stickyBar} className="p-sticky-bar">
        <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row">
            <select
              className="admin-select py-2 sm:max-w-56"
              value={classId}
              onChange={(e) => set('turma', e.target.value)}
              aria-label="Turma"
            >
              <option value="">Todas as turmas</option>
              {filters.data?.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {(filters.data?.courses.length ?? 0) > 1 ? (
              <select
                className="admin-select py-2 sm:max-w-64"
                value={courseId}
                onChange={(e) => set('curso', e.target.value)}
                aria-label="Curso"
              >
                <option value="">Todos os cursos</option>
                {filters.data?.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <Segmented
              value={period}
              onChange={(v) => set('periodo', v === '30' ? '' : v)}
              options={[...PERIODS]}
            />
          </div>
        </div>
      </div>

      {data.loading && !a ? (
        <Loading />
      ) : data.error || !a ? (
        <ErrorState message={data.error} onRetry={() => void data.reload()} />
      ) : (
        <div
          className={`space-y-9 ${data.loading ? 'opacity-60 transition' : ''}`}
        >
          {actions.length ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-rose-300/15 bg-gradient-to-r from-rose-500/[0.09] to-transparent px-4 py-3.5 sm:flex-row sm:items-center">
              <p className="shrink-0 text-sm font-semibold text-white">
                Precisa de ação
              </p>
              <div className="flex flex-wrap gap-2">
                {actions.map((x) => {
                  const Icon = x.icon;
                  return (
                    <button
                      key={x.key}
                      type="button"
                      onClick={() => focusLearners(x.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition hover:brightness-125 ${x.tone}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold tabular-nums">
                        {x.count}
                      </span>
                      {x.text}
                      <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Section title="Visão geral">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 3xl:grid-cols-8">
              <Kpi
                icon={UsersRound}
                label="Alunos"
                value={a.kpis.learners}
                hint={`${a.kpis.active_learners} treinaram no período`}
              />
              <Kpi
                icon={Activity}
                label="Participação"
                value={pct(a.kpis.participation)}
                hint={plural(a.kpis.attempts, 'tentativa', 'tentativas')}
                help="Alunos com pelo menos uma tentativa no período, sobre o total."
              />
              <Kpi
                icon={Target}
                label="Nota média"
                value={formatScore(a.kpis.avg_score)}
                hint={`${pct(a.kpis.first_try_pass_rate)} aprovados na 1ª`}
                help="Média de todas as tentativas; abaixo, quem atingiu o critério já na primeira tentativa."
              />
              <Kpi
                icon={CheckCircle2}
                label="Aprovação"
                value={pct(a.kpis.pass_rate)}
                hint="Tentativas no critério"
                help="Tentativas que atingiram a nota mínima sem passar do limite de erros críticos."
              />
              <Kpi
                icon={TrendingUp}
                label="Evolução"
                value={
                  a.kpis.improvement == null
                    ? '—'
                    : `${formatGain(a.kpis.improvement)} pts`
                }
                tone={
                  a.kpis.improvement != null && a.kpis.improvement > 0
                    ? 'ok'
                    : undefined
                }
                hint="Da 1ª à última tentativa"
                help="Média do ganho de nota de quem repetiu o mesmo treinamento."
              />
              <Kpi
                icon={Clock}
                label="Tempo médio"
                value={formatDuration(a.kpis.avg_duration_seconds)}
                hint={`${formatMinutes(a.kpis.training_minutes)} em VR`}
              />
              <Kpi
                icon={LifeBuoy}
                label="Em reforço"
                value={a.kpis.need_support}
                tone={a.kpis.need_support ? 'bad' : undefined}
                hint={`${plural(a.kpis.critical_errors, 'erro crítico', 'erros críticos')} · ${plural(a.kpis.hints, 'dica', 'dicas')}`}
                help={signalHelp.reforco}
              />
              <Kpi
                icon={ShieldCheck}
                label="Aptos"
                value={`${a.kpis.apto}/${a.kpis.paths}`}
                tone={a.kpis.expiring ? 'warn' : undefined}
                hint={
                  a.kpis.expiring
                    ? `${a.kpis.expiring} vencendo ou vencidos`
                    : `${pct(a.kpis.completion_percent)} concluído`
                }
                help="Aluno × curso: concluiu as etapas e atingiu o critério no VR."
              />
            </div>
          </Section>

          <Section title="Desempenho">
            {/* telas largas: evolução à esquerda; tentativa, faixas e treinamentos ao centro; recentes à direita */}
            <div className="grid items-start gap-5 xl:grid-cols-3 3xl:grid-cols-5">
              <Card
                title="Evolução da nota"
                className="xl:col-span-2 3xl:col-start-1 3xl:row-span-2 3xl:row-start-1"
              >
                <ScoreLine
                  reference={reference}
                  points={a.timeline.map((p) => ({
                    label: bucketLabel(p.date, a.period.bucket),
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
                <p className="mb-1 mt-4 text-xs font-medium text-white/50">
                  Tentativas
                </p>
                <CountBars
                  height={100}
                  points={a.timeline.map((p) => ({
                    label: bucketLabel(p.date, a.period.bucket),
                    value: p.attempts,
                  }))}
                />
              </Card>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 3xl:col-span-2 3xl:col-start-3 3xl:row-start-1 3xl:grid-cols-2">
                <Card title="Nota por tentativa">
                  <ValueColumns
                    height={170}
                    reference={reference}
                    empty="Sem tentativas no período."
                    points={a.by_attempt_number.map((p) => ({
                      label: p.label,
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
                <Card title="Faixas de nota">
                  {a.kpis.attempts ? (
                    <ul className="space-y-3.5">
                      {a.score_bands.map((b) => (
                        <BarRow
                          key={b.key}
                          name={
                            <>
                              {bandLabels[b.key]}
                              <span className="ml-2 text-xs text-white/40">
                                {b.key === 'critico'
                                  ? '< 70'
                                  : `${b.min}–${b.max}`}
                              </span>
                            </>
                          }
                          value={`${b.count} · ${b.percent}%`}
                          percent={b.percent}
                          tone={bandTone[b.key]}
                        />
                      ))}
                    </ul>
                  ) : (
                    <Empty title="Sem tentativas no período" />
                  )}
                </Card>
              </div>

              <Card
                title="Treinamentos"
                flush
                className="xl:col-span-2 3xl:col-start-3 3xl:row-start-2"
              >
                {a.lessons.length ? (
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr>
                          <th>Treinamento</th>
                          <th className="text-right">Tentativas</th>
                          <th className="text-right">Média</th>
                          <th className="text-right">Aprovação</th>
                          <th
                            className="text-right"
                            title="Aprovados já na primeira tentativa"
                          >
                            1ª tentativa
                          </th>
                          <th className="text-right">Tempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.lessons.map((l) => (
                          <tr key={l.lesson_id}>
                            <td>
                              <span className="font-medium text-white">
                                {l.title}
                              </span>
                              <p className="whitespace-nowrap text-xs text-white/40">
                                {l.course_title}
                              </p>
                            </td>
                            <td className="text-right tabular-nums">
                              {l.attempts}
                            </td>
                            <td className="text-right tabular-nums">
                              {formatScore(l.avg_score)}
                            </td>
                            <td className="text-right tabular-nums">
                              {pct(l.pass_rate)}
                            </td>
                            <td className="text-right tabular-nums">
                              {pct(l.first_try_pass_rate)}
                            </td>
                            <td className="whitespace-nowrap text-right tabular-nums">
                              {formatDuration(l.avg_duration_seconds)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 pb-5 sm:px-6">
                    <Empty title="Sem tentativas no período" />
                  </div>
                )}
              </Card>

              <Card
                className="3xl:col-start-5 3xl:row-span-2 3xl:row-start-1"
                title="Tentativas recentes"
                flush
                action={
                  <Link to="/app/sessoes" className="p-action">
                    Sessões
                  </Link>
                }
              >
                {a.recent.length ? (
                  <ul className="divide-y divide-white/[0.06] px-5 pb-2 sm:px-6">
                    {a.recent.slice(0, 6).map((r) => (
                      <li key={r.attempt_id}>
                        <Link
                          to={`/app/sessoes/${r.vr_request_id}`}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <Avatar name={r.student_name} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-white">
                              {r.student_name}
                            </span>
                            <span className="block truncate text-xs text-white/40">
                              {r.lesson_title}
                              {r.course_title
                                ? ` · ${r.course_title}`
                                : ''} · {formatDateTime(r.ended_at)}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-lg font-semibold tabular-nums ${r.passed ? 'text-emerald-200' : 'text-amber-200'}`}
                            title={
                              r.passed ? 'No critério' : 'Abaixo do critério'
                            }
                          >
                            {formatScore(r.score)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-5 pb-5 sm:px-6">
                    <Empty title="Sem tentativas no período" />
                  </div>
                )}
              </Card>
            </div>
          </Section>

          <Section
            title="Conformidade"
            action={
              isInstructor ? null : (
                <Link to="/app/conformidade" className="p-action">
                  Ver tudo
                </Link>
              )
            }
          >
            <div className="grid items-start gap-5 lg:grid-cols-5">
              <Card title="Situação" className="lg:col-span-2">
                {a.kpis.paths ? (
                  <Donut
                    slices={statusSlices(a.kpis.status_counts)}
                    center={`${a.kpis.apto}/${a.kpis.paths}`}
                    caption="aptos"
                  />
                ) : (
                  <Empty title="Nenhum aluno em curso" />
                )}
              </Card>
              <Card title="Por turma" className="lg:col-span-3">
                {a.classes.length ? (
                  <>
                    <ul className="space-y-5">
                      {a.classes.map((c) => (
                        <li key={c.class_id}>
                          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                            <Link
                              to={`/app/turmas/${c.class_id}`}
                              className="p-link min-w-0 truncate"
                            >
                              {c.name}
                            </Link>
                            <span className="shrink-0 tabular-nums text-white/55">
                              <span className="font-semibold text-white">
                                {c.apto}/{c.paths}
                              </span>{' '}
                              aptos · {pct(c.completion_percent)} concluído
                            </span>
                          </div>
                          <StackedBar slices={statusSlices(c.status_counts)} />
                        </li>
                      ))}
                    </ul>
                    <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                      {complianceOrder.map((s) => (
                        <li
                          key={s}
                          className="inline-flex items-center gap-1.5"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: complianceColor[s] }}
                          />
                          {complianceLabels[s]}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Empty title="Nenhuma turma" />
                )}
              </Card>
            </div>
          </Section>

          <Section title="Dificuldades">
            <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
              <Card title="Etapa por etapa">
                {steps.length ? (
                  <ul className="space-y-4">
                    {steps.map((s) => (
                      <BarRow
                        key={`${s.lesson_id}:${s.step_id}`}
                        name={label(stepLabels, s.step_id)}
                        value={`${ratePct(s.error_rate)} com erro`}
                        percent={s.error_rate * 100}
                        tone={s.critical_errors ? 'bad' : 'warn'}
                        title={
                          s.top_errors
                            .map(
                              (e) =>
                                `${label(errorLabels, e.type)} (${e.count})`
                            )
                            .join(' · ') || undefined
                        }
                        detail={[
                          manyLessons ? s.lesson_title : null,
                          s.top_errors[0]
                            ? label(errorLabels, s.top_errors[0].type)
                            : null,
                          s.critical_errors
                            ? plural(s.critical_errors, 'crítico', 'críticos')
                            : null,
                          s.avg_duration_ms != null
                            ? formatDuration(s.avg_duration_ms / 1000)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      />
                    ))}
                  </ul>
                ) : (
                  <Empty
                    title={
                      a.kpis.attempts
                        ? 'Nenhum erro registrado'
                        : 'Sem tentativas no período'
                    }
                  />
                )}
              </Card>

              <Card title="Erros mais comuns">
                {a.error_types.length ? (
                  <ul className="space-y-4">
                    {a.error_types.slice(0, 6).map((e) => (
                      <BarRow
                        key={e.type}
                        name={label(errorLabels, e.type)}
                        value={
                          <>
                            {plural(e.count, 'vez', 'vezes')}
                            {e.critical ? (
                              <span className="ml-1.5 text-rose-200">
                                · {e.critical} crít.
                              </span>
                            ) : null}
                          </>
                        }
                        percent={(e.count / maxError) * 100}
                        tone={e.critical ? 'bad' : 'violet'}
                      />
                    ))}
                  </ul>
                ) : (
                  <Empty
                    title={
                      a.kpis.attempts
                        ? 'Nenhum erro registrado'
                        : 'Sem tentativas no período'
                    }
                  />
                )}
              </Card>

              <Card
                title="Competências"
                className="lg:col-span-2 xl:col-span-1"
              >
                {a.competencies.length ? (
                  <ul className="space-y-4">
                    {a.competencies.slice(0, 7).map((c) => (
                      <BarRow
                        key={c.competency_id}
                        name={competencyName(c.competency_id)}
                        value={`${ratePct(1 - c.error_rate)} de acerto`}
                        percent={(1 - c.error_rate) * 100}
                        tone={
                          c.error_rate > 0.35
                            ? 'bad'
                            : c.error_rate > 0.15
                              ? 'warn'
                              : 'ok'
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <Empty title="Sem dados por competência">
                    Aparecem quando o treinamento envia as etapas.
                  </Empty>
                )}
              </Card>
            </div>
          </Section>

          {!classId && a.classes.length ? (
            <Section
              title={isInstructor ? 'Minhas turmas' : 'Turmas'}
              action={
                <Link to="/app/turmas" className="p-action">
                  Ver turmas
                </Link>
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
                {a.classes.map((c) => (
                  <div key={c.class_id} className="p-card flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/app/turmas/${c.class_id}`}
                          className="p-link block truncate"
                        >
                          {c.name}
                        </Link>
                        <p className="truncate text-xs text-white/45">
                          {plural(c.learners, 'aluno', 'alunos')}
                          {c.instructor_names.length
                            ? ` · ${c.instructor_names.join(', ')}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={riskPill[c.risk]}
                        title={riskHelp[c.risk]}
                      >
                        {riskLabels[c.risk]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-white/45">Nota média</p>
                        <p className="text-2xl font-semibold tabular-nums text-white">
                          {formatScore(c.avg_score)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Sparkline values={c.weekly.map((w) => w.avg_score)} />
                        <p className="text-[11px] text-white/35">8 semanas</p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ['Participação', pct(c.participation)],
                        ['Aprovação', pct(c.pass_rate)],
                        ['Aptos', `${c.apto}/${c.paths}`],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-xl bg-white/[0.04] px-1 py-2"
                        >
                          <dt className="text-[11px] text-white/45">{k}</dt>
                          <dd className="text-sm font-semibold tabular-nums text-white">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-xs">
                      <span className="min-w-0 text-white/45">
                        {c.need_support ? (
                          <span className="text-rose-200">
                            {c.need_support} em reforço
                          </span>
                        ) : (
                          'Ninguém em reforço'
                        )}{' '}
                        · última tentativa {formatRelative(c.last_attempt_at)}
                      </span>
                      <button
                        type="button"
                        className="p-action p-action-accent shrink-0"
                        onClick={() => set('turma', c.class_id)}
                      >
                        Filtrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          <Section id="alunos" title="Alunos">
            <Card flush>
              <div className="flex flex-col gap-3 px-5 pt-5 sm:px-6 md:flex-row md:items-center md:justify-between">
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar aluno ou turma"
                  className="md:w-72"
                />
                <div className="overflow-x-auto">
                  <Segmented
                    value={filter}
                    onChange={setFilter}
                    options={learnerOptions.map((o) => ({
                      value: o.value,
                      label: `${o.label} ${count(o.value)}`,
                    }))}
                  />
                </div>
              </div>
              <div ref={stableTable}>
                {filtered.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr>
                          <th>Aluno</th>
                          <th>Situação</th>
                          <th>Conformidade</th>
                          <th className="text-right">Média</th>
                          <th className="hidden text-right 2xl:table-cell">
                            Última
                          </th>
                          <th className="text-right">Evolução</th>
                          <th className="text-right">Tentativas</th>
                          <th className="hidden text-right 2xl:table-cell">
                            Críticos
                          </th>
                          <th>Atividade</th>
                          <th>Progresso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.items.map((l) => (
                          <tr key={l.student_id}>
                            <td>
                              <Link
                                to={`/app/alunos/${l.student_id}`}
                                className="flex items-center gap-3"
                              >
                                <Avatar name={l.name} />
                                <span className="min-w-0">
                                  <span className="p-link block whitespace-nowrap">
                                    {l.name}
                                  </span>
                                  {!classId ? (
                                    <span className="block whitespace-nowrap text-xs text-white/40">
                                      {l.class_name}
                                    </span>
                                  ) : null}
                                </span>
                              </Link>
                            </td>
                            <td>
                              <span
                                className={`${signalPill[l.signal]} whitespace-nowrap`}
                                title={signalHelp[l.signal]}
                              >
                                {signalLabels[l.signal]}
                              </span>
                            </td>
                            <td>
                              {l.compliance ? (
                                <ComplianceBadge status={l.compliance} />
                              ) : (
                                <span className="text-white/35">—</span>
                              )}
                            </td>
                            <td className="text-right font-medium tabular-nums text-white">
                              {formatScore(l.avg_score)}
                            </td>
                            <td className="hidden text-right tabular-nums 2xl:table-cell">
                              {formatScore(l.last_score)}
                            </td>
                            <td
                              className={`text-right tabular-nums ${l.trend && l.trend > 0 ? 'text-emerald-200' : l.trend && l.trend < 0 ? 'text-rose-200' : ''}`}
                            >
                              {formatGain(l.trend)}
                            </td>
                            <td className="text-right tabular-nums">
                              {l.attempts}
                            </td>
                            <td
                              className={`hidden text-right tabular-nums 2xl:table-cell ${l.critical_errors ? 'text-rose-200' : 'text-white/45'}`}
                            >
                              {l.critical_errors}
                            </td>
                            <td
                              className="whitespace-nowrap text-white/60"
                              title={formatDateTime(l.last_attempt_at)}
                            >
                              {l.last_attempt_at
                                ? formatRelative(l.last_attempt_at)
                                : '—'}
                            </td>
                            <td>
                              <Progress value={l.completion_percent} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-5 sm:px-6">
                    <Empty
                      title={
                        a.learners.length
                          ? 'Nenhum aluno neste filtro'
                          : 'Nenhum aluno matriculado'
                      }
                    />
                  </div>
                )}
                {paged.pages > 1 ? (
                  <Pager {...paged} noun="alunos" />
                ) : (
                  <div className="h-2" />
                )}
              </div>
            </Card>
          </Section>
        </div>
      )}
    </>
  );
}
