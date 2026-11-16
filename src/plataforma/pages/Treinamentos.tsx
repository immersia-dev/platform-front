import {
  BarChart3,
  CheckCircle2,
  FlaskConical,
  Glasses,
  Layers,
  MapPin,
  Target,
  TriangleAlert,
  UsersRound,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { api, type Company, type TrainingSummary } from '../api';
import { Sparkline, StackedBar } from '../charts';
import {
  competencyName,
  complianceColor,
  criterionText,
  formatDuration,
  formatRelative,
  formatScore,
  pct,
  plural,
  courseCover,
  trainingPlaces,
  useLoad,
} from '../format';
import { Empty, ErrorState, Kpi, Loading, PageTitle } from '../ui';

/** Cobertura do treinamento: aprovados, tentaram sem aprovar, ainda não tentaram. */
function coverageSlices(t: TrainingSummary) {
  return [
    {
      key: 'passed',
      label: 'Aprovados',
      value: t.learners_passed,
      color: complianceColor.apto,
    },
    {
      key: 'tried',
      label: 'Sem aprovação',
      value: Math.max(0, t.learners_tried - t.learners_passed),
      color: complianceColor.revisar,
    },
    {
      key: 'untried',
      label: 'Não tentaram',
      value: Math.max(0, t.learners_total - t.learners_tried),
      color: complianceColor.pendente,
    },
  ];
}

function Cover({
  training,
  featured,
  link,
}: {
  training: TrainingSummary;
  featured: boolean;
  link: string;
}) {
  const cover = courseCover(training.cover_url);
  const place = trainingPlaces[training.unity_key];
  return (
    <Link
      to={link}
      className={`relative block overflow-hidden ${featured ? 'h-56 sm:h-72 lg:h-full lg:min-h-[26rem]' : 'h-44'}`}
      tabIndex={-1}
      aria-hidden="true"
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20">
          <Glasses className="h-12 w-12 text-white/50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0918] via-[#0b0918]/30 to-transparent" />
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="chip-overlay">
          <Glasses className="h-3.5 w-3.5" /> VR
        </span>
        {place ? (
          <span className="chip-overlay">
            <MapPin className="h-3.5 w-3.5" /> {place}
          </span>
        ) : null}
        <span
          className="chip-overlay chip-overlay-muted"
          title="Versão do conteúdo"
        >
          v{training.content_version}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">
          {training.course_title}
        </p>
        <h2
          className={`mt-1 font-semibold leading-tight text-white ${featured ? 'text-2xl sm:text-3xl' : 'text-lg'}`}
        >
          {training.title}
        </h2>
      </div>
    </Link>
  );
}

function TrainingCard({
  training: t,
  featured,
  companyId,
}: {
  training: TrainingSummary;
  featured: boolean;
  companyId: string;
}) {
  const link = `/app/treinamentos/${t.lesson_id}${companyId ? `?empresa=${companyId}` : ''}`;
  const stats: [string, string, string?][] = [
    ['Tentativas', String(t.attempts)],
    ['Média', formatScore(t.avg_score)],
    ['Aprovação', pct(t.pass_rate), 'Tentativas que atingiram o critério.'],
    [
      'Na 1ª',
      pct(t.first_try_pass_rate),
      'Alunos aprovados já na primeira tentativa.',
    ],
  ];
  const coverage = t.learners_total
    ? Math.round((t.learners_passed / t.learners_total) * 100)
    : 0;

  return (
    <article
      className={`group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:border-cyan-300/30 ${featured ? 'lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : 'flex flex-col'}`}
    >
      <Cover training={t} featured={featured} link={link} />
      <div
        className={`flex flex-1 flex-col ${featured ? 'p-5 sm:p-7' : 'p-5'}`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-amber-100">
            <Target className="h-3.5 w-3.5" />
            {criterionText(t.passing_score, t.max_critical_errors)}
          </span>
          <span>{plural(t.classes, 'turma', 'turmas')}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(t.avg_duration_seconds)} em média</span>
        </div>

        <dl className="mt-5 grid grid-cols-4 gap-2">
          {stats.map(([k, v, help]) => (
            <div
              key={k}
              className="rounded-2xl bg-white/[0.04] px-1 py-3 text-center"
              title={help}
            >
              <dt className="text-[11px] text-white/45">{k}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-white/70">Alunos aprovados</span>
            <span className="tabular-nums text-white">
              <span className="text-lg font-semibold">{t.learners_passed}</span>
              <span className="text-white/45">/{t.learners_total}</span>
              <span className="ml-2 text-xs text-white/45">{coverage}%</span>
            </span>
          </div>
          <StackedBar slices={coverageSlices(t)} legend />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.06] px-3 py-3">
            <p className="text-[11px] text-white/45">Nota por semana</p>
            <div className="mt-1.5">
              <Sparkline
                values={t.weekly.map((w) => w.avg_score)}
                width={featured ? 140 : 110}
                height={30}
              />
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              {t.last_attempt_at
                ? `Última ${formatRelative(t.last_attempt_at)}`
                : 'Sem tentativas'}
            </p>
          </div>
          <div
            className="rounded-2xl border border-white/[0.06] px-3 py-3"
            title="Competência com mais erros nas etapas"
          >
            <p className="flex items-center gap-1 text-[11px] text-white/45">
              <TriangleAlert className="h-3 w-3 text-amber-200/80" /> Mais
              difícil
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
              {competencyName(t.weakest_competency)}
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-white/45">
          <FlaskConical className="h-3.5 w-3.5 text-violet-200/80" />
          {t.practice_runs
            ? `${plural(t.practice_runs, 'rodada de teste', 'rodadas de teste')} (não contam)`
            : 'Nenhuma rodada de teste'}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Link to={link} className="secondary-btn flex-1 sm:flex-none sm:px-5">
            <BarChart3 className="h-4 w-4" /> Ver análise
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Treinamentos VR como conteúdo da Immersia: uso e desempenho em todas as organizações (ou em uma), para saber
 * onde o treinamento precisa melhorar. Só a equipe Immersia vê esta tela.
 */
export default function Treinamentos() {
  const [params, setParams] = useSearchParams();
  const companyId = params.get('empresa') ?? '';
  const companies = useLoad(
    () => api<Company[]>('/companies').catch(() => [] as Company[]),
    []
  );
  const data = useLoad(
    () =>
      api<TrainingSummary[]>(
        `/analytics/trainings?days=0${companyId ? `&company_id=${companyId}` : ''}`
      ),
    [companyId]
  );
  const list = data.data ?? [];

  const sum = (pick: (t: TrainingSummary) => number) =>
    list.reduce((s, t) => s + pick(t), 0);
  const attempts = sum((t) => t.attempts);
  const avg = attempts
    ? sum((t) => (t.avg_score ?? 0) * (t.avg_score == null ? 0 : t.attempts)) /
      sum((t) => (t.avg_score == null ? 0 : t.attempts))
    : null;
  const passed = sum((t) => t.learners_passed);
  const total = sum((t) => t.learners_total);
  const tried = sum((t) => t.learners_tried);
  const practice = sum((t) => t.practice_runs);

  return (
    <>
      <PageTitle
        title="Treinamentos VR"
        subtitle="Uso e desempenho do conteúdo VR, para saber onde cada treinamento precisa melhorar"
        actions={
          <select
            className="admin-select sm:w-72"
            value={companyId}
            onChange={(e) =>
              setParams(e.target.value ? { empresa: e.target.value } : {}, {
                replace: true,
              })
            }
            aria-label="Organização"
          >
            <option value="">Todas as organizações</option>
            {(companies.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        }
      />

      {data.loading && !data.data ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={() => void data.reload()} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={Layers}
              label="Treinamentos"
              value={list.length}
              hint={
                list.length
                  ? plural(
                      new Set(list.map((t) => t.course_id)).size,
                      'curso',
                      'cursos'
                    )
                  : 'Nenhum'
              }
            />
            <Kpi
              icon={UsersRound}
              label="Tentativas"
              value={attempts}
              hint={
                practice
                  ? `+ ${plural(practice, 'rodada de teste', 'rodadas de teste')}`
                  : 'Desde o início'
              }
              help="Tentativas de alunos. Rodadas de teste não contam."
            />
            <Kpi
              icon={Target}
              label="Nota média"
              value={formatScore(avg)}
              hint="Todas as tentativas"
            />
            <Kpi
              icon={CheckCircle2}
              label="Alunos aprovados"
              value={
                <>
                  {passed}
                  <span className="text-base text-white/45">/{total}</span>
                </>
              }
              tone={total && passed === total ? 'ok' : undefined}
              hint={`${tried} já tentaram`}
              help="Alunos com alguma tentativa no critério, sobre os alunos que têm o treinamento."
            />
          </div>

          {list.length ? (
            <div
              className={
                list.length === 1
                  ? ''
                  : 'grid gap-5 md:grid-cols-2 2xl:grid-cols-3'
              }
            >
              {list.map((t) => (
                <TrainingCard
                  key={t.lesson_id}
                  training={t}
                  featured={list.length === 1}
                  companyId={companyId}
                />
              ))}
            </div>
          ) : (
            <section className="p-card">
              <Empty title="Nenhum treinamento VR">
                Aparecem aqui os treinamentos VR dos cursos publicados
                {companyId ? ' e liberados para esta organização' : ''}.
              </Empty>
            </section>
          )}
        </div>
      )}
    </>
  );
}
