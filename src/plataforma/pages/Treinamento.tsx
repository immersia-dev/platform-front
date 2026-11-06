import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Glasses,
  MapPin,
  ShieldAlert,
  Target,
  TrendingUp,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import {
  api,
  type Analytics,
  type Company,
  type StepStat,
  type TrainingSummary,
} from '../api';
import { Donut, Meter, ScoreLine, ValueColumns } from '../charts';
import {
  bandLabels,
  bucketLabel,
  competencyName,
  complianceColor,
  complianceLabels,
  complianceOrder,
  criterionText,
  errorLabels,
  formatDuration,
  formatGain,
  formatScore,
  label,
  pct,
  plural,
  ratePct,
  stepLabels,
  courseCover,
  trainingPlaces,
  useLoad,
} from '../format';
import { Card, Empty, ErrorState, Kpi, Loading, Segmented } from '../ui';

const PERIODS = [
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '0', label: 'Tudo' },
] as const;
type Period = (typeof PERIODS)[number]['value'];

const bandTone = {
  otimo: 'ok',
  bom: 'cyan',
  atencao: 'warn',
  critico: 'bad',
} as const;

/** Cor da etapa pela taxa de erro: crítico em vermelho, acima de 25% em âmbar. */
function stepTone(s: StepStat) {
  if (s.critical_errors) return 'bad' as const;
  if (s.error_rate >= 0.25) return 'warn' as const;
  return s.error_rate > 0 ? ('cyan' as const) : ('ok' as const);
}

function seconds(ms: number | null) {
  return ms == null ? '—' : `${Math.round(ms / 1000)} s`;
}

