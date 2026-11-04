import { BookOpenText, Eye, GraduationCap, Plus, Search, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ActionDialog from '../components/ActionDialog';
import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  studentGroupMembershipsSeed,
  studentGroupsSeed,
  trainingAttemptsSeed,
  usersSeed,
  type StudentGroupRecord,
  type StudentGroupStatus,
} from '../data/mockPlatform';
import { getRiskLabel, getRiskPillClass, type RiskLevel } from '../lib/instructorAnalytics';
import {
  getAssignedTracksForGroup,
  getAvailableTracksForOrganization,
  getGroupAverageTrackProgress,
} from '../lib/studyPlatform';
import { createGroup, getApiErrorMessage, type GroupMutationPayload } from '../lib/apiClient';

const PAGE_SIZE = 6;

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getGroupRisk(
  averageScore: number,
  participationRate: number,
  learnersNeedingSupport: number,
  trackCompletionRate: number
): RiskLevel {
  if (averageScore < 70 || participationRate < 50 || trackCompletionRate < 50) return 'critical';
  if (
    averageScore < 80 ||
    participationRate < 80 ||
    trackCompletionRate < 80 ||
    learnersNeedingSupport > 0
  ) {
    return 'attention';
  }
  return 'healthy';
}

function getGroupStatusLabel(status: StudentGroupStatus) {
  return status === 'active' ? 'Ativa' : 'Arquivada';
}

function getGroupStatusPillClass(status: StudentGroupStatus) {
  return status === 'active' ? 'status-pill status-pill-success' : 'status-pill status-pill-muted';
}

