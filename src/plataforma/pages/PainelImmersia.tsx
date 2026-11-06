import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Headset,
  Library,
  ListChecks,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { api, type ClientHealth, type PlatformAnalytics } from '../api';
import { CountBars, Donut, ScoreLine } from '../charts';
import {
  bucketLabel,
  courseCover,
  formatDelta,
  formatRelative,
  formatScore,
  healthColor,
  healthHelp,
  healthLabels,
  healthOrder,
  healthPill,
  pct,
  plural,
  useLoad,
  usePaged,
} from '../format';
import {
  Card,
  Empty,
  ErrorState,
  Kpi,
  Loading,
  PageTitle,
  Pager,
  Progress,
  SearchField,
  Segmented,
} from '../ui';

const PERIODS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '12 meses' },
  { value: '0', label: 'Tudo' },
] as const;
type Period = (typeof PERIODS)[number]['value'];
type Growth = 'new_learners' | 'first_vr' | 'attempts' | 'new_companies';
type OrgSort = 'health' | 'name' | 'learners' | 'activity' | 'score';
type Company = PlatformAnalytics['companies'][number];

const growthOptions: { value: Growth; label: string; unit: string }[] = [
  { value: 'new_learners', label: 'Novos alunos', unit: 'alunos' },
  { value: 'first_vr', label: 'Primeiro VR', unit: 'alunos' },
  { value: 'attempts', label: 'Tentativas', unit: 'tentativas' },
  { value: 'new_companies', label: 'Novos clientes', unit: 'organizações' },
];

const monthLabel = (date: string) => bucketLabel(date, 'month');

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
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