function Banner({ training }: { training: TrainingSummary | null }) {
  const cover = training ? courseCover(training.cover_url) : null;
  const place = training ? trainingPlaces[training.unity_key] : undefined;
  return (
    <section className="relative mb-5 overflow-hidden rounded-3xl border border-white/10">
      {cover ? (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0918] via-[#0b0918]/85 to-[#0b0918]/30" />
      <div className="relative flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <span className="chip-overlay">
              <Glasses className="h-3.5 w-3.5" /> VR
            </span>
            {place ? (
              <span className="chip-overlay">
                <MapPin className="h-3.5 w-3.5" /> {place}
              </span>
            ) : null}
            {training ? (
              <span
                className="chip-overlay chip-overlay-muted"
                title="Versão do conteúdo"
              >
                v{training.content_version}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">
            {training?.course_title ?? 'Treinamento VR'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
            {training?.title ?? 'Treinamento'}
          </h1>
          {training ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-100">
              <Target className="h-3.5 w-3.5" />
              {criterionText(
                training.passing_score,
                training.max_critical_errors
              )}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StepFunnel({ steps }: { steps: StepStat[] }) {
  const ordered = [...steps].sort((a, b) => a.position - b.position);
  const worst = new Set(
    [...steps]
      .filter((s) => s.error_rate > 0)
      .sort(
        (a, b) =>
          b.error_rate - a.error_rate || b.critical_errors - a.critical_errors
      )
      .slice(0, 2)
      .map((s) => s.step_id)
  );
  const cols =
    'md:grid md:grid-cols-[2rem_minmax(0,1.5fr)_minmax(0,1.3fr)_4.5rem_4.5rem_minmax(0,1.5fr)] md:items-center md:gap-4';
  return (
    <div>
      <div
        className={`hidden px-3 pb-2 text-xs font-medium text-white/40 ${cols}`}
      >
        <span>#</span>
        <span>Etapa</span>
        <span>Com erro</span>
        <span className="text-right">Tempo</span>
        <span className="text-right" title="Dicas por tentativa">
          Dicas
        </span>
        <span>Erro mais comum</span>
      </div>
      <ol className="space-y-1.5">
        {ordered.map((s, i) => {
          const hard = worst.has(s.step_id);
          const top = s.top_errors[0];
          return (
            <li
              key={s.step_id}
              className={`rounded-2xl border px-3 py-3 ${hard ? 'border-rose-300/25 bg-rose-400/[0.06]' : 'border-transparent bg-white/[0.025]'} ${cols}`}
            >
              <div className="flex items-start gap-3 md:contents">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${hard ? 'bg-rose-400/20 text-rose-100' : 'bg-white/[0.06] text-white/60'}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
                    {label(stepLabels, s.step_id)}
                    {hard ? (
                      <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                        Mais difícil
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {competencyName(s.competency_id)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 md:mt-0">
                <div className="flex-1">
                  <Meter value={s.error_rate * 100} tone={stepTone(s)} />
                </div>
                <span
                  className={`w-24 shrink-0 text-right text-sm tabular-nums md:w-12 ${s.error_rate > 0 ? 'text-white' : 'text-white/45'}`}
                  title={`${ratePct(s.error_rate)} das tentativas tiveram erro nesta etapa`}
                >
                  {ratePct(s.error_rate)}
                  <span className="text-xs text-white/40 md:hidden">
                    {' '}
                    com erro
                  </span>
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-white/50 md:contents">
                <span className="tabular-nums md:text-right md:text-sm md:text-white/75">
                  <span className="md:hidden">Tempo </span>
                  {seconds(s.avg_duration_ms)}
                </span>
                <span className="tabular-nums md:text-right md:text-sm md:text-white/75">
                  <span className="md:hidden">Dicas </span>
                  {s.hints_per_step.toLocaleString('pt-BR', {
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate md:text-sm md:text-white/70">
                  {top ? (
                    <span title={`${top.count} ocorrências`}>
                      {label(errorLabels, top.type)}{' '}
                      <span className="text-white/40">({top.count})</span>
                    </span>
                  ) : (
                    <span className="text-white/35">—</span>
                  )}
                  {s.critical_errors ? (
                    <span className="ml-2 text-rose-200">
                      {plural(s.critical_errors, 'crítico', 'críticos')}
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Análise de um treinamento VR para a equipe Immersia: desempenho, etapas e erros, em todas as organizações ou em uma. */
export default function Treinamento() {
  const { lessonId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const period = (params.get('periodo') ?? '0') as Period;
  const companyId = params.get('empresa') ?? '';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const meta = useLoad(async () => {
    const [trainings, companies] = await Promise.all([
      api<TrainingSummary[]>(
        `/analytics/trainings?days=0${companyId ? `&company_id=${companyId}` : ''}`
      ),
      api<Company[]>('/companies').catch(() => [] as Company[]),
    ]);
    return {
      training: trainings.find((t) => t.lesson_id === lessonId) ?? null,
      companies,
    };
  }, [lessonId, companyId]);

  const query = useMemo(() => {
    const q = new URLSearchParams({ lesson_id: lessonId, days: period });
    if (companyId) q.set('company_id', companyId);
    return q.toString();
  }, [lessonId, period, companyId]);
  const data = useLoad(() => api<Analytics>(`/analytics?${query}`), [query]);

  const training = meta.data?.training ?? null;
  const a = data.data;
  const reference = training?.passing_score ?? a?.lessons[0]?.passing_score;
  const maxError = Math.max(1, ...(a?.error_types.map((e) => e.count) ?? []));
  const companyOptions = meta.data?.companies ?? [];

  if (meta.loading && !meta.data) return <Loading />;
  if (meta.error)
    return (
      <ErrorState message={meta.error} onRetry={() => void meta.reload()} />
    );

  return (
    <>
      <Link
        to={`/app/treinamentos${companyId ? `?empresa=${companyId}` : ''}`}
        className="p-back"
      >
        <ArrowLeft className="h-4 w-4" /> Treinamentos
      </Link>
      <Banner training={training} />

      {!training ? (
        <section className="p-card">
          <Empty title="Treinamento não encontrado">
            Ele pode não estar liberado para esta organização.
          </Empty>
        </section>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              className="admin-select sm:max-w-72"
              value={companyId}
              onChange={(e) => set('empresa', e.target.value)}
              aria-label="Organização"
            >
              <option value="">Todas as organizações</option>
              {companyOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="overflow-x-auto">
              <Segmented
                value={period}
                onChange={(v) => set('periodo', v === '0' ? '' : v)}
                options={[...PERIODS]}
              />
            </div>
          </div>

          {data.loading && !a ? (
            <Loading />
          ) : data.error || !a ? (
            <ErrorState
              message={data.error}
              onRetry={() => void data.reload()}
            />
          ) : (
            <div
              className={`space-y-5 ${data.loading ? 'opacity-60 transition' : ''}`}
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 3xl:grid-cols-8">
                <Kpi
                  icon={Activity}
                  label="Tentativas"
                  value={a.kpis.attempts}
                  hint={
                    period === '0' ? 'Desde o início' : `Últimos ${period} dias`
                  }
                  help="Rodadas de teste não contam."
                />
                <Kpi
                  icon={UsersRound}
                  label="Alunos"
                  value={
                    <>
                      {a.kpis.active_learners}
                      <span className="text-base text-white/45">
                        /{a.kpis.learners}
                      </span>
                    </>
                  }
                  hint={`${pct(a.kpis.participation)} treinaram`}
                  help="Alunos que treinaram no período, sobre os que têm o treinamento."
                />
                <Kpi
                  icon={Target}
                  label="Nota média"
                  value={formatScore(a.kpis.avg_score)}
                  tone={
                    a.kpis.avg_score != null &&
                    reference != null &&
                    a.kpis.avg_score < reference
                      ? 'warn'
                      : undefined
                  }
                  hint={`Mínimo ${formatScore(reference)}`}
                />
                <Kpi
                  icon={CheckCircle2}
                  label="Aprovação"
                  value={pct(a.kpis.pass_rate)}
                  hint="Tentativas no critério"
                  help="Tentativas que atingiram a nota mínima sem passar do limite de erros críticos."
                />
                <Kpi
                  icon={Trophy}
                  label="Aprovados na 1ª"
                  value={pct(a.kpis.first_try_pass_rate)}
                  hint="Dos que tentaram"
                  help="Alunos que atingiram o critério já na primeira tentativa."
                />
                <Kpi
                  icon={Clock}
                  label="Tempo médio"
                  value={formatDuration(a.kpis.avg_duration_seconds)}
                  hint="Por tentativa"
                />
                <Kpi
                  icon={ShieldAlert}
                  label="Erros críticos"
                  value={a.kpis.critical_errors}
                  tone={a.kpis.critical_errors ? 'bad' : 'ok'}
                  hint={plural(a.kpis.hints, 'dica usada', 'dicas usadas')}
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
                  help="Média do ganho de nota de quem repetiu o treinamento."
                />
              </div>

              <div className="grid items-start gap-5 xl:grid-cols-3">
                <Card title="Evolução da nota" className="xl:col-span-2">
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
                </Card>
                <Card title="Faixas de nota">
                  {a.kpis.attempts ? (
                    <ul className="space-y-4">
                      {a.score_bands.map((b) => (
                        <li key={b.key}>
                          <div className="mb-1.5 flex items-baseline justify-between text-sm">
                            <span className="text-white/80">
                              {bandLabels[b.key]}
                              <span className="ml-2 text-xs text-white/40">
                                {b.key === 'critico'
                                  ? '< 70'
                                  : `${b.min}–${b.max}`}
                              </span>
                            </span>
                            <span className="tabular-nums text-white/60">
                              {b.count} · {b.percent}%
                            </span>
                          </div>
                          <Meter value={b.percent} tone={bandTone[b.key]} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty title="Sem tentativas no período" />
                  )}
                </Card>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-2">
                <Card title="Curva por tentativa">
                  <ValueColumns
                    reference={reference}
                    empty="Sem tentativas no período."
                    points={a.by_attempt_number.map((p) => ({
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
                <Card title="Situação no curso">
                  {a.kpis.paths ? (
                    <Donut
                      size={150}
                      caption="alunos"
                      slices={complianceOrder
                        .filter((s) => a.kpis.status_counts[s])
                        .map((s) => ({
                          key: s,
                          label: complianceLabels[s],
                          value: a.kpis.status_counts[s],
                          color: complianceColor[s],
                        }))}
                    />
                  ) : (
                    <Empty title="Nenhum aluno com o curso" />
                  )}
                </Card>
              </div>

              <Card
                title="Etapa por etapa"
                action={
                  a.steps.length ? (
                    <span className="hidden text-xs text-white/45 sm:inline">
                      % das tentativas com erro na etapa
                    </span>
                  ) : null
                }
              >
                {a.steps.length ? (
                  <StepFunnel
                    steps={a.steps.filter((s) => s.lesson_id === lessonId)}
                  />
                ) : (
                  <Empty
                    title={
                      a.kpis.attempts
                        ? 'Sem dados por etapa'
                        : 'Sem tentativas no período'
                    }
                  >
                    {a.kpis.attempts
                      ? 'Aparecem quando o Quest envia as etapas.'
                      : null}
                  </Empty>
                )}
              </Card>

              <div className="grid items-start gap-5 xl:grid-cols-2">
                <Card title="Erros mais comuns">
                  {a.error_types.length ? (
                    <ul className="space-y-4">
                      {a.error_types.slice(0, 7).map((e) => (
                        <li key={e.type}>
                          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                            <span className="min-w-0 text-white/85">
                              {label(errorLabels, e.type)}
                            </span>
                            <span className="shrink-0 tabular-nums text-white/60">
                              {e.count}
                              {e.critical ? (
                                <span className="ml-2 text-rose-200">
                                  {plural(e.critical, 'crítico', 'críticos')}
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <Meter
                            value={(e.count / maxError) * 100}
                            tone={e.critical ? 'bad' : 'warn'}
                          />
                        </li>
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

                <Card title="Competências">
                  {a.competencies.length ? (
                    <ul className="space-y-3.5">
                      {[...a.competencies]
                        .sort((x, y) => y.error_rate - x.error_rate)
                        .map((c) => (
                          <li key={c.competency_id}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                              <span className="min-w-0 truncate text-white/85">
                                {competencyName(c.competency_id)}
                              </span>
                              <span className="shrink-0 tabular-nums text-white/60">
                                {ratePct(1 - c.error_rate)} de acerto
                                {c.critical_errors ? (
                                  <span className="ml-2 text-rose-200">
                                    {plural(
                                      c.critical_errors,
                                      'crítico',
                                      'críticos'
                                    )}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                            <Meter
                              value={(1 - c.error_rate) * 100}
                              tone={
                                c.critical_errors
                                  ? 'bad'
                                  : c.error_rate > 0.25
                                    ? 'warn'
                                    : 'ok'
                              }
                            />
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <Empty title="Sem dados por competência">
                      Aparecem quando o Quest envia as etapas.
                    </Empty>
                  )}
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
