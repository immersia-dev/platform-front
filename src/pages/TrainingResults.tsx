import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  Eye,
  Play,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import AnalyticsBarChart from '../components/AnalyticsBarChart';
import AnalyticsDonutChart from '../components/AnalyticsDonutChart';
import AnalyticsLineChart from '../components/AnalyticsLineChart';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import { immersiveTrainingsSeed } from '../data/mockPlatform';
import { fetchTrainingLaunch, getApiErrorMessage } from '../lib/apiClient';
import {
  type AttemptDetails,
  type TrainingLearnerResult,
  formatDateTime,
  getTrainingDetails,
} from '../lib/instructorAnalytics';
import { getTrainingStudyProgress } from '../lib/studyPlatform';

const STUDENTS_PAGE_SIZE = 6;
const ATTEMPTS_PAGE_SIZE = 6;

type ResultsTab = 'overview' | 'students' | 'attempts';

const tabs: Array<{ id: ResultsTab; label: string }> = [
  { id: 'overview', label: 'Resumo' },
  { id: 'students', label: 'Alunos' },
  { id: 'attempts', label: 'Tentativas' },
];

function getLearnerStatusLabel(status: TrainingLearnerResult['status']) {
  if (status === 'approved') return 'Aprovado';
  if (status === 'needs_attention') return 'Reforço';
  return 'Pendente';
}

