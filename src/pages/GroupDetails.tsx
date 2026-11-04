import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Eye,
  GraduationCap,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import AnalyticsDonutChart from '../components/AnalyticsDonutChart';
import ActionDialog from '../components/ActionDialog';
import AnalyticsLineChart from '../components/AnalyticsLineChart';
import AnalyticsStackedBarChart from '../components/AnalyticsStackedBarChart';
import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  studentGroupMembershipsSeed,
  studentGroupsSeed,
  trackAssignmentsSeed,
  trainingAttemptsSeed,
  usersSeed,
} from '../data/mockPlatform';
import {
  formatDateTime,
  getRiskLabel,
  getRiskPillClass,
  type RiskLevel,
} from '../lib/instructorAnalytics';
import {
  getAvailableTracksForOrganization,
  getGroupTrackProgress,
  getTrackCatalogItems,
} from '../lib/studyPlatform';
import { useLessonProgress } from '../study/useLessonProgress';
import {
  addGroupMembership,
  assignTrackToGroup,
  getApiErrorMessage,
  removeGroupMembership,
  removeTrackAssignment,
} from '../lib/apiClient';

const MEMBERS_PAGE_SIZE = 6;

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getGroupRisk(
  averageScore: number,
  participationRate: number,
  learnersInSupport: number,
  trackCompletionRate: number
): RiskLevel {
  if (averageScore < 70 || participationRate < 50 || trackCompletionRate < 50) return 'critical';
  if (
    averageScore < 80 ||
    participationRate < 80 ||
    trackCompletionRate < 80 ||
    learnersInSupport > 0
  ) {
    return 'attention';
  }
  return 'healthy';
}

function buildTrendPoints(groupId: string) {
  const attempts = trainingAttemptsSeed.filter((attempt) => attempt.groupId === groupId);

  if (!attempts.length) return [];

  const latestTimestamp = Math.max(...attempts.map((attempt) => new Date(attempt.completedAt).getTime()));
  const latestDate = new Date(latestTimestamp);
  latestDate.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(latestDate);
    currentDate.setDate(latestDate.getDate() - (6 - index));

    const start = new Date(currentDate);
    const end = new Date(currentDate);
    end.setDate(currentDate.getDate() + 1);

    const dayAttempts = attempts.filter((attempt) => {
      const completedAt = new Date(attempt.completedAt).getTime();
      return completedAt >= start.getTime() && completedAt < end.getTime();
    });

    return {
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(start),
      value: getAverage(dayAttempts.map((attempt) => attempt.score)),
      note: `${dayAttempts.length} execuções`,
    };
  });
}

