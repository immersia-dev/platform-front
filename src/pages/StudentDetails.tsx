import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import AnalyticsBarChart from '../components/AnalyticsBarChart';
import AnalyticsLineChart from '../components/AnalyticsLineChart';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import {
  roleLabels,
  studentGroupMembershipsSeed,
  studentGroupsSeed,
  usersSeed,
  type UserStatus,
} from '../data/mockPlatform';
import {
  type AttemptDetails,
  formatDateTime,
  getLearnerDetails,
  getRiskLabel,
} from '../lib/instructorAnalytics';

const PAGE_SIZE = 5;

function getMembershipLabel(status: string) {
  if (status === 'active') return 'Ativa';
  if (status === 'completed') return 'Concluída';
  return 'Transferida';
}

function getMembershipPillClass(status: string) {
  if (status === 'active') return 'status-pill status-pill-success';
  if (status === 'completed') return 'status-pill status-pill-muted';
  return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
}

function getUserStatusLabel(status: UserStatus) {
  if (status === 'active') return 'Ativo';
  if (status === 'invited') return 'Convidado';
  return 'Desativado';
}

function getUserStatusPillClass(status: UserStatus) {
  if (status === 'active') return 'status-pill status-pill-success';
  if (status === 'invited') return 'status-pill status-pill-muted';
  return 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100';
}

function getRiskValueClass(risk: string) {
  if (risk === 'critical') return 'text-rose-200';
  if (risk === 'attention') return 'text-amber-200';
  return 'text-emerald-200';
}

function formatMembershipEnd(value: string | null) {
  return value ? formatDateTime(value) : 'Em andamento';
}

function buildAttemptReport(item: AttemptDetails) {
  const outcome = item.attempt.outcome === 'approved' ? 'Aprovado' : 'Reforço recomendado';

  return [
    `Relatório da tentativa`,
    ``,
    `Aluno: ${item.learnerName}`,
    `Turma da execução: ${item.groupName} (${item.groupCode})`,
    `Treinamento: ${item.trainingTitle}`,
    `Módulo: ${item.moduleName}`,
    `Tentativa: ${item.attempt.attemptNumber}`,
    `Concluído em: ${formatDateTime(item.attempt.completedAt)}`,
    ``,
    `Resultado`,
    `Nota: ${item.attempt.score}%`,
    `Acurácia: ${item.accuracyRate}%`,
    `Acertos: ${item.attempt.correctAnswers}/${item.attempt.totalQuestions}`,
    `Tempo de resposta: ${item.attempt.responseTimeMinutes} min`,
    `Erros críticos: ${item.attempt.criticalErrors}`,
    `Dicas usadas: ${item.attempt.hintsUsed}`,
    `Status: ${outcome}`,
    ``,
    `Leitura pedagógica registrada`,
    item.report,
  ].join('\n');
}

