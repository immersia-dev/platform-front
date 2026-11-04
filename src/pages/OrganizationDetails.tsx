import {
  ArrowLeft,
  BookOpenCheck,
  Pencil,
  Plus,
  GraduationCap,
  Search,
  UserCog,
  UserX,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import ActionDialog from '../components/ActionDialog';
import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  modulesSeed,
  organizationsSeed,
  roleLabels,
  studentGroupMembershipsSeed,
  studentGroupModuleAccessSeed,
  studentGroupsSeed,
  trainingAttemptsSeed,
  usersSeed,
  type AppRole,
  type ContractStatus,
  type OrganizationRecord,
  type UserRecord,
  type UserSex,
  type UserStatus,
} from '../data/mockPlatform';
import { formatDateTime } from '../lib/instructorAnalytics';
import {
  createUser,
  deactivateUser,
  getApiErrorMessage,
  grantOrganizationModuleAccess,
  revokeOrganizationModuleAccess,
  updateOrganization,
  type OrganizationMutationPayload,
  type UserMutationPayload,
} from '../lib/apiClient';

const USERS_PAGE_SIZE = 6;
const DEFAULT_INITIAL_PASSWORD = '123456789';
const organizationRoles: AppRole[] = ['org_admin', 'instructor', 'learner'];

type OrganizationFormState = {
  name: string;
  documentNumber: string;
  status: ContractStatus;
};

type AdminFormState = {
  name: string;
  email: string;
  documentNumber: string;
  sex: UserSex;
  birthDate: string;
  status: UserStatus;
};

const initialAdminForm: AdminFormState = {
  name: '',
  email: '',
  documentNumber: '',
  sex: 'not_informed',
  birthDate: '',
  status: 'active',
};
const sexOptions: Array<{ value: UserSex; label: string }> = [
  { value: 'not_informed', label: 'Não informado' },
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Outro' },
];

function getContractStatusLabel(status: ContractStatus) {
  if (status === 'active') return 'Ativa';
  if (status === 'onboarding') return 'Onboarding';
  return 'Desativada';
}