export default function GroupDetails() {
  const { accessToken, user } = useAuth();
  const platformData = usePlatformData();
  const { groupId = '' } = useParams();
  const { progressRecords } = useLessonProgress();
  const [memberIds, setMemberIds] = useState(() =>
    studentGroupMembershipsSeed
      .filter((membership) => membership.groupId === groupId && membership.status === 'active')
      .map((membership) => membership.learnerId)
  );
  const [trackIds, setTrackIds] = useState(() =>
    trackAssignmentsSeed
      .filter((assignment) => assignment.groupId === groupId)
      .map((assignment) => assignment.trackId)
  );
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [addLearnerDialogOpen, setAddLearnerDialogOpen] = useState(false);
  const [addTrackDialogOpen, setAddTrackDialogOpen] = useState(false);
  const [learnerIdToRemove, setLearnerIdToRemove] = useState<string | null>(null);
  const [trackIdToRemove, setTrackIdToRemove] = useState<string | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState('');
  const [isAddingLearner, setIsAddingLearner] = useState(false);
  const [isRemovingLearner, setIsRemovingLearner] = useState(false);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [isRemovingTrack, setIsRemovingTrack] = useState(false);
  const [learnerActionError, setLearnerActionError] = useState('');
  const [trackActionError, setTrackActionError] = useState('');
  const organizationId = user?.organizationId ?? null;
  const currentUserRecord = usersSeed.find(
    (record) => record.email === user?.email && record.organizationId === organizationId
  );
  const group = studentGroupsSeed.find(
    (record) =>
      record.id === groupId &&
      record.organizationId === organizationId &&
      (user?.role !== 'instructor' || record.instructorId === currentUserRecord?.id)
  );

  useEffect(() => {
    setMemberIds(
      studentGroupMembershipsSeed
        .filter((membership) => membership.groupId === groupId && membership.status === 'active')
        .map((membership) => membership.learnerId)
    );
    setTrackIds(
      trackAssignmentsSeed
        .filter((assignment) => assignment.groupId === groupId)
        .map((assignment) => assignment.trackId)
    );
  }, [groupId, platformData.version]);

  if (!user || !organizationId || !group) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Turma não encontrada"
          description="A turma solicitada não está disponível para a organização atual."
          actions={
            <Link to="/app/groups" className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Voltar para turmas
            </Link>
          }
        />
      </div>
    );
  }

  const organizationLearners = usersSeed.filter(
    (record) => record.organizationId === organizationId && record.role === 'learner' && record.status === 'active'
  );
  const organizationTracks = getTrackCatalogItems(getAvailableTracksForOrganization(organizationId));
  const members = organizationLearners.filter((learner) => memberIds.includes(learner.id));
  const activeLearnerIds = new Set(
    studentGroupMembershipsSeed
      .filter((membership) => membership.status === 'active')
      .map((membership) => membership.learnerId)
  );
  const availableLearners = organizationLearners.filter(
    (learner) => !memberIds.includes(learner.id) && !activeLearnerIds.has(learner.id)
  );
  const assignedTracks = organizationTracks.filter((item) => trackIds.includes(item.track.id));
  const availableTracks = organizationTracks.filter((item) => !trackIds.includes(item.track.id));
  const groupAttempts = trainingAttemptsSeed.filter((attempt) => attempt.groupId === group.id);
  const attemptedMemberIds = new Set(groupAttempts.map((attempt) => attempt.learnerId));
  const participationRate = members.length
    ? Math.round((members.filter((learner) => attemptedMemberIds.has(learner.id)).length / members.length) * 100)
    : 0;
  const averageScore = getAverage(groupAttempts.map((attempt) => attempt.score));
  const learnersInSupport = members.filter((learner) => {
    const attempts = groupAttempts.filter((attempt) => attempt.learnerId === learner.id);
    if (!attempts.length) return false;
    return getAverage(attempts.map((attempt) => attempt.score)) < 80;
  }).length;
  const trackCompletionRate = assignedTracks.length
    ? getAverage(assignedTracks.map((item) => getGroupTrackProgress(group.id, item.track.id, progressRecords).percent))
    : 0;
  const trackProgressRows = assignedTracks.map((item) => ({
    item,
    progress: getGroupTrackProgress(group.id, item.track.id, progressRecords),
  }));
  const completedTrackLearners = trackProgressRows.reduce(
    (total, row) => total + row.progress.completedLearners,
    0
  );
  const inProgressTrackLearners = trackProgressRows.reduce(
    (total, row) => total + row.progress.inProgressLearners,
    0
  );
  const pendingTrackLearners = trackProgressRows.reduce(
    (total, row) => total + row.progress.pendingLearners,
    0
  );
  const risk = getGroupRisk(averageScore, participationRate, learnersInSupport, trackCompletionRate);

  const memberRows = members.map((learner) => {
    const membership = studentGroupMembershipsSeed.find(
      (record) => record.groupId === group.id && record.learnerId === learner.id
    );
    const attempts = groupAttempts.filter((attempt) => attempt.learnerId === learner.id);
    const average = getAverage(attempts.map((attempt) => attempt.score));

    return {
      learner,
      membership,
      attempts,
      average,
      criticalErrors: attempts.reduce((total, attempt) => total + attempt.criticalErrors, 0),
      lastAttempt: [...attempts].sort(
        (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
      )[0],
    };
  });

  const filteredMembers = memberRows.filter((row) => {
    const searchTerm = memberSearch.trim().toLowerCase();
    return (
      searchTerm.length === 0 ||
      `${row.learner.name} ${row.learner.email}`.toLowerCase().includes(searchTerm)
    );
  });
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PAGE_SIZE));
  const safeMembersPage = Math.min(membersPage, totalMemberPages);
  const paginatedMembers = filteredMembers.slice(
    (safeMembersPage - 1) * MEMBERS_PAGE_SIZE,
    safeMembersPage * MEMBERS_PAGE_SIZE
  );
  const learnerOptions = [
    { value: '', label: availableLearners.length ? 'Selecionar aluno' : 'Sem alunos disponíveis' },
    ...availableLearners.map((learner) => ({ value: learner.id, label: learner.name })),
  ];
  const trackOptions = [
    { value: '', label: availableTracks.length ? 'Selecionar trilha' : 'Sem trilhas disponiveis' },
    ...availableTracks.map((item) => ({ value: item.track.id, label: item.track.title })),
  ];
  const learnerToAdd = availableLearners.find((learner) => learner.id === selectedLearnerId) ?? null;
  const trackToAdd = availableTracks.find((item) => item.track.id === selectedTrackId) ?? null;
  const learnerToRemove = members.find((learner) => learner.id === learnerIdToRemove) ?? null;
  const trackToRemove = assignedTracks.find((item) => item.track.id === trackIdToRemove) ?? null;

  async function handleAddLearner() {
    if (!selectedLearnerId || !accessToken || !group || isAddingLearner) return;

    setIsAddingLearner(true);
    setLearnerActionError('');

    try {
      await addGroupMembership(accessToken, group.id, selectedLearnerId);
      await platformData.refresh();
      setSelectedLearnerId('');
      setAddLearnerDialogOpen(false);
      setMembersPage(1);
    } catch (error) {
      setLearnerActionError(getApiErrorMessage(error, 'Não foi possível adicionar o aluno.'));
    } finally {
      setIsAddingLearner(false);
    }
  }

  async function handleRemoveLearner() {
    if (!learnerIdToRemove || !accessToken || !group || isRemovingLearner) return;

    setIsRemovingLearner(true);
    setLearnerActionError('');

    try {
      await removeGroupMembership(accessToken, group.id, learnerIdToRemove);
      await platformData.refresh();
      setLearnerIdToRemove(null);
      setMembersPage(1);
    } catch (error) {
      setLearnerActionError(getApiErrorMessage(error, 'Não foi possível remover o aluno.'));
    } finally {
      setIsRemovingLearner(false);
    }
  }

  async function handleAddTrack() {
    if (!selectedTrackId || !accessToken || !group || isAddingTrack) return;

    setIsAddingTrack(true);
    setTrackActionError('');

    try {
      await assignTrackToGroup(accessToken, group.id, selectedTrackId);
      await platformData.refresh();
      setSelectedTrackId('');
      setAddTrackDialogOpen(false);
    } catch (error) {
      setTrackActionError(getApiErrorMessage(error, 'Não foi possível encaminhar a trilha.'));
    } finally {
      setIsAddingTrack(false);
    }
  }

  async function handleRemoveTrack() {
    if (!trackIdToRemove || !accessToken || !group || isRemovingTrack) return;

    setIsRemovingTrack(true);
    setTrackActionError('');

    try {
      await removeTrackAssignment(accessToken, group.id, trackIdToRemove);
      await platformData.refresh();
      setTrackIdToRemove(null);
    } catch (error) {
      setTrackActionError(getApiErrorMessage(error, 'Não foi possível remover a trilha.'));
    } finally {
      setIsRemovingTrack(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={group.code}
        title={group.name}
        actions={
          <Link to="/app/groups" className="secondary-btn">
            <ArrowLeft className="h-4 w-4" />
            Voltar para turmas
          </Link>
        }
      />

      <section className="admin-card">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="readonly-field lg:col-span-2">
            <span className="readonly-field-label">Descrição</span>
            <strong className="readonly-field-value" title={group.description}>
              {group.description}
            </strong>
          </div>
          <div className="readonly-field">
            <span className="readonly-field-label">Status</span>
            <strong className="readonly-field-value">
              {group.status === 'active' ? 'Ativa' : 'Arquivada'}
            </strong>
          </div>
          <div className="readonly-field">
            <span className="readonly-field-label">Risco da turma</span>
            <strong className="readonly-field-value">
              <span className={getRiskPillClass(risk)}>{getRiskLabel(risk)}</span>
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alunos"
          value={`${members.length}`}
          caption={`${members.filter((learner) => attemptedMemberIds.has(learner.id)).length} com execução`}
          tooltip="Quantidade de alunos atualmente vinculados à turma."
          icon={GraduationCap}
        />
        <StatCard
          label="Participação"
          value={`${participationRate}%`}
          caption="Alunos com execução."
          tooltip="Percentual de alunos da turma com pelo menos uma tentativa registrada."
          icon={Activity}
        />
        <StatCard
          label="Média"
          value={`${averageScore}%`}
          caption="Score médio."
          tooltip="Média das notas registradas nas execuções desta turma."
          icon={BarChart3}
        />
        <StatCard
          label="Progresso"
          value={`${trackCompletionRate}%`}
          caption={`${assignedTracks.length} trilhas`}
          tooltip="Conclusão média das trilhas encaminhadas para a turma."
          icon={BookOpenCheck}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AnalyticsDonutChart
          title="Conclusão das trilhas"
          centerLabel="média"
          centerValue={`${trackCompletionRate}%`}
          segments={[
            { label: 'Concluídos', value: completedTrackLearners, color: '#34d399' },
            { label: 'Em andamento', value: inProgressTrackLearners, color: '#f59e0b' },
            { label: 'Pendentes', value: pendingTrackLearners, color: '#94a3b8' },
          ]}
        />

        <AnalyticsStackedBarChart
          title="Status por trilha"
          rows={trackProgressRows.map((row) => ({
            label: row.item.track.title,
            note: row.item.module.name,
            segments: [
              { label: 'Concl.', value: row.progress.completedLearners, color: '#34d399' },
              { label: 'Andam.', value: row.progress.inProgressLearners, color: '#f59e0b' },
              { label: 'Pend.', value: row.progress.pendingLearners, color: '#94a3b8' },
            ],
          }))}
        />
      </section>

      <section className="admin-card">
        <p className="section-kicker">Evolução</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Curva da turma</h2>
        <p className="mt-2 text-sm text-white/60">
          Média diária das execuções registradas para acompanhar tendência de aprendizagem.
        </p>

        <div className="mt-8">
          <AnalyticsLineChart points={buildTrendPoints(group.id)} valueSuffix="%" />
        </div>
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Alunos da turma</h2>
            <p className="mt-1 text-sm text-white/60">
              Membros atuais, atividade recente e vínculos da turma.
            </p>
          </div>

          <div className="table-toolbar">
            {user.role === 'org_admin' ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setLearnerActionError('');
                  setAddLearnerDialogOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                Adicionar aluno
              </button>
            ) : null}

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={memberSearch}
                onChange={(event) => {
                  setMemberSearch(event.target.value);
                  setMembersPage(1);
                }}
                className="table-input pl-11"
                placeholder="Buscar aluno"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table data-table-centered">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Entrada</th>
                <th>Execuções</th>
                <th>Média</th>
                <th>Erros</th>
                <th>Última execução</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((row) => (
                <tr key={row.learner.id}>
                  <td>
                    <div className="font-semibold text-white">{row.learner.name}</div>
                    <div className="mt-1 text-xs text-white/50">{row.learner.email}</div>
                  </td>
                  <td>{formatDateTime(row.membership?.startedAt ?? null)}</td>
                  <td>{row.attempts.length}</td>
                  <td>{row.average ? `${row.average}%` : '-'}</td>
                  <td>{row.criticalErrors}</td>
                  <td>{formatDateTime(row.lastAttempt?.completedAt ?? null)}</td>
                  <td>
                    <div className="table-actions table-actions-centered">
                      <Link to={`/app/students/${row.learner.id}`} className="table-action-button">
                        <Eye className="h-4 w-4" />
                        Ver aluno
                      </Link>
                      {user.role === 'org_admin' ? (
                        <button
                          type="button"
                          className="table-action-button table-action-danger"
                          onClick={() => {
                            setLearnerActionError('');
                            setLearnerIdToRemove(row.learner.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {!paginatedMembers.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Nenhum aluno vinculado com os filtros atuais.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={safeMembersPage}
          totalPages={totalMemberPages}
          totalItems={filteredMembers.length}
          pageSize={MEMBERS_PAGE_SIZE}
          itemLabel="alunos"
          onPageChange={(nextPage) =>
            setMembersPage(Math.min(Math.max(nextPage, 1), totalMemberPages))
          }
        />
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Trilhas encaminhadas</h2>
            <p className="mt-1 text-sm text-white/60">
              Controle das trilhas de estudo encaminhadas para esta turma.
            </p>
          </div>

          <div className="table-toolbar">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setTrackActionError('');
                setAddTrackDialogOpen(true);
              }}
            >
              <BookOpenCheck className="h-4 w-4" />
              Encaminhar trilha
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table data-table-centered">
            <thead>
              <tr>
                <th>Trilha</th>
                <th>Módulo</th>
                <th>Aulas</th>
                <th>Progresso</th>
                <th>Encaminhada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {assignedTracks.map((item) => {
                const assignment = trackAssignmentsSeed.find(
                  (record) => record.groupId === group.id && record.trackId === item.track.id
                );
                const progress = getGroupTrackProgress(group.id, item.track.id, progressRecords);

                return (
                  <tr key={item.track.id}>
                    <td>
                      <div className="font-semibold text-white">{item.track.title}</div>
                      <div className="mt-1 text-xs text-white/50">{item.track.slug}</div>
                    </td>
                    <td>{item.module.name}</td>
                    <td>{item.lessons.length}</td>
                    <td>
                      <span className={getRiskPillClass(progress.percent >= 80 ? 'healthy' : progress.percent >= 50 ? 'attention' : 'critical')}>
                        {progress.percent}%
                      </span>
                    </td>
                    <td>{assignment ? formatDateTime(assignment.assignedAt) : 'Agora'}</td>
                    <td>
                      <div className="table-actions table-actions-centered">
                        <Link to={`/app/studies/${item.track.id}`} className="table-action-button">
                          <Eye className="h-4 w-4" />
                          Ver trilha
                        </Link>
                        <button
                          type="button"
                          className="table-action-button table-action-danger"
                          onClick={() => {
                            setTrackActionError('');
                            setTrackIdToRemove(item.track.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!assignedTracks.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Nenhuma trilha encaminhada para esta turma.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <ActionDialog
        open={addLearnerDialogOpen}
        title="Adicionar aluno"
        description="Selecione o aluno e confirme o vínculo com esta turma."
        confirmLabel={isAddingLearner ? 'Adicionando...' : 'Adicionar aluno'}
        disabled={!selectedLearnerId || isAddingLearner}
        onClose={() => {
          setAddLearnerDialogOpen(false);
          setSelectedLearnerId('');
          setLearnerActionError('');
        }}
        onConfirm={handleAddLearner}
      >
        <FilterSelect
          value={selectedLearnerId}
          options={learnerOptions}
          ariaLabel="Selecionar aluno para adicionar"
          onChange={setSelectedLearnerId}
        />

        {learnerToAdd ? (
          <div className="readonly-field">
            <span className="readonly-field-label">Aluno selecionado</span>
            <strong className="readonly-field-value">{learnerToAdd.name}</strong>
            <p className="mt-1 text-sm text-white/50">{learnerToAdd.email}</p>
          </div>
        ) : null}

        <div className="info-banner">
          <p className="text-sm text-cyan-100">
            Um aluno deve ter somente uma turma ativa por vez. Se ele mudar de turma, o vínculo
            anterior deve ser encerrado para preservar o histórico.
          </p>
        </div>

        {learnerActionError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {learnerActionError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={Boolean(learnerToRemove)}
        title="Remover aluno da turma"
        description="Confirme a remoção do vínculo ativo. O histórico de tentativas deve continuar preservado para consultas futuras."
        confirmLabel={isRemovingLearner ? 'Removendo...' : 'Remover aluno'}
        intent="danger"
        disabled={isRemovingLearner}
        onClose={() => {
          setLearnerIdToRemove(null);
          setLearnerActionError('');
        }}
        onConfirm={handleRemoveLearner}
      >
        {learnerToRemove ? (
          <div className="readonly-field">
            <span className="readonly-field-label">Aluno</span>
            <strong className="readonly-field-value">{learnerToRemove.name}</strong>
            <p className="mt-1 text-sm text-white/50">{learnerToRemove.email}</p>
          </div>
        ) : null}

        {learnerActionError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {learnerActionError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={addTrackDialogOpen}
        title="Encaminhar trilha"
        description="Selecione uma trilha de um módulo contratado pela organização e confirme o encaminhamento para esta turma."
        confirmLabel={isAddingTrack ? 'Encaminhando...' : 'Encaminhar trilha'}
        disabled={!selectedTrackId || isAddingTrack}
        onClose={() => {
          setAddTrackDialogOpen(false);
          setSelectedTrackId('');
          setTrackActionError('');
        }}
        onConfirm={handleAddTrack}
      >
        <FilterSelect
          value={selectedTrackId}
          options={trackOptions}
          ariaLabel="Selecionar trilha para encaminhar"
          onChange={setSelectedTrackId}
        />

        {trackToAdd ? (
          <div className="readonly-field">
            <span className="readonly-field-label">{trackToAdd.module.name}</span>
            <strong className="readonly-field-value">{trackToAdd.track.title}</strong>
            <p className="mt-1 text-sm text-white/50">{trackToAdd.track.summary}</p>
          </div>
        ) : null}

        {trackActionError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {trackActionError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={Boolean(trackToRemove)}
        title="Remover trilha da turma"
        description="Confirme a remoção do encaminhamento. Progresso e resultados já registrados continuam disponíveis no histórico."
        confirmLabel={isRemovingTrack ? 'Removendo...' : 'Remover trilha'}
        intent="danger"
        disabled={isRemovingTrack}
        onClose={() => {
          setTrackIdToRemove(null);
          setTrackActionError('');
        }}
        onConfirm={handleRemoveTrack}
      >
        {trackToRemove ? (
          <div className="readonly-field">
            <span className="readonly-field-label">{trackToRemove.module.name}</span>
            <strong className="readonly-field-value">{trackToRemove.track.title}</strong>
            <p className="mt-1 text-sm text-white/50">{trackToRemove.track.summary}</p>
          </div>
        ) : null}

        {trackActionError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {trackActionError}
          </div>
        ) : null}
      </ActionDialog>
    </div>
  );
}