function getLearnerStatusClass(status: TrainingLearnerResult['status']) {
  if (status === 'approved') return 'status-pill status-pill-success';
  if (status === 'needs_attention') {
    return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  return 'status-pill status-pill-muted';
}

function getOutcomeClass(outcome: AttemptDetails['attempt']['outcome']) {
  if (outcome === 'approved') return 'status-pill status-pill-success';
  return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
}

function getOutcomeLabel(outcome: AttemptDetails['attempt']['outcome']) {
  return outcome === 'approved' ? 'Aprovado' : 'Reforço';
}

function buildAttemptReport(item: AttemptDetails) {
  return [
    `Relatório do treinamento`,
    ``,
    `Aluno: ${item.learnerName}`,
    `Turma da execução: ${item.groupName} (${item.groupCode})`,
    `Treinamento: ${item.trainingTitle}`,
    `Módulo: ${item.moduleName}`,
    `Tentativa: ${item.attempt.attemptNumber}`,
    `Concluído em: ${formatDateTime(item.attempt.completedAt)}`,
    ``,
    `Indicadores`,
    `Nota: ${item.attempt.score}%`,
    `Acurácia: ${item.accuracyRate}%`,
    `Acertos: ${item.attempt.correctAnswers}/${item.attempt.totalQuestions}`,
    `Tempo de resposta: ${item.attempt.responseTimeMinutes} min`,
    `Erros críticos: ${item.attempt.criticalErrors}`,
    `Dicas usadas: ${item.attempt.hintsUsed}`,
    `Status: ${getOutcomeLabel(item.attempt.outcome)}`,
    ``,
    `Leitura pedagógica registrada`,
    item.report,
  ].join('\n');
}

function formatCompactDateTime(value: string) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${day} ${time}`;
}

export default function TrainingResults() {
  const { accessToken, user } = useAuth();
  const { moduleId, trainingId } = useParams();
  const [activeTab, setActiveTab] = useState<ResultsTab>('overview');
  const [studentsPage, setStudentsPage] = useState(1);
  const [attemptsPage, setAttemptsPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AttemptDetails | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const organizationScopeId = user?.role === 'super_admin' ? null : user?.organizationId;
  const details =
    user && moduleId && trainingId
      ? getTrainingDetails(organizationScopeId ?? null, moduleId, trainingId)
      : null;

  if (!user || !moduleId || !trainingId) return null;

  if (!details) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Resultados não encontrados"
          description="O treinamento solicitado não está disponível para a organização atual ou ainda não possui dados."
          actions={
            <Link to="/app/studies" className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Voltar para estudos
            </Link>
          }
        />
      </div>
    );
  }

  const studentsTotalPages = Math.max(1, Math.ceil(details.learners.length / STUDENTS_PAGE_SIZE));
  const attemptsTotalPages = Math.max(1, Math.ceil(details.attempts.length / ATTEMPTS_PAGE_SIZE));
  const safeStudentsPage = Math.min(studentsPage, studentsTotalPages);
  const safeAttemptsPage = Math.min(attemptsPage, attemptsTotalPages);
  const paginatedLearners = details.learners.slice(
    (safeStudentsPage - 1) * STUDENTS_PAGE_SIZE,
    safeStudentsPage * STUDENTS_PAGE_SIZE
  );
  const paginatedAttempts = details.attempts.slice(
    (safeAttemptsPage - 1) * ATTEMPTS_PAGE_SIZE,
    safeAttemptsPage * ATTEMPTS_PAGE_SIZE
  );
  const completionRate = details.totalLearners
    ? Math.round((details.attemptedLearners / details.totalLearners) * 100)
    : 0;
  const studyProgress = getTrainingStudyProgress(details.module.id, details.training.id);
  const immersiveTraining = immersiveTrainingsSeed.find(
    (record) => record.legacyTrainingId === details.training.id || record.id === details.training.id
  );

  async function handleLaunchTraining() {
    if (!accessToken || !immersiveTraining || isLaunching) return;

    setIsLaunching(true);
    setLaunchError('');

    try {
      const launch = await fetchTrainingLaunch(accessToken, immersiveTraining.id);
      if (!launch.enabled || !launch.launch_url) {
        setLaunchError(launch.unavailable_reason ?? 'Canal de execução indisponível.');
        return;
      }

      window.open(launch.launch_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setLaunchError(getApiErrorMessage(error, 'Não foi possível abrir o treinamento.'));
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={details.module.name}
        title={details.training.title}
        description="Acompanhe desempenho, participação e tentativas dos alunos neste treinamento."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/app/studies" className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Voltar para estudos
            </Link>

            <button
              type="button"
              className={[
                'training-result-launch-btn',
                details.training.enabled && immersiveTraining
                  ? 'training-result-launch-btn-active'
                  : 'training-result-launch-btn-disabled',
              ].join(' ')}
              disabled={!details.training.enabled || !immersiveTraining || isLaunching}
              onClick={() => void handleLaunchTraining()}
            >
              <Play className="h-4 w-4" />
              {isLaunching ? 'Abrindo...' : 'Realizar treinamento'}
            </button>
          </div>
        }
      />

      {launchError ? (
        <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {launchError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Participação"
          value={`${completionRate}%`}
          caption={`${details.attemptedLearners}/${details.totalLearners} alunos`}
          tooltip="Percentual de alunos da organização que possuem pelo menos uma tentativa neste treinamento."
          icon={Activity}
        />
        <StatCard
          label="Média"
          value={`${details.averageScore}%`}
          caption="Score médio."
          tooltip="Média das notas registradas em todas as tentativas deste treinamento."
          icon={BarChart3}
        />
        <StatCard
          label="Aprovação"
          value={`${details.approvalRate}%`}
          caption="Tentativas aprovadas."
          tooltip="Percentual de tentativas concluídas com resultado aprovado."
          icon={CheckCircle2}
        />
        <StatCard
          label="Progresso"
          value={`${studyProgress.averageProgress}%`}
          caption={`${studyProgress.completedLearners}/${studyProgress.totalLearners} alunos`}
          tooltip="Progresso médio nas trilhas de estudo que incluem este treinamento."
          icon={BookOpenCheck}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AnalyticsDonutChart
          title="Status dos alunos"
          centerLabel="participação"
          centerValue={`${completionRate}%`}
          segments={[
            { label: 'Aprovados', value: details.approvedLearners, color: '#34d399' },
            { label: 'Reforço', value: details.learnersNeedingAttention, color: '#f59e0b' },
            { label: 'Pendentes', value: details.pendingLearners, color: '#94a3b8' },
          ]}
        />

        <AnalyticsBarChart
          title="Sinais operacionais"
          points={[
            {
              label: 'Erros críticos',
              value: details.totalCriticalErrors,
              note: 'Eventos que indicam risco de decisão.',
              color: 'linear-gradient(90deg, #fb7185 0%, #f43f5e 100%)',
            },
            {
              label: 'Dicas usadas',
              value: details.totalHintsUsed,
              note: 'Apoios solicitados durante as execuções.',
              color: 'linear-gradient(90deg, #f59e0b 0%, #facc15 100%)',
            },
            {
              label: 'Alunos em reforço',
              value: details.learnersNeedingAttention,
              note: 'Última tentativa ainda exige acompanhamento.',
              color: 'linear-gradient(90deg, #22d3ee 0%, #8b5cf6 100%)',
            },
          ]}
        />
      </section>

      <section className="analytics-tabs" aria-label="Seções de resultados do treinamento">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={['analytics-tab', activeTab === tab.id ? 'analytics-tab-active' : ''].join(' ')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === 'overview' ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="__enableXr__ admin-card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="section-kicker">Série temporal</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Evolução por execução</h2>
                  <p className="mt-2 text-sm text-white/60">
                    Média diária das notas registradas para este treinamento.
                  </p>
                </div>
                <span className="chip chip-muted">{details.attempts.length} execuções</span>
              </div>

              <div className="mt-8">
                <AnalyticsLineChart
                  points={details.trendPoints.map((point) => ({
                    label: point.label,
                    value: point.averageScore,
                    note: `${point.attempts} execuções`,
                  }))}
                  valueSuffix="%"
                />
              </div>

            </article>

            <article className="__enableXr__ admin-card">
              <p className="section-kicker">Distribuição</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Faixas de score</h2>
              <p className="mt-2 text-sm text-white/60">
                Concentração das tentativas por faixa de desempenho.
              </p>

              <div className="mt-8 space-y-4">
                {details.distributionBands.map((band) => (
                  <div key={band.label} className="analytics-distribution-row">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{band.label}</p>
                        <p className="mt-1 text-sm text-white/50">{band.hint}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{band.count}</p>
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
            </article>
          </section>

          <section className="__enableXr__ admin-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Turmas</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Resultado por turma</h2>
                <p className="mt-2 text-sm text-white/60">
                  Leitura do desempenho deste treinamento em cada turma ativa.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {details.groupPerformance.map((item) => (
                <article key={item.group.id} className="analytics-row">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="section-kicker">{item.group.code}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{item.group.name}</h3>
                    </div>
                    {item.attempts.length > 0 ? (
                      <span className={getLearnerStatusClass(item.risk === 'healthy' ? 'approved' : 'needs_attention')}>
                        {item.risk === 'healthy' ? 'Saudável' : 'Reforço'}
                      </span>
                    ) : (
                      <span className="status-pill status-pill-muted">Pendente</span>
                    )}
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-4">
                    <div className="analytics-mini-metric">
                      <span className="analytics-mini-label">Participação</span>
                      <strong className="analytics-mini-value">
                        {item.learners.length
                          ? Math.round((item.attemptedLearners / item.learners.length) * 100)
                          : 0}
                        %
                      </strong>
                    </div>
                    <div className="analytics-mini-metric">
                      <span className="analytics-mini-label">Média</span>
                      <strong className="analytics-mini-value">{item.averageScore}%</strong>
                    </div>
                    <div className="analytics-mini-metric">
                      <span className="analytics-mini-label">Aprendizado</span>
                      <strong className="analytics-mini-value">
                        {item.learningGain > 0 ? '+' : ''}
                        {item.learningGain}%
                      </strong>
                    </div>
                    <div className="analytics-mini-metric">
                      <span className="analytics-mini-label">Erros</span>
                      <strong className="analytics-mini-value">{item.criticalErrors}</strong>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                    <span>{item.attempts.length} execuções</span>
                    <span>{item.pendingLearners} pendentes</span>
                    <span>{item.hintsUsed} dicas usadas</span>
                    <span>{item.averageResponseTime} min médio</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeTab === 'students' ? (
        <section className="__enableXr__ table-shell">
          <div className="table-shell-header gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Resultados por aluno</h2>
              <p className="mt-1 text-sm text-white/60">
                Visão consolidada do desempenho individual neste treinamento.
              </p>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="data-table attempt-log-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Status</th>
                  <th>Tent.</th>
                  <th>Média</th>
                  <th>Acur.</th>
                  <th>Melhor</th>
                  <th>Tempo</th>
                  <th>Última</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLearners.map((item) => (
                  <tr key={item.learner.id}>
                    <td>
                      <div className="font-medium text-white">{item.learner.name}</div>
                      <div className="mt-1 text-xs text-white/50">{item.learner.email}</div>
                    </td>
                    <td>
                      <span className={getLearnerStatusClass(item.status)}>
                        {getLearnerStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>{item.attempts.length}</td>
                    <td>{item.averageScore ? `${item.averageScore}%` : '-'}</td>
                    <td>{item.averageAccuracy ? `${item.averageAccuracy}%` : '-'}</td>
                    <td>{item.bestScore ? `${item.bestScore}%` : '-'}</td>
                    <td>{item.averageResponseTime ? `${item.averageResponseTime} min` : '-'}</td>
                    <td>{formatDateTime(item.latestAttempt?.completedAt ?? null)}</td>
                    <td>
                      <Link to={`/app/students/${item.learner.id}`} className="table-action-button">
                        <Eye className="h-4 w-4" />
                        Ver aluno
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={safeStudentsPage}
            totalPages={studentsTotalPages}
            totalItems={details.learners.length}
            pageSize={STUDENTS_PAGE_SIZE}
            itemLabel="alunos"
            onPageChange={(nextPage) =>
              setStudentsPage(Math.min(Math.max(nextPage, 1), studentsTotalPages))
            }
          />
        </section>
      ) : null}

      {activeTab === 'attempts' ? (
        <section className="__enableXr__ table-shell">
          <div className="table-shell-header gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Tentativas do treinamento</h2>
              <p className="mt-1 text-sm text-white/60">
                Registro por execução, com acesso ao relatório textual registrado.
              </p>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="data-table attempt-log-table">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma</th>
                  <th>Desempenho</th>
                  <th>Tempo</th>
                  <th>Eventos</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttempts.map((item) => (
                  <tr key={item.attempt.id}>
                    <td>
                      <span className="block font-semibold text-white">{item.learnerName}</span>
                    </td>
                    <td>
                      <span className="block font-medium text-white/80">{item.groupName}</span>
                      <span className="mt-1 block text-xs text-white/45">{item.groupCode}</span>
                    </td>
                    <td>
                      <span className="block font-semibold text-white">{item.attempt.score}%</span>
                      <span className="mt-1 block text-xs text-white/45">{item.accuracyRate}% acurácia</span>
                    </td>
                    <td>{item.attempt.responseTimeMinutes} min</td>
                    <td>
                      <span className="block">{item.attempt.criticalErrors} erros</span>
                      <span className="mt-1 block text-xs text-white/45">{item.attempt.hintsUsed} dicas</span>
                    </td>
                    <td className="whitespace-nowrap">{formatCompactDateTime(item.attempt.completedAt)}</td>
                    <td>
                      <span className={getOutcomeClass(item.attempt.outcome)}>
                        {getOutcomeLabel(item.attempt.outcome)}
                      </span>
                    </td>
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

                {!paginatedAttempts.length ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="py-6 text-center text-sm text-white/55">
                        Ainda não existem tentativas registradas para este treinamento.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={safeAttemptsPage}
            totalPages={attemptsTotalPages}
            totalItems={details.attempts.length}
            pageSize={ATTEMPTS_PAGE_SIZE}
            itemLabel="tentativas"
            onPageChange={(nextPage) =>
              setAttemptsPage(Math.min(Math.max(nextPage, 1), attemptsTotalPages))
            }
          />
        </section>
      ) : null}

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/12 bg-[#111020] shadow-[0_28px_100px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="section-kicker">Relatório</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{selectedLog.learnerName}</h2>
                <p className="mt-1 text-sm text-white/55">
                  Texto registrado para esta execução.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Fechar relatório"
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
