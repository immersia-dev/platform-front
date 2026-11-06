import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenText,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  UsersRound,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import AnalyticsLineChart from '../components/AnalyticsLineChart';
import StatCard from '../components/StatCard';
import { useAuth } from '../auth/useAuth';
import {
  modulesSeed,
  organizationsSeed,
  studentGroupsSeed,
  usersSeed,
} from '../data/mockPlatform';
import {
  type AttemptDetails,
  formatDateTime,
  getInstructorAnalytics,
  getRiskLabel,
  getRiskPillClass,
  type RiskLevel,
} from '../lib/instructorAnalytics';
import { pluralize } from '../lib/pluralize';
import { getCatalogSummary, getModuleTrainingCount, isModuleComingSoon } from '../lib/studyPlatform';

type SummaryCard = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

function getOutcomeLabel(outcome: AttemptDetails['attempt']['outcome']) {
  return outcome === 'approved' ? 'Aprovado' : 'Reforço';
}

function getOutcomePillClass(outcome: AttemptDetails['attempt']['outcome']) {
  if (outcome === 'approved') return 'status-pill status-pill-success';
  return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
}

function formatLearningGain(value: number) {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return '0%';
}

function getRoundedAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

/** Percentual de nota, ou "—" quando ainda não existe tentativa para calcular. */
function formatScore(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${value}%`;
}

function buildAttemptReport(item: AttemptDetails) {
  return [
    'Relatório da execução',
    '',
    `Aluno: ${item.learnerName}`,
    `Turma: ${item.groupName} (${item.groupCode})`,
    `Treinamento: ${item.trainingTitle}`,
    `Módulo: ${item.moduleName}`,
    `Tentativa: ${item.attempt.attemptNumber}`,
    `Concluído em: ${formatDateTime(item.attempt.completedAt)}`,
    '',
    'Indicadores',
    `Nota: ${item.attempt.score}%`,
    `Acurácia: ${item.accuracyRate}%`,
    `Acertos: ${item.attempt.correctAnswers}/${item.attempt.totalQuestions}`,
    `Tempo de resposta: ${item.attempt.responseTimeMinutes} min`,
    `Erros críticos: ${item.attempt.criticalErrors}`,
    `Dicas usadas: ${item.attempt.hintsUsed}`,
    `Status: ${getOutcomeLabel(item.attempt.outcome)}`,
    '',
    'Leitura pedagógica registrada',
    item.report,
  ].join('\n');
}

function InstructorOverview({
  user,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
}) {
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AttemptDetails | null>(null);

  if (!user.organizationId) return null;

  const {
    learnersWithMetrics,
    attempts,
    groupPerformance,
    modulePerformance,
    recentAttempts,
    trendPoints,
    distributionBands,
    overallApprovalRate,
    averageResponseTime,
    learnerSpotlights,
  } = getInstructorAnalytics(user.organizationId, { instructorId: user.id });

  const attemptedLearnerIds = new Set(attempts.map((attempt) => attempt.learnerId));
  const learnersWithAttempts = learnersWithMetrics.filter((item) => item.attempts.length > 0);
  const pendingLearners = learnersWithMetrics.filter((item) => item.attempts.length === 0);
  const learnersNeedingSupport = learnersWithAttempts.filter((item) => item.risk !== 'healthy');
  const groupsNeedingSupport = groupPerformance.filter((item) => item.risk !== 'healthy');
  const averageLearningGain = Math.round(
    groupPerformance.reduce((total, item) => total + item.learningGain, 0) /
      Math.max(groupPerformance.length, 1)
  );
  const selectedGroup = groupPerformance.find((item) => item.group.id === activeGroupId) ?? null;
  const selectedTrendPoints = selectedGroup?.trendPoints ?? trendPoints;
  const observedClassAverage = learnersWithAttempts.length
    ? Math.round(
        learnersWithAttempts.reduce((total, item) => total + item.averageScore, 0) /
          learnersWithAttempts.length
      )
    : null;
  const participationRate = learnersWithMetrics.length
    ? Math.round((attemptedLearnerIds.size / learnersWithMetrics.length) * 100)
    : 0;

  const summaryCards = [
    {
      label: 'Turmas ativas',
      value: `${groupPerformance.length}`,
      caption: `${groupsNeedingSupport.length} em atenção`,
      tooltip: 'Turmas ativas em que você é o instrutor responsável.',
      icon: UsersRound,
    },
    {
      label: 'Alunos',
      value: `${learnersWithMetrics.length}`,
      caption: `${pendingLearners.length} sem execução`,
      tooltip: 'Alunos com vínculo ativo nas suas turmas.',
      icon: GraduationCap,
    },
    {
      label: 'Participação',
      value: `${participationRate}%`,
      caption: `${attemptedLearnerIds.size}/${pluralize(learnersWithMetrics.length, 'aluno', 'alunos')}`,
      tooltip: 'Percentual de alunos que já possuem pelo menos uma tentativa registrada.',
      icon: Activity,
    },
    {
      label: 'Aprendizado',
      value: formatLearningGain(averageLearningGain),
      caption: 'Entre tentativas.',
      tooltip: 'Variação média entre a primeira e a última tentativa dos alunos com histórico suficiente.',
      icon: Sparkles,
    },
    {
      label: 'Média',
      value: formatScore(observedClassAverage),
      caption: 'Nota média.',
      tooltip: 'Média dos alunos com tentativas registradas. Alunos pendentes ficam fora deste cálculo.',
      icon: BarChart3,
    },
    {
      label: 'Aprovação',
      value: `${overallApprovalRate}%`,
      caption: 'Tentativas aprovadas.',
      tooltip: 'Percentual de tentativas concluídas com resultado aprovado.',
      icon: CheckCircle2,
    },
    {
      label: 'Tempo médio',
      value: `${averageResponseTime} min`,
      caption: 'Por execução.',
      tooltip: 'Tempo médio gasto pelos alunos em cada execução registrada.',
      icon: Clock3,
    },
    {
      label: 'Reforço',
      value: `${learnersNeedingSupport.length}`,
      caption: 'Alunos em atenção.',
      tooltip: 'Alunos com tentativas registradas fora da faixa saudável de desempenho.',
      icon: ShieldAlert,
    },
  ];

  const bestTrendPoint = [...selectedTrendPoints].sort((left, right) => right.averageScore - left.averageScore)[0];
  const mostActiveTrendPoint = [...selectedTrendPoints].sort((left, right) => right.attempts - left.attempts)[0];
  const rankedLearners = [...learnerSpotlights].sort((left, right) => right.averageScore - left.averageScore);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Análise de aprendizagem"
        title="Painel de aprendizagem"
        description="Visão consolidada das suas turmas, com participação, desempenho e sinais de reforço."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/app/students" className="secondary-btn">
              <Users className="h-4 w-4" />
              Ver alunos
            </Link>
            <Link to="/app/studies" className="ghost-btn">
              <BookOpenText className="h-4 w-4" />
              Ver estudos
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            caption={card.caption}
            tooltip={card.tooltip}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Execuções recentes</h2>
            <p className="mt-1 text-sm text-white/60">
              Últimas tentativas registradas com acesso rápido ao log de aprendizagem.
            </p>
          </div>

          <span className="chip chip-muted">{pluralize(recentAttempts.length, 'registro', 'registros')}</span>
        </div>

        <div className="overflow-hidden">
          <table className="data-table attempt-log-table">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[14%]" />
              <col className="w-[21%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Treinamento</th>
                <th>Nota</th>
                <th>Status</th>
                <th>Concluído em</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.slice(0, 5).map((item) => (
                <tr key={item.attempt.id}>
                  <td>
                    <span className="font-semibold text-white">{item.learnerName}</span>
                  </td>
                  <td>
                    <span className="block font-medium text-white/80">{item.groupName}</span>
                    <span className="mt-1 block text-xs text-white/45">{item.groupCode}</span>
                  </td>
                  <td>
                    <span className="block font-medium text-white/80">{item.trainingTitle}</span>
                    <span className="mt-1 block text-xs text-white/45">{item.moduleName}</span>
                  </td>
                  <td>{item.attempt.score}%</td>
                  <td>
                    <span className={getOutcomePillClass(item.attempt.outcome)}>
                      {getOutcomeLabel(item.attempt.outcome)}
                    </span>
                  </td>
                  <td>{formatDateTime(item.attempt.completedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="table-action-button"
                      onClick={() => setSelectedLog(item)}
                    >
                      <FileText className="h-4 w-4" />
                      Ver log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <article className="admin-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker">Série temporal</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Evolução por turma</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                Selecione uma turma para acompanhar tendência, participação e evolução de desempenho.
              </p>
            </div>

            <span className="chip chip-muted">
              {pluralize(selectedTrendPoints.length, 'ponto de observação', 'pontos de observação')}
            </span>
          </div>

          <div className="mt-6 analytics-tabs" aria-label="Filtro de turma da série temporal">
            <button
              type="button"
              className={['analytics-tab', activeGroupId === 'all' ? 'analytics-tab-active' : ''].join(' ')}
              onClick={() => setActiveGroupId('all')}
            >
              Todas
            </button>

            {groupPerformance.map((item) => (
              <button
                key={item.group.id}
                type="button"
                className={[
                  'analytics-tab',
                  activeGroupId === item.group.id ? 'analytics-tab-active' : '',
                ].join(' ')}
                onClick={() => setActiveGroupId(item.group.id)}
              >
                {item.group.name}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <AnalyticsLineChart
              points={selectedTrendPoints.map((point) => ({
                label: point.label,
                value: point.averageScore,
                note: pluralize(point.attempts, 'tentativa', 'tentativas'),
              }))}
              valueSuffix="%"
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="metric-block">
              <div className="metric-icon">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Melhor janela</h3>
              <p className="mt-2 text-sm text-white/60">
                {bestTrendPoint ? `${bestTrendPoint.label} com média de ${bestTrendPoint.averageScore}%` : 'Sem dados suficientes.'}
              </p>
            </div>

            <div className="metric-block">
              <div className="metric-icon">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Maior volume</h3>
              <p className="mt-2 text-sm text-white/60">
                {mostActiveTrendPoint
                  ? `${mostActiveTrendPoint.label} concentrou ${pluralize(mostActiveTrendPoint.attempts, 'tentativa', 'tentativas')}`
                  : 'Sem volume suficiente para destacar.'}
              </p>
            </div>

            <div className="metric-block">
              <div className="metric-icon">
                <Clock3 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Recorte atual</h3>
              <p className="mt-2 text-sm text-white/60">
                {selectedGroup
                  ? `${pluralize(selectedGroup.learners.length, 'aluno', 'alunos')}, ${selectedGroup.participationRate}% de participação.`
                  : `Todas as turmas, ${participationRate}% de participação.`}
              </p>
            </div>
          </div>
        </article>

        <article className="admin-card">
          <p className="section-kicker">Distribuição</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Faixas de desempenho</h2>
          <p className="mt-2 text-sm text-white/60">
            Concentração das tentativas por faixa de nota.
          </p>

          <div className="mt-8 space-y-4">
            {distributionBands.map((band) => (
              <div key={band.label} className="analytics-distribution-row">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{band.label}</p>
                    <p className="mt-1 text-sm text-white/50">{band.hint}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {pluralize(band.count, 'tentativa', 'tentativas')}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                      {band.percentage}%
                    </p>
                  </div>
                </div>

                <div className="analytics-distribution-track">
                  <div
                    className={[
                      'analytics-distribution-fill',
                      band.risk === 'critical'
                        ? 'analytics-distribution-fill-critical'
                        : band.risk === 'attention'
                          ? 'analytics-distribution-fill-attention'
                          : 'analytics-distribution-fill-healthy',
                    ].join(' ')}
                    style={{ width: `${Math.max(band.percentage, band.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="analytics-highlight-card">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Reforço</p>
              <p className="mt-3 text-3xl font-semibold text-white">{learnersNeedingSupport.length}</p>
              <p className="mt-2 text-sm text-white/55">
                {learnersNeedingSupport.length === 1 ? 'aluno' : 'alunos'} com desempenho fora da faixa saudável.
              </p>
            </div>

            <div className="analytics-highlight-card">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Pendentes</p>
              <p className="mt-3 text-3xl font-semibold text-white">{pendingLearners.length}</p>
              <p className="mt-2 text-sm text-white/55">
                {pendingLearners.length === 1 ? 'aluno' : 'alunos'} ainda sem tentativa registrada.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Turmas</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Aprendizado por turma</h2>
            <p className="mt-2 text-sm text-white/60">
              Comparativo de participação, evolução e necessidade de reforço por turma ativa.
            </p>
          </div>

          <span className="chip chip-muted">
            {pluralize(groupPerformance.length, 'turma ativa', 'turmas ativas')}
          </span>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {groupPerformance.map((item) => (
            <article key={item.group.id} className="analytics-row">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="section-kicker">{item.group.code}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{item.group.name}</h3>
                  <p className="mt-2 text-sm text-white/55">{item.group.description}</p>
                </div>

                <span className={getRiskPillClass(item.risk)}>{getRiskLabel(item.risk)}</span>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <div className="analytics-mini-metric">
                  <span className="analytics-mini-label">Participação</span>
                  <strong className="analytics-mini-value">{item.participationRate}%</strong>
                </div>
                <div className="analytics-mini-metric">
                  <span className="analytics-mini-label">Média</span>
                  <strong className="analytics-mini-value">
                    {formatScore(item.hasAttempts ? item.averageScore : null)}
                  </strong>
                </div>
                <div className="analytics-mini-metric">
                  <span className="analytics-mini-label">Aprendizado</span>
                  <strong className="analytics-mini-value">{formatLearningGain(item.learningGain)}</strong>
                </div>
                <div className="analytics-mini-metric">
                  <span className="analytics-mini-label">Reforço</span>
                  <strong className="analytics-mini-value">{item.learnersNeedingSupport}</strong>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                <span>{pluralize(item.learners.length, 'aluno', 'alunos')}</span>
                <span>{pluralize(item.pendingLearners, 'pendente', 'pendentes')}</span>
                <span>{pluralize(item.attempts.length, 'execução', 'execuções')}</span>
                <span>{item.averageResponseTime} min em média</span>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill"
                  style={{ width: `${Math.max(item.participationRate, item.attempts.length ? 10 : 0)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="admin-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker">Módulos</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Comparativo por módulo</h2>
              <p className="mt-2 text-sm text-white/60">
                Volume, média, aprovação e alcance em cada módulo liberado.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {modulePerformance.map((item) => (
              <div key={item.module.id} className="analytics-row">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{item.module.name}</p>
                    <p className="mt-1 text-sm text-white/55">{item.module.summary}</p>
                  </div>

                  <div className="analytics-row-meta">
                    <span>{pluralize(item.attempts.length, 'tentativa', 'tentativas')}</span>
                    <span>{pluralize(item.learnersReached, 'aluno', 'alunos')}</span>
                    <span>{item.averageResponseTime} min</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Média</span>
                    <strong className="analytics-mini-value">
                      {formatScore(item.attempts.length ? item.averageScore : null)}
                    </strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Aprovação</span>
                    <strong className="analytics-mini-value">
                      {formatScore(item.attempts.length ? item.approvalRate : null)}
                    </strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Alcance</span>
                    <strong className="analytics-mini-value">{item.learnersReached}</strong>
                  </div>
                </div>

                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${Math.max(item.averageScore, item.attempts.length ? 10 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Alunos</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Mapa da turma</h2>
              <p className="mt-2 text-sm text-white/60">
                Ranking por média, tentativas e risco.
              </p>
            </div>

            <Link to="/app/students" className="secondary-btn">
              Ver tabela
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            {rankedLearners.map((item) => (
              <Link
                key={item.learnerId}
                to={`/app/students/${item.learnerId}`}
                className="analytics-student-row xl:flex-col xl:items-stretch xl:justify-start"
                title={item.learnerName}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="analytics-student-avatar">
                    {item.learnerName
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="break-words text-sm font-semibold text-white">{item.learnerName}</p>
                      {item.attempts > 0 ? (
                        <span className={getRiskPillClass(item.risk)}>{getRiskLabel(item.risk)}</span>
                      ) : (
                        <span className="status-pill status-pill-muted">Pendente</span>
                      )}
                    </div>

                    <div className="mt-2 analytics-student-progress">
                      <div
                        className="analytics-student-progress-fill"
                        style={{ width: `${item.attempts ? Math.max(item.averageScore, 8) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="analytics-student-stats xl:justify-start">
                  <span>{item.attempts ? `${item.averageScore}% de média` : 'Sem média'}</span>
                  <span>{pluralize(item.attempts, 'tentativa', 'tentativas')}</span>
                  {item.attempts ? <span>{item.responseTime} min</span> : null}
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/12 bg-[#111020] shadow-[0_28px_100px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="section-kicker">Log da execução</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{selectedLog.learnerName}</h2>
                <p className="mt-1 text-sm text-white/55">
                  Relatório textual registrado a partir dos eventos do treinamento.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Fechar log"
                onClick={() => setSelectedLog(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <pre className="max-h-[56vh] overflow-auto whitespace-pre-wrap rounded-[22px] border border-white/10 bg-black/24 p-5 text-sm leading-7 text-white/78">
                {buildAttemptReport(selectedLog)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrgAdminOverview({
  user,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
}) {
  if (!user.organizationId) return null;

  const {
    learners,
    attempts,
    learnersWithMetrics,
    groupPerformance,
    modulePerformance,
    recentAttempts,
    classAverage,
    overallApprovalRate,
    averageResponseTime,
  } = getInstructorAnalytics(user.organizationId);
  const instructors = usersSeed.filter(
    (record) => record.organizationId === user.organizationId && record.role === 'instructor'
  );
  const organizationModules = modulesSeed.filter((module) =>
    module.organizationIds.includes(user.organizationId ?? '')
  );
  const archivedGroups = studentGroupsSeed.filter(
    (group) => group.organizationId === user.organizationId && group.status === 'archived'
  );
  const attemptedLearnerIds = new Set(attempts.map((attempt) => attempt.learnerId));
  const pendingLearners = learnersWithMetrics.filter((item) => item.attempts.length === 0);
  const learnersNeedingSupport = learnersWithMetrics.filter(
    (item) => item.attempts.length > 0 && item.risk !== 'healthy'
  );
  const groupsNeedingSupport = groupPerformance.filter((item) => item.risk !== 'healthy');
  const participationRate = learners.length
    ? Math.round((attemptedLearnerIds.size / learners.length) * 100)
    : 0;
  const averageLearningGain = getRoundedAverage(groupPerformance.map((item) => item.learningGain));
  const modulesWithoutAttempts = modulePerformance.filter((item) => item.attempts.length === 0);
  const unassignedGroups = groupPerformance.filter((item) => !item.group.instructorId);

  const burndownPoints = (() => {
    if (!learners.length || !attempts.length) return [];

    const latestTimestamp = Math.max(...attempts.map((attempt) => new Date(attempt.completedAt).getTime()));
    const latestDate = new Date(latestTimestamp);
    latestDate.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const currentDate = new Date(latestDate);
      currentDate.setDate(latestDate.getDate() - (6 - index));

      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + 1);

      const completedLearners = new Set(
        attempts
          .filter((attempt) => new Date(attempt.completedAt).getTime() < end.getTime())
          .map((attempt) => attempt.learnerId)
      ).size;
      const pendingCount = Math.max(learners.length - completedLearners, 0);

      return {
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(currentDate),
        value: Math.round((pendingCount / learners.length) * 100),
        note: `${pendingCount} pendentes`,
      };
    });
  })();

  const instructorRows = [
    ...instructors.map((instructor) => {
      const assignedGroups = groupPerformance.filter((item) => item.group.instructorId === instructor.id);
      const learnerIds = new Set(assignedGroups.flatMap((item) => item.learners.map((learner) => learner.id)));
      const rowAttempts = assignedGroups.flatMap((item) => item.attempts);
      const rowAttemptedLearners = new Set(rowAttempts.map((attempt) => attempt.learnerId)).size;
      const rowParticipation = learnerIds.size
        ? Math.round((rowAttemptedLearners / learnerIds.size) * 100)
        : 0;
      const rowSupport = assignedGroups.reduce((total, item) => total + item.learnersNeedingSupport, 0);
      const risk: RiskLevel | null = !assignedGroups.length
        ? null
        : assignedGroups.length > 2 || rowSupport > 2 || rowParticipation < 50
          ? 'critical'
          : rowSupport > 0 || rowParticipation < 80
            ? 'attention'
            : 'healthy';

      return {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        groups: assignedGroups,
        learnerCount: learnerIds.size,
        attempts: rowAttempts,
        participationRate: rowParticipation,
        averageScore: getRoundedAverage(rowAttempts.map((attempt) => attempt.score)),
        supportCount: rowSupport,
        risk,
      };
    }),
    ...(unassignedGroups.length
      ? [
          {
            id: 'unassigned',
            name: 'Sem instrutor definido',
            email: 'Turmas aguardando responsável',
            groups: unassignedGroups,
            learnerCount: new Set(unassignedGroups.flatMap((item) => item.learners.map((learner) => learner.id))).size,
            attempts: unassignedGroups.flatMap((item) => item.attempts),
            participationRate: getRoundedAverage(unassignedGroups.map((item) => item.participationRate)),
            averageScore: getRoundedAverage(unassignedGroups.map((item) => item.averageScore)),
            supportCount: unassignedGroups.reduce((total, item) => total + item.learnersNeedingSupport, 0),
            risk: 'attention' as RiskLevel | null,
          },
        ]
      : []),
  ];

  const overloadedInstructors = instructorRows.filter((item) => item.groups.length > 1);
  const alerts = [
    pendingLearners.length
      ? {
          title: 'Alunos sem execução',
          description:
            pendingLearners.length === 1
              ? '1 aluno ainda não iniciou nenhum treinamento.'
              : `${pendingLearners.length} alunos ainda não iniciaram nenhum treinamento.`,
          to: '/app/students',
        }
      : null,
    learnersNeedingSupport.length
      ? {
          title: 'Reforço necessário',
          description:
            learnersNeedingSupport.length === 1
              ? '1 aluno está fora da faixa saudável de desempenho.'
              : `${learnersNeedingSupport.length} alunos estão fora da faixa saudável de desempenho.`,
          to: '/app/students',
        }
      : null,
    groupsNeedingSupport.length
      ? {
          title: 'Turmas em atenção',
          description:
            groupsNeedingSupport.length === 1
              ? '1 turma precisa de acompanhamento mais próximo.'
              : `${groupsNeedingSupport.length} turmas precisam de acompanhamento mais próximo.`,
          to: '/app/groups',
        }
      : null,
    modulesWithoutAttempts.length
      ? {
          title: 'Módulos sem uso',
          description:
            modulesWithoutAttempts.length === 1
              ? '1 módulo liberado ainda não possui execuções.'
              : `${modulesWithoutAttempts.length} módulos liberados ainda não possuem execuções.`,
          to: '/app/studies',
        }
      : null,
  ].filter((item): item is { title: string; description: string; to: string } => item !== null);

  const summaryCards = [
    {
      label: 'Instrutores',
      value: `${instructors.length}`,
      caption: `${overloadedInstructors.length} com múltiplas turmas`,
      tooltip: 'Instrutores cadastrados na organização e aptos a acompanhar turmas.',
      icon: UserCheck,
    },
    {
      label: 'Turmas ativas',
      value: `${groupPerformance.length}`,
      caption: pluralize(archivedGroups.length, 'arquivada', 'arquivadas'),
      tooltip: 'Turmas ativas da organização, além do histórico arquivado.',
      icon: UsersRound,
    },
    {
      label: 'Alunos',
      value: `${learners.length}`,
      caption: `${pendingLearners.length} sem execução`,
      tooltip: 'Alunos da organização, incluindo participantes sem tentativa registrada.',
      icon: GraduationCap,
    },
    {
      label: 'Participação',
      value: `${participationRate}%`,
      caption: `${attemptedLearnerIds.size}/${pluralize(learners.length, 'aluno', 'alunos')}`,
      tooltip: 'Percentual de alunos que já executaram pelo menos um treinamento.',
      icon: Activity,
    },
    {
      label: 'Média geral',
      value: formatScore(classAverage),
      caption: 'Nota consolidada.',
      tooltip:
        'Média dos alunos que já possuem tentativas registradas. Alunos sem execução ficam fora deste cálculo.',
      icon: BarChart3,
    },
    {
      label: 'Aprovação',
      value: `${overallApprovalRate}%`,
      caption: 'Tentativas aprovadas.',
      tooltip: 'Percentual de tentativas aprovadas entre os treinamentos executados.',
      icon: CheckCircle2,
    },
    {
      label: 'Aprendizado',
      value: formatLearningGain(averageLearningGain),
      caption: 'Evolução média.',
      tooltip: 'Evolução média entre primeira e última tentativa nas turmas com histórico suficiente.',
      icon: Sparkles,
    },
    {
      label: 'Módulos',
      value: `${organizationModules.length}`,
      caption: `${modulesWithoutAttempts.length} sem uso`,
      tooltip: 'Módulos liberados para a organização e sua utilização operacional.',
      icon: BookOpenText,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel da organização"
        description="Visão executiva da operação de treinamentos, com carga por instrutor, pendências e sinais de risco."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/app/users" className="secondary-btn">
              <Users className="h-4 w-4" />
              Gerenciar usuários
            </Link>
            <Link to="/app/groups" className="ghost-btn">
              <Building2 className="h-4 w-4" />
              Ver turmas
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            caption={card.caption}
            tooltip={card.tooltip}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="admin-card">
          <p className="section-kicker">Evolução das pendências</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Pendências de execução</h2>
          <p className="mt-2 text-sm text-white/60">
            Percentual de alunos que ainda não possuem tentativa registrada ao longo da janela observada.
          </p>

          <div className="mt-8">
            <AnalyticsLineChart
              points={burndownPoints}
              valueSuffix="%"
              emptyLabel="Sem execuções suficientes para calcular a evolução das pendências."
            />
          </div>
        </article>

        <article className="admin-card">
          <p className="section-kicker">Alertas</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Atenções gerenciais</h2>
          <p className="mt-2 text-sm text-white/60">
            Pontos que ajudam a priorizar ações com instrutores e turmas.
          </p>

          <div className="mt-6 space-y-3">
            {alerts.length ? (
              alerts.map((alert) => (
                <Link key={alert.title} to={alert.to} className="quick-link-card">
                  <div>
                    <p className="text-sm font-semibold text-white">{alert.title}</p>
                    <p className="mt-1 text-sm text-white/60">{alert.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/50" />
                </Link>
              ))
            ) : (
              <div className="info-banner">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm text-cyan-100">
                  Nenhum alerta crítico identificado com os dados atuais.
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Carga por instrutor</h2>
            <p className="mt-1 text-sm text-white/60">
              Quantidade de turmas, alunos e sinais de reforço por responsável.
            </p>
          </div>
          <span className="chip chip-muted">
            {pluralize(instructorRows.length, 'responsável', 'responsáveis')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table data-table-centered">
            <thead>
              <tr>
                <th>Instrutor</th>
                <th>Turmas</th>
                <th>Alunos</th>
                <th>Participação</th>
                <th>Média</th>
                <th>Reforço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {instructorRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="mt-1 text-xs text-white/50">{row.email}</div>
                  </td>
                  <td>{row.groups.length}</td>
                  <td>{row.learnerCount}</td>
                  <td>{row.participationRate}%</td>
                  <td>{row.attempts.length ? `${row.averageScore}%` : '—'}</td>
                  <td>{row.supportCount}</td>
                  <td>
                    {row.risk ? (
                      <span className={getRiskPillClass(row.risk)}>{getRiskLabel(row.risk)}</span>
                    ) : (
                      <span className="status-pill status-pill-muted">Sem turmas</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="admin-card">
          <p className="section-kicker">Turmas</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Aprendizado por turma</h2>
          <p className="mt-2 text-sm text-white/60">
            Comparativo de participação, média e alunos em reforço.
          </p>

          <div className="mt-8 space-y-4">
            {groupPerformance.map((item) => (
              <article key={item.group.id} className="analytics-row">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="section-kicker">{item.group.code}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{item.group.name}</h3>
                  </div>
                  <span className={getRiskPillClass(item.risk)}>{getRiskLabel(item.risk)}</span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Alunos</span>
                    <strong className="analytics-mini-value">{item.learners.length}</strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Participação</span>
                    <strong className="analytics-mini-value">{item.participationRate}%</strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Média</span>
                    <strong className="analytics-mini-value">
                      {formatScore(item.hasAttempts ? item.averageScore : null)}
                    </strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Reforço</span>
                    <strong className="analytics-mini-value">{item.learnersNeedingSupport}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <p className="section-kicker">Treinamentos</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Uso por módulo</h2>
          <p className="mt-2 text-sm text-white/60">
            Alcance e desempenho nos módulos liberados para a organização.
          </p>

          <div className="mt-8 space-y-4">
            {modulePerformance.map((item) => (
              <article key={item.module.id} className="analytics-row">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.module.name}</h3>
                  </div>
                  <span className="chip chip-muted">
                    {pluralize(item.attempts.length, 'execução', 'execuções')}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Alcance</span>
                    <strong className="analytics-mini-value">{item.learnersReached}</strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Média</span>
                    <strong className="analytics-mini-value">
                      {formatScore(item.attempts.length ? item.averageScore : null)}
                    </strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Aprovação</span>
                    <strong className="analytics-mini-value">
                      {formatScore(item.attempts.length ? item.approvalRate : null)}
                    </strong>
                  </div>
                </div>

                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${Math.max(item.approvalRate, item.attempts.length ? 10 : 0)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Execuções recentes</h2>
            <p className="mt-1 text-sm text-white/60">
              Últimas tentativas registradas para auditoria rápida da operação.
            </p>
          </div>
          <span className="chip chip-muted">{averageResponseTime} min em média</span>
        </div>

        <div className="overflow-hidden">
          <table className="data-table attempt-log-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Treinamento</th>
                <th>Nota</th>
                <th>Status</th>
                <th>Concluído em</th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.slice(0, 5).map((item) => (
                <tr key={item.attempt.id}>
                  <td>{item.learnerName}</td>
                  <td>{item.groupName}</td>
                  <td>{item.trainingTitle}</td>
                  <td>{item.attempt.score}%</td>
                  <td>
                    <span className={getOutcomePillClass(item.attempt.outcome)}>
                      {getOutcomeLabel(item.attempt.outcome)}
                    </span>
                  </td>
                  <td>{formatDateTime(item.attempt.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getOrganizationStatusLabel(status: string) {
  if (status === 'active') return 'Ativa';
  if (status === 'onboarding') return 'Em implantação';
  return 'Desativada';
}

function getOrganizationStatusPillClass(status: string) {
  if (status === 'active') return 'status-pill status-pill-success';
  if (status === 'onboarding') return 'status-pill status-pill-muted';
  return 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100';
}

function SuperAdminOverview() {
  const activeOrganizations = organizationsSeed.filter((organization) => organization.status === 'active');
  const onboardingOrganizations = organizationsSeed.filter(
    (organization) => organization.status === 'onboarding'
  );
  const inactiveOrganizations = organizationsSeed.filter((organization) => organization.status === 'inactive');
  const orgAdmins = usersSeed.filter((record) => record.role === 'org_admin');
  const instructors = usersSeed.filter((record) => record.role === 'instructor');
  const learners = usersSeed.filter((record) => record.role === 'learner');
  const moduleReleaseCount = modulesSeed.reduce(
    (total, module) => total + module.organizationIds.length,
    0
  );
  const organizationsWithModules = organizationsSeed.filter((organization) =>
    modulesSeed.some((module) => module.organizationIds.includes(organization.id))
  );
  const catalog = getCatalogSummary();

  const summaryCards = [
    {
      label: 'Organizações',
      value: `${organizationsSeed.length}`,
      caption: pluralize(activeOrganizations.length, 'ativa', 'ativas'),
      tooltip: 'Organizações clientes cadastradas na plataforma.',
      icon: Building2,
    },
    {
      label: 'Em implantação',
      value: `${onboardingOrganizations.length}`,
      caption: pluralize(inactiveOrganizations.length, 'desativada', 'desativadas'),
      tooltip: 'Organizações em implantação ou com acesso pausado.',
      icon: ShieldCheck,
    },
    {
      label: 'Admins',
      value: `${orgAdmins.length}`,
      caption: 'Admins de organização.',
      tooltip: 'Usuários responsáveis por gerir organizações clientes.',
      icon: UserCheck,
    },
    {
      label: 'Usuários',
      value: `${usersSeed.length}`,
      caption: pluralize(learners.length, 'aluno', 'alunos'),
      tooltip: 'Perfis cadastrados entre Immersia, organizações, instrutores e alunos.',
      icon: Users,
    },
    {
      label: 'Instrutores',
      value: `${instructors.length}`,
      caption: 'Acompanhamento operacional.',
      tooltip: 'Instrutores cadastrados nas organizações clientes.',
      icon: GraduationCap,
    },
    {
      label: 'Módulos',
      value: `${catalog.modules}`,
      caption: `${pluralize(catalog.activeModules, 'ativo', 'ativos')} · ${catalog.comingSoonModules} em breve`,
      tooltip: 'Módulos do catálogo: ativos (com treinamento disponível) e em breve (em desenvolvimento).',
      icon: BookOpenText,
    },
    {
      label: 'Cobertura',
      value: `${Math.round((organizationsWithModules.length / Math.max(organizationsSeed.length, 1)) * 100)}%`,
      caption: `${organizationsWithModules.length}/${pluralize(organizationsSeed.length, 'organização', 'organizações')}`,
      tooltip: 'Percentual de organizações com pelo menos um módulo liberado.',
      icon: Activity,
    },
    {
      label: 'Treinamentos VR',
      value: `${catalog.trainings}`,
      caption: `${pluralize(catalog.availableTrainings, 'disponível', 'disponíveis')} · ${catalog.comingSoonTrainings} em breve`,
      tooltip: 'Treinamentos VR do catálogo de estudos, os mesmos listados em Estudos.',
      icon: BookOpenText,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Immersia"
        description="Visão administrativa da operação: organizações clientes, admins, usuários e liberação de módulos."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/app/organizations" className="secondary-btn">
              <Building2 className="h-4 w-4" />
              Gerenciar organizações
            </Link>
            <Link to="/app/users" className="ghost-btn">
              <Users className="h-4 w-4" />
              Gerenciar usuários
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            caption={card.caption}
            tooltip={card.tooltip}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <article className="table-shell">
          <div className="table-shell-header gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Organizações clientes</h2>
              <p className="mt-1 text-sm text-white/60">
                Recorte de status, admins e módulos liberados por organização.
              </p>
            </div>
            <Link to="/app/organizations" className="secondary-btn sm:w-auto sm:px-5">
              <Building2 className="h-4 w-4" />
              Abrir organizações
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table data-table-centered">
              <thead>
                <tr>
                  <th>Organização</th>
                  <th>Admins</th>
                  <th>Instrutores</th>
                  <th>Alunos</th>
                  <th>Módulos</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {organizationsSeed.map((organization) => {
                  const modules = modulesSeed.filter((module) =>
                    module.organizationIds.includes(organization.id)
                  );
                  const admins = orgAdmins.filter(
                    (record) => record.organizationId === organization.id
                  );
                  const instructors = usersSeed.filter(
                    (record) => record.organizationId === organization.id && record.role === 'instructor'
                  );
                  const learners = usersSeed.filter(
                    (record) => record.organizationId === organization.id && record.role === 'learner'
                  );

                  return (
                    <tr key={organization.id}>
                      <td>
                        <div className="font-semibold text-white">{organization.name}</div>
                      </td>
                      <td>{admins.length}</td>
                      <td>{instructors.length}</td>
                      <td>{learners.length}</td>
                      <td>{modules.length}</td>
                      <td>
                        <span className={getOrganizationStatusPillClass(organization.status)}>
                          {getOrganizationStatusLabel(organization.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card">
          <div className="flex items-center gap-3">
            <div className="metric-icon">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Ações rápidas</h2>
          </div>

          <div className="mt-6 space-y-3">
            <Link to="/app/organizations" className="quick-link-card">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-cyan-200" />
                <p className="text-sm font-semibold text-white">Criar organização</p>
              </div>
            </Link>

            <Link to="/app/users" className="quick-link-card">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-cyan-200" />
                <p className="text-sm font-semibold text-white">Cadastrar admins</p>
              </div>
            </Link>

            <Link to="/app/studies" className="quick-link-card">
              <div className="flex items-center gap-3">
                <BookOpenText className="h-5 w-5 text-cyan-200" />
                <p className="text-sm font-semibold text-white">Revisar catálogo</p>
              </div>
            </Link>
          </div>
        </article>
      </section>

      <section className="admin-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Liberação por módulo</h2>
            <p className="mt-2 text-sm text-white/60">
              Visão rápida de quantas organizações possuem acesso a cada módulo do catálogo.
            </p>
          </div>
          <span className="chip chip-muted">
            {pluralize(moduleReleaseCount, 'liberação ativa', 'liberações ativas')}
          </span>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {modulesSeed.map((module) => (
            <article key={module.id} className="analytics-row">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                {isModuleComingSoon(module.id) ? (
                  <span className="status-pill status-pill-muted">Em breve</span>
                ) : (
                  <span className="status-pill status-pill-success">Ativo</span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/55">{module.summary}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="analytics-mini-metric">
                  <span className="analytics-mini-label">Organizações</span>
                  <strong className="analytics-mini-value">{module.organizationIds.length}</strong>
                </div>
                <div className="analytics-mini-metric">
                  <span className="analytics-mini-label">Treinamentos</span>
                  <strong className="analytics-mini-value">{getModuleTrainingCount(module.id)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'super_admin') {
    return <SuperAdminOverview />;
  }

  if (user.role === 'org_admin') {
    return <OrgAdminOverview user={user} />;
  }

  if (user.role === 'instructor') {
    return <InstructorOverview user={user} />;
  }

  const organizationUsers = usersSeed.filter((record) => record.organizationId === user.organizationId);
  const visibleModules = modulesSeed.filter(
    (module) => !!user.organizationId && module.organizationIds.includes(user.organizationId)
  );

  const summaryCards: SummaryCard[] = [
    {
      label: 'Usuários da organização',
      value: `${organizationUsers.length}`,
      hint: 'Equipe sob sua operação dentro da plataforma.',
      icon: Users,
    },
    {
      label: 'Módulos liberados',
      value: `${visibleModules.length}`,
      hint: 'Conjunto disponível para a organização atual.',
      icon: BookOpenText,
    },
    {
      label: 'Perfis operacionais',
      value: `${organizationUsers.filter((record) => record.role !== 'org_admin').length}`,
      hint: 'Instrutores e alunos prontos para distribuição e acompanhamento.',
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Resumo"
        title="Visão geral da plataforma"
        description="Painel inicial com o recorte operacional do perfil autenticado, atualizado a partir dos dados disponíveis."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            caption={card.hint}
            tooltip={card.hint}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <article className="admin-card">
          <p className="section-kicker">Próximos passos</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Fluxo base do MVP</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="metric-block">
              <div className="metric-icon">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Organizações</h3>
              <p className="mt-2 text-sm text-white/60">
                Estruturar cadastro, onboarding e liberação de módulos por organização.
              </p>
            </div>

            <div className="metric-block">
              <div className="metric-icon">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Usuários</h3>
              <p className="mt-2 text-sm text-white/60">
                Definir perfis, alcance por role e rotina de manutenção no dia a dia.
              </p>
            </div>

            <div className="metric-block">
              <div className="metric-icon">
                <BookOpenText className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Treinamentos</h3>
              <p className="mt-2 text-sm text-white/60">
                Organizar estudos por módulo e preparar a integração com o backend real.
              </p>
            </div>
          </div>
        </article>

        <article className="admin-card">
          <p className="section-kicker">Atalhos</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Acessos rápidos</h2>
          <div className="mt-6 space-y-3">
            <Link to="/app/users" className="quick-link-card">
              <div>
                <p className="text-sm font-semibold text-white">Abrir usuários</p>
                <p className="mt-1 text-sm text-white/60">Revisar perfis e permissões por role.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/50" />
            </Link>

            <Link to="/app/studies" className="quick-link-card">
              <div>
                <p className="text-sm font-semibold text-white">Ver estudos</p>
                <p className="mt-1 text-sm text-white/60">Explorar trilhas e materiais do perfil atual.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/50" />
            </Link>
          </div>

          <div className="info-banner mt-6">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-sm text-cyan-100">
              Esta visão ainda usa dados locais para validar a arquitetura da experiência.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