function getContractStatusPillClass(status: ContractStatus) {
  if (status === 'active') return 'status-pill status-pill-success';
  if (status === 'onboarding') return 'status-pill status-pill-muted';
  return 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100';
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

function getGroupStatusLabel(status: string) {
  return status === 'active' ? 'Ativa' : 'Arquivada';
}

function getGroupStatusPillClass(status: string) {
  if (status === 'active') return 'status-pill status-pill-success';
  return 'status-pill status-pill-muted';
}

function getUserRelationship(record: UserRecord) {
  if (record.role === 'learner') {
    const activeMembership = studentGroupMembershipsSeed.find(
      (membership) => membership.learnerId === record.id && membership.status === 'active'
    );
    const group = studentGroupsSeed.find((item) => item.id === activeMembership?.groupId);

    return group ? group.name : 'Sem turma ativa';
  }

  if (record.role === 'instructor') {
    const groups = studentGroupsSeed.filter((group) => group.instructorId === record.id);
    return groups.length ? `${groups.length} turma${groups.length > 1 ? 's' : ''}` : 'Sem turmas';
  }

  return 'Gestão da organização';
}

export default function OrganizationDetails() {
  const { accessToken } = useAuth();
  const platformData = usePlatformData();
  const { organizationId = '' } = useParams();
  const organization = organizationsSeed.find((record) => record.id === organizationId);
  const [organizationSnapshot, setOrganizationSnapshot] = useState<OrganizationRecord | null>(
    () => organization ?? null
  );
  const [userRecords, setUserRecords] = useState(usersSeed);
  const [selectedModuleIds, setSelectedModuleIds] = useState(() =>
    modulesSeed
      .filter((module) => module.organizationIds.includes(organizationId))
      .map((module) => module.id)
  );
  const [draftModuleIds, setDraftModuleIds] = useState(() =>
    modulesSeed
      .filter((module) => module.organizationIds.includes(organizationId))
      .map((module) => module.id)
  );
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [page, setPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [deactivateAdminTargetId, setDeactivateAdminTargetId] = useState<string | null>(null);
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>(() => ({
    name: organization?.name ?? '',
    documentNumber: organization?.documentNumber ?? '',
    status: organization?.status ?? 'onboarding',
  }));
  const [adminForm, setAdminForm] = useState<AdminFormState>(initialAdminForm);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [isSavingModules, setIsSavingModules] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isDeactivatingAdmin, setIsDeactivatingAdmin] = useState(false);
  const [organizationError, setOrganizationError] = useState('');
  const [moduleError, setModuleError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [deactivateAdminError, setDeactivateAdminError] = useState('');

  useEffect(() => {
    const nextOrganization = organizationsSeed.find((record) => record.id === organizationId) ?? null;
    const nextModuleIds = modulesSeed
      .filter((module) => module.organizationIds.includes(organizationId))
      .map((module) => module.id);

    setOrganizationSnapshot(nextOrganization);
    setUserRecords([...usersSeed]);
    setSelectedModuleIds(nextModuleIds);
    setDraftModuleIds(nextModuleIds);

    if (nextOrganization) {
      setOrganizationForm({
        name: nextOrganization.name,
        documentNumber: nextOrganization.documentNumber,
        status: nextOrganization.status,
      });
    }
  }, [organizationId, platformData.version]);

  const currentOrganization = organizationSnapshot ?? organization;

  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organização não encontrada"
          description="A organização solicitada não está disponível na base atual."
          actions={
            <Link to="/app/organizations" className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Voltar para organizações
            </Link>
          }
        />
      </div>
    );
  }

  const resolvedOrganization = currentOrganization;

  const organizationUsers = userRecords.filter((record) => record.organizationId === resolvedOrganization.id);
  const organizationAdmins = organizationUsers.filter((record) => record.role === 'org_admin');
  const organizationInstructors = organizationUsers.filter((record) => record.role === 'instructor');
  const organizationLearners = organizationUsers.filter((record) => record.role === 'learner');
  const organizationGroups = studentGroupsSeed.filter((group) => group.organizationId === resolvedOrganization.id);
  const organizationModules = modulesSeed.filter((module) => selectedModuleIds.includes(module.id));
  const organizationAttempts = trainingAttemptsSeed.filter(
    (attempt) => attempt.organizationId === resolvedOrganization.id
  );
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = organizationUsers.filter((record) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${record.name} ${record.email} ${roleLabels[record.role]} ${getUserRelationship(record)}`
        .toLowerCase()
        .includes(normalizedSearch);
    const matchesRole = roleFilter === 'all' || record.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safePage - 1) * USERS_PAGE_SIZE,
    safePage * USERS_PAGE_SIZE
  );
  const roleOptions = [
    { value: 'all', label: 'Todos os perfis' },
    ...organizationRoles.map((role) => ({ value: role, label: roleLabels[role] })),
  ];
  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativos' },
    { value: 'invited', label: 'Convidados' },
    { value: 'inactive', label: 'Desativados' },
  ];
  const adminEmailAlreadyUsed = userRecords.some(
    (record) => record.email.toLowerCase() === adminForm.email.trim().toLowerCase()
  );
  const deactivateAdminTarget =
    userRecords.find(
      (record) =>
        record.id === deactivateAdminTargetId &&
        record.organizationId === resolvedOrganization.id &&
        record.role === 'org_admin'
    ) ?? null;
  const organizationFormIsValid =
    organizationForm.name.trim().length > 0 && organizationForm.documentNumber.trim().length > 0;
  const adminFormIsValid =
    adminForm.name.trim().length > 0 && adminForm.email.trim().length > 0 && !adminEmailAlreadyUsed;

  function openEditDialog() {
    setOrganizationError('');
    setOrganizationForm({
      name: resolvedOrganization.name,
      documentNumber: resolvedOrganization.documentNumber,
      status: resolvedOrganization.status,
    });
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setOrganizationError('');
    setOrganizationForm({
      name: resolvedOrganization.name,
      documentNumber: resolvedOrganization.documentNumber,
      status: resolvedOrganization.status,
    });
  }

  function openModuleDialog() {
    setModuleError('');
    setDraftModuleIds(selectedModuleIds);
    setModuleDialogOpen(true);
  }

  function closeModuleDialog() {
    setModuleDialogOpen(false);
    setModuleError('');
    setDraftModuleIds(selectedModuleIds);
  }

  function closeAdminDialog() {
    setAdminDialogOpen(false);
    setAdminError('');
    setAdminForm(initialAdminForm);
  }

  function toggleModule(moduleId: string) {
    setDraftModuleIds((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId]
    );
  }

  async function handleSaveOrganization() {
    if (!organizationFormIsValid || !accessToken || isSavingOrganization) return;

    const payload: OrganizationMutationPayload = {
      name: organizationForm.name.trim(),
      documentNumber: organizationForm.documentNumber.trim(),
      status: organizationForm.status,
    };

    setIsSavingOrganization(true);
    setOrganizationError('');

    try {
      await updateOrganization(accessToken, resolvedOrganization.id, payload);
      await platformData.refresh();
      setEditDialogOpen(false);
    } catch (error) {
      setOrganizationError(getApiErrorMessage(error, 'Não foi possível atualizar a organização.'));
    } finally {
      setIsSavingOrganization(false);
    }
  }

  async function handleSaveModules() {
    if (!accessToken || isSavingModules) return;

    const currentIds = new Set(selectedModuleIds);
    const nextIds = new Set(draftModuleIds);
    const modulesToGrant = draftModuleIds.filter((moduleId) => !currentIds.has(moduleId));
    const modulesToRevoke = selectedModuleIds.filter((moduleId) => !nextIds.has(moduleId));

    setIsSavingModules(true);
    setModuleError('');

    try {
      await Promise.all([
        ...modulesToGrant.map((moduleId) =>
          grantOrganizationModuleAccess(accessToken, resolvedOrganization.id, moduleId)
        ),
        ...modulesToRevoke.map((moduleId) =>
          revokeOrganizationModuleAccess(accessToken, resolvedOrganization.id, moduleId)
        ),
      ]);
      await platformData.refresh();
      setModuleDialogOpen(false);
    } catch (error) {
      setModuleError(getApiErrorMessage(error, 'Não foi possível salvar os módulos.'));
    } finally {
      setIsSavingModules(false);
    }
  }

  async function handleCreateAdmin() {
    if (!adminFormIsValid || !accessToken || isCreatingAdmin) return;

    const payload: UserMutationPayload = {
      name: adminForm.name.trim(),
      email: adminForm.email.trim().toLowerCase(),
      password: DEFAULT_INITIAL_PASSWORD,
      documentNumber: adminForm.documentNumber.trim(),
      sex: adminForm.sex,
      birthDate: adminForm.birthDate,
      role: 'org_admin',
      organizationId: resolvedOrganization.id,
      status: adminForm.status,
    };

    setIsCreatingAdmin(true);
    setAdminError('');

    try {
      await createUser(accessToken, payload);
      await platformData.refresh();
      closeAdminDialog();
    } catch (error) {
      setAdminError(getApiErrorMessage(error, 'Não foi possível criar o admin.'));
    } finally {
      setIsCreatingAdmin(false);
    }
  }

  async function handleDeactivateAdmin() {
    if (!deactivateAdminTarget || !accessToken || isDeactivatingAdmin) return;

    setIsDeactivatingAdmin(true);
    setDeactivateAdminError('');

    try {
      await deactivateUser(accessToken, deactivateAdminTarget.id);
      await platformData.refresh();
      setDeactivateAdminTargetId(null);
    } catch (error) {
      setDeactivateAdminError(getApiErrorMessage(error, 'Não foi possível desativar o admin.'));
    } finally {
      setIsDeactivatingAdmin(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={resolvedOrganization.name}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/app/organizations" className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Voltar para organizações
            </Link>

            <button type="button" className="secondary-btn" onClick={openEditDialog}>
              <Pencil className="h-4 w-4" />
              Editar dados
            </button>

            <button type="button" className="secondary-btn" onClick={openModuleDialog}>
              <BookOpenCheck className="h-4 w-4" />
              Liberar módulos
            </button>

            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              onClick={() => {
                setAdminError('');
                setAdminDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo admin
            </button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Admins"
          value={`${organizationAdmins.length}`}
          caption="Gestores da organização."
          tooltip="Admins vinculados à organização cliente."
          icon={UserCog}
        />
        <StatCard
          label="Instrutores"
          value={`${organizationInstructors.length}`}
          caption="Acompanhamento."
          tooltip="Instrutores que podem acompanhar turmas, alunos e resultados."
          icon={UsersRound}
        />
        <StatCard
          label="Alunos"
          value={`${organizationLearners.length}`}
          caption={`${organizationLearners.filter((learner) => learner.status === 'active').length} ativos`}
          tooltip="Alunos vinculados à organização."
          icon={GraduationCap}
        />
        <StatCard
          label="Módulos"
          value={`${organizationModules.length}`}
          caption="Liberados."
          tooltip="Módulos liberados para a organização."
          icon={BookOpenCheck}
        />
      </section>

      <section className="admin-card">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="readonly-field">
            <span className="readonly-field-label">Status</span>
            <div className="readonly-field-value">
              <span className={getContractStatusPillClass(resolvedOrganization.status)}>
                {getContractStatusLabel(resolvedOrganization.status)}
              </span>
            </div>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">CNPJ</span>
            <strong className="readonly-field-value">{resolvedOrganization.documentNumber}</strong>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Turmas</span>
            <strong className="readonly-field-value">{organizationGroups.length}</strong>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Tentativas</span>
            <strong className="readonly-field-value">{organizationAttempts.length}</strong>
          </div>

          <div className="readonly-field">
            <span className="readonly-field-label">Usuários</span>
            <strong className="readonly-field-value">{organizationUsers.length}</strong>
          </div>
        </div>
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Usuários da organização</h2>
            <p className="mt-1 text-sm text-white/60">
              Listagem de admins, instrutores e alunos vinculados a esta organização.
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
                placeholder="Buscar usuário"
              />
            </div>

            <FilterSelect
              value={roleFilter}
              options={roleOptions}
              ariaLabel="Filtrar usuários por perfil"
              onChange={(value) => {
                setRoleFilter(value as 'all' | AppRole);
                setPage(1);
              }}
            />

            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              ariaLabel="Filtrar usuários por status"
              onChange={(value) => {
                setStatusFilter(value as 'all' | UserStatus);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table data-table-centered">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Perfil</th>
                <th>Vínculo</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((record) => {
                const canDeactivateAdmin = record.role === 'org_admin' && record.status !== 'inactive';

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="font-semibold text-white">{record.name}</div>
                      <div className="mt-1 text-xs text-white/50">{record.email}</div>
                    </td>
                    <td>{roleLabels[record.role]}</td>
                    <td>{getUserRelationship(record)}</td>
                    <td>
                      <span className={getUserStatusPillClass(record.status)}>
                        {getUserStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(record.lastAccessAt ?? null)}</td>
                    <td>
                      {record.role === 'org_admin' ? (
                        <button
                          type="button"
                          className="table-action-button table-action-danger"
                          disabled={!canDeactivateAdmin}
                          onClick={() => {
                            setDeactivateAdminError('');
                            setDeactivateAdminTargetId(record.id);
                          }}
                        >
                          <UserX className="h-4 w-4" />
                          Desativar
                        </button>
                      ) : (
                        <span className="text-sm text-white/35">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!paginatedUsers.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Nenhum usuário encontrado com os filtros atuais.
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
          totalItems={filteredUsers.length}
          pageSize={USERS_PAGE_SIZE}
          itemLabel="usuários"
          onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="table-shell">
          <div className="table-shell-header">
            <div>
              <h2 className="text-lg font-semibold text-white">Módulos liberados</h2>
              <p className="mt-1 text-sm text-white/60">Catálogo contratado pela organização.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table data-table-centered">
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Treinamentos</th>
                  <th>Turmas</th>
                </tr>
              </thead>
              <tbody>
                {organizationModules.map((module) => {
                  const groupsUsingModule = studentGroupModuleAccessSeed.filter((access) => {
                    const group = studentGroupsSeed.find((item) => item.id === access.groupId);
                    return access.moduleId === module.id && group?.organizationId === resolvedOrganization.id;
                  });

                  return (
                    <tr key={module.id}>
                      <td>
                        <div className="font-semibold text-white">{module.name}</div>
                        <div className="mt-1 text-xs text-white/50">{module.slug}</div>
                      </td>
                      <td>{module.trainings.length}</td>
                      <td>{groupsUsingModule.length}</td>
                    </tr>
                  );
                })}

                {!organizationModules.length ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="py-6 text-center text-sm text-white/55">
                        Nenhum módulo liberado para esta organização.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="table-shell">
          <div className="table-shell-header">
            <div>
              <h2 className="text-lg font-semibold text-white">Turmas</h2>
              <p className="mt-1 text-sm text-white/60">Grupos operacionais vinculados à organização.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table data-table-centered">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Instrutor</th>
                  <th>Alunos</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {organizationGroups.map((group) => {
                  const instructor = userRecords.find((record) => record.id === group.instructorId);
                  const activeMembers = studentGroupMembershipsSeed.filter(
                    (membership) => membership.groupId === group.id && membership.status === 'active'
                  );

                  return (
                    <tr key={group.id}>
                      <td>
                        <div className="font-semibold text-white">{group.name}</div>
                        <div className="mt-1 text-xs text-white/50">{group.code}</div>
                      </td>
                      <td>{instructor?.name ?? 'Sem instrutor'}</td>
                      <td>{activeMembers.length}</td>
                      <td>
                        <span className={getGroupStatusPillClass(group.status)}>
                          {getGroupStatusLabel(group.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!organizationGroups.length ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="py-6 text-center text-sm text-white/55">
                        Nenhuma turma cadastrada para esta organização.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <ActionDialog
        open={editDialogOpen}
        title="Editar organização"
        description="Atualize os dados básicos e o status do contrato da organização."
        confirmLabel={isSavingOrganization ? 'Salvando...' : 'Salvar alterações'}
        disabled={!organizationFormIsValid || isSavingOrganization}
        onClose={closeEditDialog}
        onConfirm={handleSaveOrganization}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="organization-detail-name">
              Nome da organização
            </label>
            <input
              id="organization-detail-name"
              className="admin-input"
              value={organizationForm.name}
              onChange={(event) =>
                setOrganizationForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Organização Demo"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="organization-detail-document">
              CNPJ
            </label>
            <input
              id="organization-detail-document"
              className="admin-input"
              value={organizationForm.documentNumber}
              onChange={(event) =>
                setOrganizationForm((current) => ({ ...current, documentNumber: event.target.value }))
              }
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="field-label">Status</label>
            <FilterSelect
              value={organizationForm.status}
              options={[
                { value: 'active', label: 'Ativa' },
                { value: 'onboarding', label: 'Onboarding' },
                { value: 'inactive', label: 'Desativada' },
              ]}
              ariaLabel="Selecionar status da organização"
              onChange={(value) =>
                setOrganizationForm((current) => ({ ...current, status: value as ContractStatus }))
              }
            />
          </div>
        </div>

        {organizationError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {organizationError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={moduleDialogOpen}
        title="Liberar módulos"
        description="Selecione quais módulos ficam disponíveis para a organização."
        confirmLabel={isSavingModules ? 'Salvando...' : 'Salvar módulos'}
        disabled={isSavingModules}
        onClose={closeModuleDialog}
        onConfirm={handleSaveModules}
      >
        <div className="space-y-3">
          {modulesSeed.map((module) => {
            const checked = draftModuleIds.includes(module.id);

            return (
              <button
                key={module.id}
                type="button"
                className={[
                  'module-access-option',
                  checked ? 'module-access-option-active' : '',
                ].join(' ')}
                disabled={isSavingModules}
                onClick={() => toggleModule(module.id)}
              >
                <span className="text-left">
                  <span className="block text-sm font-semibold text-white">{module.name}</span>
                </span>
                <span className={checked ? 'status-pill status-pill-success' : 'status-pill status-pill-muted'}>
                  {checked ? 'Liberado' : 'Bloqueado'}
                </span>
              </button>
            );
          })}
        </div>

        {moduleError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {moduleError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={adminDialogOpen}
        title="Novo admin da organização"
        description="Cadastre um admin vinculado a esta organização."
        confirmLabel={isCreatingAdmin ? 'Criando...' : 'Criar admin'}
        disabled={!adminFormIsValid || isCreatingAdmin}
        onClose={closeAdminDialog}
        onConfirm={handleCreateAdmin}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="organization-admin-name">
              Nome completo
            </label>
            <input
              id="organization-admin-name"
              className="admin-input"
              value={adminForm.name}
              onChange={(event) =>
                setAdminForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Usuário 05"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="organization-admin-email">
              E-mail
            </label>
            <input
              id="organization-admin-email"
              className="admin-input"
              value={adminForm.email}
              onChange={(event) =>
                setAdminForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="admin@organizacao.com"
            />
            {adminEmailAlreadyUsed ? (
              <p className="mt-2 text-sm text-rose-200">Este e-mail já está cadastrado.</p>
            ) : null}
          </div>

          <div>
            <label className="field-label" htmlFor="organization-admin-document">
              Documento
            </label>
            <input
              id="organization-admin-document"
              className="admin-input"
              value={adminForm.documentNumber}
              onChange={(event) =>
                setAdminForm((current) => ({ ...current, documentNumber: event.target.value }))
              }
              placeholder="CPF ou documento interno"
            />
          </div>

          <div>
            <label className="field-label">Sexo</label>
            <FilterSelect
              value={adminForm.sex}
              options={sexOptions}
              ariaLabel="Selecionar sexo"
              onChange={(value) =>
                setAdminForm((current) => ({ ...current, sex: value as UserSex }))
              }
            />
          </div>

          <div>
            <label className="field-label" htmlFor="organization-admin-birth-date">
              Data de nascimento
            </label>
            <input
              id="organization-admin-birth-date"
              className="admin-input"
              type="date"
              value={adminForm.birthDate}
              onChange={(event) =>
                setAdminForm((current) => ({ ...current, birthDate: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="field-label">Status</label>
            <FilterSelect
              value={adminForm.status}
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'invited', label: 'Convidado' },
                { value: 'inactive', label: 'Desativado' },
              ]}
              ariaLabel="Selecionar status do admin"
              onChange={(value) =>
                setAdminForm((current) => ({ ...current, status: value as UserStatus }))
              }
            />
          </div>
        </div>

        {adminError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {adminError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={Boolean(deactivateAdminTarget)}
        title="Desativar admin da organização"
        description="O acesso deste admin será bloqueado, mas o registro continuará disponível para auditoria e histórico."
        confirmLabel={isDeactivatingAdmin ? 'Desativando...' : 'Desativar admin'}
        intent="danger"
        disabled={isDeactivatingAdmin}
        onClose={() => {
          setDeactivateAdminTargetId(null);
          setDeactivateAdminError('');
        }}
        onConfirm={handleDeactivateAdmin}
      >
        {deactivateAdminTarget ? (
          <div className="readonly-field">
            <span className="readonly-field-label">Admin da organização</span>
            <strong className="readonly-field-value">{deactivateAdminTarget.name}</strong>
            <p className="mt-1 text-sm text-white/50">{deactivateAdminTarget.email}</p>
          </div>
        ) : null}

        {deactivateAdminError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {deactivateAdminError}
          </div>
        ) : null}
      </ActionDialog>
    </div>
  );
}