export default function StudentDetails() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AttemptDetails | null>(null);
  const isSuperAdmin = user?.role === 'super_admin';
  const backPath = isSuperAdmin ? '/app/studies' : '/app/students';
  const backLabel = isSuperAdmin ? 'Voltar para estudos' : 'Voltar para alunos';
  const learnerOrganizationId =
    isSuperAdmin
      ? (usersSeed.find((record) => record.id === studentId)?.organizationId ?? null)
      : (user?.organizationId ?? null);
  const organizationId = learnerOrganizationId;
  const details = organizationId && studentId ? getLearnerDetails(organizationId, studentId) : null;
  const totalPages = Math.max(1, Math.ceil((details?.attempts.length ?? 0) / PAGE_SIZE));

  if (!organizationId || !studentId) return null;

  if (!details) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Aluno não encontrado"
          description="O registro solicitado não está disponível para a organização ou ainda não possui dados suficientes."
          actions={
            <Link to={backPath} className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          }
        />
      </div>
    );
  }

  const { summary, attempts, modulePerformance, scoreTimeline } = details;
  const safePage = Math.min(page, totalPages);
  const paginatedAttempts = attempts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const firstScore = scoreTimeline[0]?.score ?? 0;
  const lastScore = scoreTimeline[scoreTimeline.length - 1]?.score ?? firstScore;
  const scoreDelta = lastScore - firstScore;
  const accuracyAverage = Math.round(
    attempts.reduce((sum, item) => sum + item.accuracyRate, 0) / Math.max(attempts.length, 1)
  );
  const learnerMemberships = studentGroupMembershipsSeed
    .filter((membership) => membership.learnerId === summary.learner.id)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
  const activeMembership = learnerMemberships.find((membership) => membership.status === 'active');
  const activeGroup = studentGroupsSeed.find((group) => group.id === activeMembership?.groupId);
  const groupHistory = learnerMemberships.map((membership) => ({
    membership,
    group: studentGroupsSeed.find((group) => group.id === membership.groupId),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dados do Aluno"
        actions={
          <Link to={backPath} className="secondary-btn">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        }
      />

      <section className="admin-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Informações do aluno</h2>
            <p className="mt-2 text-sm text-white/60">
              Informações cadastrais e histórico de turmas vinculadas ao aluno.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          <div className="readonly-field xl:col-span-2">
            <span className="readonly-field-label">Nome completo</span>
            <strong className="readonly-field-value" title={summary.learner.name}>
              {summary.learner.name}
            </strong>
          </div>

          <div className="readonly-field xl:col-span-2">
            <span className="readonly-field-label">E-mail</span>
            <strong className="readonly-field-value" title={summary.learner.email}>
              {summary.learner.email}
            </strong>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Perfil</span>
            <strong className="readonly-field-value">{roleLabels[summary.learner.role]}</strong>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Status</span>
            <div className="readonly-field-value">
              <span className={getUserStatusPillClass(summary.learner.status)}>
                {getUserStatusLabel(summary.learner.status)}
              </span>
            </div>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Último acesso</span>
            <strong className="readonly-field-value">
              {formatDateTime(summary.learner.lastAccessAt ?? null)}
            </strong>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Turma atual</span>
            <strong className="readonly-field-value">{activeGroup?.name ?? 'Sem turma ativa'}</strong>
          </div>

          <div className="readonly-field xl:col-span-2">
            <span className="readonly-field-label">Entrada na turma atual</span>
            <strong className="readonly-field-value">
              {formatDateTime(activeMembership?.startedAt ?? null)}
            </strong>
          </div>
        </div>

        <div className="student-groups-panel">
          <div className="student-groups-header">
            <div>
              <h3 className="text-base font-semibold text-white">Histórico de turmas</h3>
              <p className="mt-1 text-sm text-white/55">
                Lista compacta para acompanhar vínculos atuais e anteriores.
              </p>
            </div>
            <span className="chip chip-muted">{groupHistory.length} vínculos</span>
          </div>

          <div className="max-h-[300px] overflow-auto">
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Código</th>
                  <th>Status</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                </tr>
              </thead>
              <tbody>
                {groupHistory.map(({ membership, group }) => (
                  <tr key={membership.id}>
                    <td>
                      <span className="block max-w-[260px] truncate font-semibold text-white">
                        {group?.name ?? 'Turma'}
                      </span>
                    </td>
                    <td>{group?.code ?? 'Sem código'}</td>
                    <td>
                      <span className={getMembershipPillClass(membership.status)}>
                        {getMembershipLabel(membership.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(membership.startedAt)}</td>
                    <td>{formatMembershipEnd(membership.endedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Média geral"
          value={`${summary.averageScore}%`}
          caption="Score médio."
          tooltip="Média das notas obtidas pelo aluno em todas as tentativas registradas."
          icon={BarChart3}
        />

        <StatCard
          label="Risco atual"
          value={<span className={getRiskValueClass(summary.risk)}>{getRiskLabel(summary.risk)}</span>}
          caption="Prioridade."
          tooltip="Classificação calculada a partir da média geral para indicar necessidade de acompanhamento."
          icon={ShieldAlert}
        />

        <StatCard
          label="Aprovação"
          value={`${summary.approvalRate}%`}
          caption="Aprovadas."
          tooltip="Percentual de tentativas concluídas com resultado aprovado."
          icon={CheckCircle2}
        />

        <StatCard
          label="Melhor nota"
          value={`${summary.bestScore}%`}
          caption="Maior score."
          tooltip="Maior nota alcançada pelo aluno até o momento."
          icon={Trophy}
        />
      </section>

      <AnalyticsBarChart
        title="Carga operacional do aluno"
        points={[
          {
            label: 'Tempo médio',
            value: summary.averageResponseTime,
            note: 'Minutos por execução.',
            color: 'linear-gradient(90deg, #22d3ee 0%, #60a5fa 100%)',
          },
          {
            label: 'Erros críticos',
            value: summary.totalCriticalErrors,
            note: 'Eventos críticos acumulados.',
            color: 'linear-gradient(90deg, #fb7185 0%, #f43f5e 100%)',
          },
          {
            label: 'Dicas usadas',
            value: summary.totalHintsUsed,
            note: 'Apoios solicitados nas tentativas.',
            color: 'linear-gradient(90deg, #f59e0b 0%, #facc15 100%)',
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="admin-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker">Evolução</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Curva de aprendizagem</h2>
              <p className="mt-2 text-sm text-white/60">
                Série de notas por tentativa para acompanhar consistência, progresso e possíveis oscilações.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <AnalyticsLineChart
              points={scoreTimeline.map((item) => ({
                label: item.label,
                value: item.score,
                note: `${item.responseTimeMinutes} min`,
              }))}
              valueSuffix="%"
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="metric-block">
              <div className="metric-icon">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Variação de nota</h3>
              <p className="mt-2 text-sm text-white/60">
                {scoreDelta >= 0 ? '+' : ''}
                {scoreDelta}% entre a primeira e a última tentativa registrada.
              </p>
            </div>

            <div className="metric-block">
              <div className="metric-icon">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Precisão média</h3>
              <p className="mt-2 text-sm text-white/60">
                {accuracyAverage}% de acertos médios nas respostas apresentadas.
              </p>
            </div>

            <div className="metric-block">
              <div className="metric-icon">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Treinamentos aprovados</h3>
              <p className="mt-2 text-sm text-white/60">
                {summary.approvedTrainings} experiências concluídas com aproveitamento satisfatório.
              </p>
            </div>
          </div>
        </article>

        <article className="admin-card">
          <p className="section-kicker">Módulos</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Comparativo por módulo</h2>
          <p className="mt-2 text-sm text-white/60">
            Leitura rápida do desempenho do aluno em cada módulo já percorrido.
          </p>

          <div className="mt-8 space-y-4">
            {modulePerformance.map((module) => (
              <div key={module.moduleId} className="analytics-row">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{module.moduleName}</p>
                    <p className="mt-1 text-sm text-white/55">{module.attempts} tentativas registradas</p>
                  </div>

                  <span className="chip chip-muted">{module.averageResponseTime} min</span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Média</span>
                    <strong className="analytics-mini-value">{module.averageScore}%</strong>
                  </div>

                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Melhor nota</span>
                    <strong className="analytics-mini-value">{module.bestScore}%</strong>
                  </div>
                </div>

                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${Math.max(module.averageScore, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Tentativas e relatórios</h2>
            <p className="mt-1 text-sm text-white/60">
              Registro cronológico dos resultados e acesso ao relatório registrado de cada execução.
            </p>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="data-table attempt-log-table">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[6%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Treinamento</th>
                <th>Módulo</th>
                <th>Turma</th>
                <th>Tent.</th>
                <th>Nota</th>
                <th>Acur.</th>
                <th>Tempo</th>
                <th>Erros</th>
                <th>Data</th>
                <th>Status</th>
                <th>Relatório</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAttempts.map((item) => (
                <tr key={item.attempt.id}>
                  <td>{item.trainingTitle}</td>
                  <td>{item.moduleName}</td>
                  <td>
                    <span className="block font-medium text-white/80">{item.groupName}</span>
                    <span className="mt-1 block text-xs text-white/45">{item.groupCode}</span>
                  </td>
                  <td>{item.attempt.attemptNumber}</td>
                  <td>{item.attempt.score}%</td>
                  <td>{item.accuracyRate}%</td>
                  <td>{item.attempt.responseTimeMinutes} min</td>
                  <td>{item.attempt.criticalErrors}</td>
                  <td>{formatDateTime(item.attempt.completedAt)}</td>
                  <td>
                    <span
                      className={
                        item.attempt.outcome === 'approved'
                          ? 'status-pill status-pill-success'
                          : 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100'
                      }
                    >
                      {item.attempt.outcome === 'approved' ? 'Aprovado' : 'Reforço'}
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
                  <td colSpan={11}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Ainda não existem tentativas registradas para este aluno.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={safePage}
          totalPages={totalPages}
          totalItems={attempts.length}
          pageSize={PAGE_SIZE}
          onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
        />
      </section>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/12 bg-[#111020] shadow-[0_28px_100px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="section-kicker">Log da tentativa</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{selectedLog.trainingTitle}</h2>
                <p className="mt-1 text-sm text-white/55">
                  Relatório textual registrado para esta execução.
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