/** Do aluno cadastrado ao apto: quanto de cada etapa passa para a seguinte. */
function Funnel({ steps }: { steps: PlatformAnalytics['funnel'] }) {
  const top = Math.max(1, steps[0]?.value ?? 0);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : null;
        const share = Math.round((s.value / top) * 100);
        return (
          <li key={s.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-white/75">{s.label}</span>
              <span className="tabular-nums text-white">
                <span className="font-semibold">{s.value}</span>
                {prev != null ? (
                  <span
                    className="ml-2 text-xs text-white/45"
                    title="Da etapa anterior"
                  >
                    {prev ? `${Math.round((s.value / prev) * 100)}%` : '—'}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400/80 to-violet-500/80"
                style={{ width: `${Math.max(share, s.value ? 2 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function HealthPill({ health }: { health: ClientHealth }) {
  return (
    <span
      className={`status-pill ${healthPill[health]}`}
      title={healthHelp[health]}
    >
      {healthLabels[health]}
    </span>
  );
}

/** Immersia: a plataforma inteira — clientes, uso, crescimento, funil do aluno e cursos. */
export default function PainelImmersia() {
  const [params, setParams] = useSearchParams();
  const period = (params.get('periodo') ?? '30') as Period;
  const data = useLoad(
    () => api<PlatformAnalytics>(`/analytics/platform?days=${period}`),
    [period]
  );
  const [growth, setGrowth] = useState<Growth>('new_learners');
  const [orgQuery, setOrgQuery] = useState('');
  const [orgHealth, setOrgHealth] = useState<ClientHealth | 'all'>('all');
  const [orgSort, setOrgSort] = useState<OrgSort>('health');
  const [courseQuery, setCourseQuery] = useState('');

  const d = data.data;
  const orgs = useMemo(() => {
    const term = orgQuery.trim().toLocaleLowerCase('pt-BR');
    const rank = (c: Company) => healthOrder.indexOf(c.health);
    return (d?.companies ?? [])
      .filter(
        (c) =>
          (orgHealth === 'all' || c.health === orgHealth) &&
          (!term || c.name.toLocaleLowerCase('pt-BR').includes(term))
      )
      .sort((a, b) => {
        const byName = a.name.localeCompare(b.name, 'pt-BR');
        if (orgSort === 'name') return byName;
        if (orgSort === 'learners') return b.learners - a.learners || byName;
        if (orgSort === 'score')
          return (b.avg_score ?? -1) - (a.avg_score ?? -1) || byName;
        if (orgSort === 'activity')
          return (
            (b.last_activity_at ?? '').localeCompare(
              a.last_activity_at ?? ''
            ) || byName
          );
        return rank(a) - rank(b) || b.learners - a.learners || byName;
      });
  }, [d, orgQuery, orgHealth, orgSort]);
  const orgPage = usePaged(
    orgs,
    10,
    `${orgQuery}|${orgHealth}|${orgSort}|${period}`
  );
  const courses = useMemo(() => {
    const term = courseQuery.trim().toLocaleLowerCase('pt-BR');
    return (d?.courses ?? [])
      .filter((c) => !term || c.title.toLocaleLowerCase('pt-BR').includes(term))
      .sort(
        (a, b) =>
          b.learners - a.learners || a.title.localeCompare(b.title, 'pt-BR')
      );
  }, [d, courseQuery]);
  const coursePage = usePaged(courses, 10, `${courseQuery}|${period}`);

  const setPeriod = (v: Period) => {
    const next = new URLSearchParams(params);
    if (v === '30') next.delete('periodo');
    else next.set('periodo', v);
    setParams(next, { replace: true });
  };
  const periodText =
    period === '0'
      ? 'Desde o início'
      : `Últimos ${PERIODS.find((p) => p.value === period)?.label}`;

  return (
    <>
      <PageTitle
        title="Painel"
        subtitle="Immersia · todas as organizações"
        actions={
          <div className="overflow-x-auto">
            <Segmented
              value={period}
              onChange={setPeriod}
              options={[...PERIODS]}
            />
          </div>
        }
      />

      {data.loading && !d ? (
        <Loading />
      ) : data.error || !d ? (
        <ErrorState message={data.error} onRetry={() => void data.reload()} />
      ) : (
        <div
          className={`space-y-8 ${data.loading ? 'opacity-60 transition' : ''}`}
        >
          <Section title="Visão geral">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 3xl:grid-cols-8">
              <Kpi
                icon={Building2}
                label="Clientes ativos"
                value={
                  <>
                    {d.kpis.companies}
                    <span className="text-base text-white/45">
                      /{d.kpis.companies_total}
                    </span>
                  </>
                }
                hint={plural(
                  d.kpis.grants,
                  'curso liberado',
                  'cursos liberados'
                )}
              />
              <Kpi
                icon={GraduationCap}
                label="Alunos"
                value={d.kpis.learners}
                hint={
                  d.kpis.new_learners
                    ? `+${d.kpis.new_learners} no período`
                    : `${d.kpis.instructors} instrutores · ${d.kpis.managers} gestores`
                }
              />
              <Kpi
                icon={UsersRound}
                label="Alunos ativos"
                value={d.kpis.active_learners}
                hint={formatDelta(d.kpis.active_learners_delta) ?? periodText}
                tone={
                  d.kpis.active_learners_delta != null &&
                  d.kpis.active_learners_delta < 0
                    ? 'warn'
                    : undefined
                }
                help="Alunos com alguma tentativa de VR no período."
              />
              <Kpi
                icon={Activity}
                label="Tentativas VR"
                value={d.kpis.attempts}
                hint={
                  formatDelta(d.kpis.attempts_delta) ??
                  `+ ${plural(d.kpis.practice_runs, 'rodada de teste', 'rodadas de teste')}`
                }
                help="Tentativas de alunos. Rodadas de teste não contam."
              />
              <Kpi
                icon={Star}
                label="Nota média"
                value={formatScore(d.kpis.avg_score)}
                hint={
                  formatDelta(d.kpis.avg_score_delta, ' pts') ??
                  'Tentativas de alunos'
                }
              />
              <Kpi
                icon={CheckCircle2}
                label="Aprovação"
                value={pct(d.kpis.pass_rate)}
                hint="Tentativas no critério"
              />
              <Kpi
                icon={Clock}
                label="Tempo em VR"
                value={
                  d.kpis.vr_minutes >= 120
                    ? `${Math.round(d.kpis.vr_minutes / 60)} h`
                    : `${d.kpis.vr_minutes} min`
                }
                hint={`${plural(d.kpis.quizzes, 'quiz respondido', 'quizzes respondidos')}`}
              />
              <Kpi
                icon={ShieldCheck}
                label="Conformidade"
                value={pct(d.kpis.compliance)}
                hint={`${d.kpis.apto} de ${d.kpis.paths} aptos`}
                tone={
                  d.kpis.compliance != null && d.kpis.compliance < 50
                    ? 'warn'
                    : undefined
                }
                help="Alunos aptos (dentro da validade), sobre todos os cursos atribuídos."
              />
            </div>
          </Section>

          <Section title="Uso">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Card title="Tentativas e alunos ativos">
                <CountBars
                  height={150}
                  points={d.timeline.map((p) => ({
                    label: bucketLabel(p.date, d.bucket),
                    value: p.attempts,
                    detail: `${plural(p.learners, 'aluno', 'alunos')}`,
                  }))}
                />
                <p className="mb-2 mt-5 text-xs text-white/45">Nota média</p>
                <ScoreLine
                  height={150}
                  reference={70}
                  points={d.timeline.map((p) => ({
                    label: bucketLabel(p.date, d.bucket),
                    value: p.avg_score,
                  }))}
                />
              </Card>
              <Card title="Funil do aluno">
                <Funnel steps={d.funnel} />
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                  <div>
                    <p className="text-xs text-white/45">Fizeram o VR</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">
                      {d.vr_funnel.tried}
                      <span className="ml-1.5 text-xs font-normal text-white/45">
                        {pct(
                          d.funnel[1]?.value
                            ? Math.round(
                                (d.vr_funnel.tried / d.funnel[1].value) * 100
                              )
                            : null
                        )}{' '}
                        dos com curso
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/45">
                      Atingiram o critério no VR
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">
                      {d.vr_funnel.passed}
                      <span className="ml-1.5 text-xs font-normal text-white/45">
                        {pct(
                          d.vr_funnel.tried
                            ? Math.round(
                                (d.vr_funnel.passed / d.vr_funnel.tried) * 100
                              )
                            : null
                        )}{' '}
                        de quem fez
                      </span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-white/40">
                  Desde o início, todas as organizações. A porcentagem compara
                  com a etapa anterior.
                </p>
              </Card>
            </div>
          </Section>

          <Section title="Crescimento · últimos 12 meses">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Card
                title={growthOptions.find((g) => g.value === growth)?.label}
                action={
                  <div className="overflow-x-auto">
                    <Segmented
                      value={growth}
                      onChange={setGrowth}
                      options={growthOptions.map(({ value, label }) => ({
                        value,
                        label,
                      }))}
                    />
                  </div>
                }
              >
                <CountBars
                  height={170}
                  unit={growthOptions.find((g) => g.value === growth)?.unit}
                  points={d.growth.map((m) => ({
                    label: monthLabel(m.month),
                    value: m[growth],
                  }))}
                />
              </Card>
              <Card title="Catálogo e equipamentos">
                <dl className="grid grid-cols-2 gap-3">
                  {(
                    [
                      [Library, 'Cursos publicados', d.kpis.courses_published],
                      [ListChecks, 'Liberações ativas', d.kpis.grants],
                      [Headset, 'Quests vinculados', d.kpis.quests],
                      [
                        Activity,
                        'Quests usados no período',
                        d.kpis.quests_used,
                      ],
                    ] as const
                  ).map(([Icon, label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/[0.04] px-4 py-3"
                    >
                      <dt className="flex items-center gap-1.5 text-xs text-white/50">
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs text-white/45">
                  Quiz: {pct(d.kpis.quiz_pass_rate)} de aprovação em{' '}
                  {plural(d.kpis.quizzes, 'tentativa', 'tentativas')} no
                  período.
                </p>
              </Card>
            </div>
          </Section>

          <Section title="Clientes">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
              <Card title="Saúde">
                <Donut
                  slices={healthOrder.map((h) => ({
                    key: h,
                    label: healthLabels[h],
                    value: d.companies.filter((c) => c.health === h).length,
                    color: healthColor[h],
                  }))}
                  center={d.companies.length}
                  caption="organizações"
                />
                <ul className="mt-4 space-y-1.5 text-xs text-white/50">
                  {healthOrder.map((h) => (
                    <li key={h}>
                      <span className="text-white/75">{healthLabels[h]}:</span>{' '}
                      {healthHelp[h]}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card
                flush
                title="Organizações"
                action={
                  <SearchField
                    value={orgQuery}
                    onChange={setOrgQuery}
                    placeholder="Buscar organização"
                    className="w-full sm:w-60"
                  />
                }
              >
                <div className="flex flex-col gap-2 px-5 pb-3 sm:flex-row sm:items-center sm:px-6">
                  <div className="overflow-x-auto">
                    <Segmented<ClientHealth | 'all'>
                      value={orgHealth}
                      onChange={setOrgHealth}
                      options={[
                        { value: 'all', label: `Todas ${d.companies.length}` },
                        ...healthOrder
                          .map((h) => ({
                            value: h,
                            label: `${healthLabels[h]} ${d.companies.filter((c) => c.health === h).length}`,
                            n: d.companies.filter((c) => c.health === h).length,
                          }))
                          .filter((o) => o.n)
                          .map(({ value, label }) => ({ value, label })),
                      ]}
                    />
                  </div>
                  <select
                    className="admin-select sm:ml-auto sm:w-52"
                    value={orgSort}
                    onChange={(e) => setOrgSort(e.target.value as OrgSort)}
                    aria-label="Ordenar organizações"
                  >
                    <option value="health">Precisam de atenção</option>
                    <option value="activity">Atividade recente</option>
                    <option value="learners">Mais alunos</option>
                    <option value="score">Maior nota</option>
                    <option value="name">Nome</option>
                  </select>
                </div>
                {orgs.length ? (
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr>
                          <th>Organização</th>
                          <th>Saúde</th>
                          <th className="text-right">Alunos</th>
                          <th
                            className="text-right"
                            title="Alunos que treinaram no período"
                          >
                            Ativos
                          </th>
                          <th className="text-right">Tentativas</th>
                          <th className="text-right">Média</th>
                          <th className="hidden text-right 2xl:table-cell">
                            Cursos
                          </th>
                          <th className="hidden text-right 2xl:table-cell">
                            Quests
                          </th>
                          <th>Conformidade</th>
                          <th>Última atividade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgPage.items.map((c) => (
                          <tr
                            key={c.company_id}
                            className={c.active ? '' : 'opacity-50'}
                          >
                            <td>
                              <Link
                                to={`/app/organizacoes/${c.company_id}`}
                                className="p-link"
                              >
                                {c.name}
                              </Link>
                            </td>
                            <td>
                              <HealthPill health={c.health} />
                            </td>
                            <td className="text-right tabular-nums">
                              {c.learners}
                            </td>
                            <td className="text-right tabular-nums">
                              {c.active_learners}
                              <span className="ml-1 text-xs text-white/40">
                                {pct(c.participation)}
                              </span>
                            </td>
                            <td className="text-right tabular-nums">
                              {c.attempts}
                            </td>
                            <td className="text-right tabular-nums">
                              {formatScore(c.avg_score)}
                            </td>
                            <td className="hidden text-right tabular-nums 2xl:table-cell">
                              {c.courses}
                            </td>
                            <td className="hidden text-right tabular-nums 2xl:table-cell">
                              {c.quests}
                            </td>
                            <td>
                              {c.paths ? (
                                <Progress value={c.compliance ?? 0} />
                              ) : (
                                <span className="text-white/35">—</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap text-white/55">
                              {c.last_activity_at
                                ? formatRelative(c.last_activity_at)
                                : 'nunca'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 pb-5 sm:px-6">
                    <Empty title="Nenhuma organização encontrada" />
                  </div>
                )}
                <Pager {...orgPage} noun="organizações" />
              </Card>
            </div>
          </Section>

          <Section title="Cursos">
            <Card
              flush
              title="Desempenho por curso"
              action={
                <SearchField
                  value={courseQuery}
                  onChange={setCourseQuery}
                  placeholder="Buscar curso"
                  className="w-full sm:w-60"
                />
              }
            >
              {courses.length ? (
                <div className="overflow-x-auto">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>Curso</th>
                        <th
                          className="text-right"
                          title="Organizações com o curso liberado"
                        >
                          Clientes
                        </th>
                        <th className="text-right">Alunos</th>
                        <th>Progresso médio</th>
                        <th>Aptos</th>
                        <th className="text-right">Tentativas VR</th>
                        <th className="text-right">Média</th>
                        <th className="text-right">Aprovação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursePage.items.map((c) => (
                        <tr key={c.course_id}>
                          <td>
                            <Link
                              to={`/app/cursos/${c.course_id}`}
                              className="flex items-center gap-3"
                            >
                              {courseCover(c.cover_url) ? (
                                <img
                                  src={courseCover(c.cover_url) ?? ''}
                                  alt=""
                                  className="h-9 w-14 shrink-0 rounded-lg object-cover"
                                />
                              ) : (
                                <span className="h-9 w-14 shrink-0 rounded-lg bg-gradient-to-br from-cyan-500/20 via-violet-600/20 to-fuchsia-600/15" />
                              )}
                              <span className="p-link">{c.title}</span>
                            </Link>
                          </td>
                          <td className="text-right tabular-nums">
                            {c.companies}
                          </td>
                          <td className="text-right tabular-nums">
                            {c.learners}
                          </td>
                          <td>
                            {c.completion_percent != null ? (
                              <Progress value={c.completion_percent} />
                            ) : (
                              <span className="text-white/35">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap tabular-nums">
                            {c.learners ? (
                              <>
                                {c.apto}
                                <span className="ml-1 text-xs text-white/40">
                                  {pct(c.compliance)}
                                </span>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="text-right tabular-nums">
                            {c.attempts || '—'}
                          </td>
                          <td className="text-right tabular-nums">
                            {formatScore(c.avg_score)}
                          </td>
                          <td className="text-right tabular-nums">
                            {pct(c.pass_rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 pb-5 sm:px-6">
                  <Empty title="Nenhum curso encontrado" />
                </div>
              )}
              <Pager {...coursePage} noun="cursos" />
            </Card>
          </Section>
        </div>
      )}
    </>
  );
}