export default function Groups() {
  const { accessToken, user } = useAuth();
  const platformData = usePlatformData();
  const [groups, setGroups] = useState<StudentGroupRecord[]>(() => studentGroupsSeed);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StudentGroupStatus>('all');
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const organizationId = user?.organizationId ?? null;

  useEffect(() => {
    setGroups([...studentGroupsSeed]);
  }, [platformData.version]);

  if (!organizationId) return null;

  const currentUserRecord = usersSeed.find(
    (record) => record.email === user?.email && record.organizationId === organizationId
  );
  const organizationLearners = usersSeed.filter(
    (record) => record.organizationId === organizationId && record.role === 'learner'
  );
  const organizationGroups = groups.filter((group) => {
    if (group.organizationId !== organizationId) return false;
    if (user?.role !== 'instructor') return true;
    return group.instructorId === currentUserRecord?.id;
  });
  const organizationTracks = getAvailableTracksForOrganization(organizationId);
  const activeMemberships = studentGroupMembershipsSeed.filter(
    (membership) => membership.status === 'active'
  );

  const rows = organizationGroups.map((group) => {
    const memberships = activeMemberships.filter((membership) => membership.groupId === group.id);
    const memberIds = new Set(memberships.map((membership) => membership.learnerId));
    const attempts = trainingAttemptsSeed.filter((attempt) => attempt.groupId === group.id);
    const attemptedLearners = new Set(attempts.map((attempt) => attempt.learnerId)).size;
    const participationRate = memberships.length
      ? Math.round((attemptedLearners / memberships.length) * 100)
      : 0;
    const averageScore = getAverage(attempts.map((attempt) => attempt.score));
    const assignedTracks = getAssignedTracksForGroup(group.id);
    const trackCompletionRate = getGroupAverageTrackProgress(group.id);
    const learnersNeedingSupport = [...memberIds].filter((learnerId) => {
      const learnerAttempts = attempts.filter((attempt) => attempt.learnerId === learnerId);
      if (!learnerAttempts.length) return false;
      return getAverage(learnerAttempts.map((attempt) => attempt.score)) < 80;
    }).length;
    const risk = getGroupRisk(
      averageScore,
      participationRate,
      learnersNeedingSupport,
      trackCompletionRate
    );

    return {
      group,
      memberships,
      attempts,
      participationRate,
      averageScore,
      assignedTracks,
      trackCompletionRate,
      learnersNeedingSupport,
      risk,
    };
  });

  const filteredRows = rows.filter((row) => {
    const searchTerm = search.trim().toLowerCase();
    const assignedTrackNames = row.assignedTracks
      .map((track) => track.title)
      .join(' ');
    const matchesSearch =
      searchTerm.length === 0 ||
      `${row.group.name} ${row.group.code} ${row.group.description} ${assignedTrackNames}`
        .toLowerCase()
        .includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || row.group.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusOptions = [
    { value: 'all', label: 'Todas as turmas' },
    { value: 'active', label: 'Turmas ativas' },
    { value: 'archived', label: 'Arquivadas' },
  ];
  const canCreateGroup = newGroupName.trim().length > 0 && newGroupCode.trim().length > 0;

  async function handleCreateGroup() {
    if (!canCreateGroup || !organizationId || !accessToken || isCreating) return;

    const payload: GroupMutationPayload = {
      organizationId,
      instructorId: null,
      name: newGroupName.trim(),
      code: newGroupCode.trim().toUpperCase(),
      description:
        newGroupDescription.trim() || 'Turma criada para acompanhamento dos alunos e encaminhamento de trilhas.',
      status: 'active',
    };

    setIsCreating(true);
    setCreateError('');

    try {
      await createGroup(accessToken, payload);
      await platformData.refresh();
      setGroups([...studentGroupsSeed]);
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupCode('');
      setNewGroupDescription('');
      setStatusFilter('all');
      setPage(1);
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Não foi possível criar a turma.'));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Turmas"
        actions={
          user?.role === 'org_admin' ? (
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            onClick={() => {
              setCreateError('');
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova turma
          </button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Turmas ativas"
          value={`${organizationGroups.filter((group) => group.status === 'active').length}`}
          caption="Grupos disponíveis para acompanhamento."
          tooltip="Turmas ativas que podem receber alunos, trilhas e acompanhamento de resultados."
          icon={UsersRound}
        />

        <StatCard
          label="Alunos"
          value={`${organizationLearners.length}`}
          caption="Alunos cadastrados na organização."
          tooltip="Total de alunos disponíveis para vínculo em turmas da organização."
          icon={GraduationCap}
        />

        <StatCard
          label="Trilhas disponíveis"
          value={`${organizationTracks.length}`}
          caption="Trilhas disponíveis para encaminhar."
          tooltip="Trilhas dos módulos liberados para a organização e disponíveis para as turmas."
          icon={BookOpenText}
        />
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Turmas cadastradas</h2>
            <p className="mt-1 text-sm text-white/60">
              Exibindo {filteredRows.length} de {organizationGroups.length} turmas da organização.
            </p>
          </div>

          <div className="table-toolbar">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="table-input pl-11"
                placeholder="Buscar turma"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              ariaLabel="Filtrar turmas por status"
              onChange={(value) => {
                setStatusFilter(value as 'all' | StudentGroupStatus);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table data-table-centered">
            <thead>
              <tr>
                <th>Turma</th>
                <th>Status</th>
                <th>Alunos</th>
                <th>Trilhas</th>
                <th>Participação</th>
                <th>Progresso</th>
                <th>Média</th>
                <th>Risco</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.group.id}>
                  <td>
                    <div className="font-semibold text-white">{row.group.name}</div>
                    <div className="mt-1 text-xs text-white/50">{row.group.code}</div>
                  </td>
                  <td>
                    <span className={getGroupStatusPillClass(row.group.status)}>
                      {getGroupStatusLabel(row.group.status)}
                    </span>
                  </td>
                  <td>
                    <div className="inline-flex items-center justify-center gap-2">
                      <UsersRound className="h-4 w-4 text-white/45" />
                      {row.memberships.length}
                    </div>
                  </td>
                  <td>
                    <div className="inline-flex items-center justify-center gap-2">
                      <BookOpenText className="h-4 w-4 text-white/45" />
                      {row.assignedTracks.length}
                    </div>
                  </td>
                  <td>{row.participationRate}%</td>
                  <td>{row.trackCompletionRate}%</td>
                  <td>{row.averageScore ? `${row.averageScore}%` : '-'}</td>
                  <td>
                    <span className={getRiskPillClass(row.risk)}>{getRiskLabel(row.risk)}</span>
                  </td>
                  <td>
                    <div className="table-actions table-actions-centered">
                      <Link to={`/app/groups/${row.group.id}`} className="table-action-button">
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!paginatedRows.length ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Nenhuma turma encontrada com os filtros atuais.
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
          totalItems={filteredRows.length}
          pageSize={PAGE_SIZE}
          itemLabel="turmas"
          onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
        />
      </section>

      <ActionDialog
        open={createDialogOpen}
        title="Criar nova turma"
        description="Preencha os dados básicos da turma. No backend, essa ação deve criar o grupo dentro da organização atual."
        confirmLabel={isCreating ? 'Criando...' : 'Criar turma'}
        disabled={!canCreateGroup || isCreating}
        onClose={() => {
          setCreateDialogOpen(false);
          setCreateError('');
        }}
        onConfirm={handleCreateGroup}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/70">Nome da turma</span>
          <input
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            className="admin-input"
            placeholder="Ex: Brigada B"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/70">Código</span>
          <input
            value={newGroupCode}
            onChange={(event) => setNewGroupCode(event.target.value)}
            className="admin-input"
            placeholder="Ex: BRG-B"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/70">Descrição</span>
          <textarea
            value={newGroupDescription}
            onChange={(event) => setNewGroupDescription(event.target.value)}
            className="admin-input min-h-28 resize-none"
            placeholder="Resumo do objetivo da turma"
          />
        </label>

        {createError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {createError}
          </div>
        ) : null}
      </ActionDialog>
    </div>
  );
}
