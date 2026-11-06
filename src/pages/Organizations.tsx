import {
  BookOpenCheck,
  Building2,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ActionDialog from '../components/ActionDialog';
import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import { pluralize } from '../lib/pluralize';
import { getCatalogSummary } from '../lib/studyPlatform';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  modulesSeed,
  organizationsSeed,
  usersSeed,
  type ContractStatus,
  type OrganizationRecord,
} from '../data/mockPlatform';
import {
  createOrganization,
  deactivateOrganization,
  getApiErrorMessage,
  type OrganizationMutationPayload,
} from '../lib/apiClient';

type OrganizationFormState = {
  name: string;
  documentNumber: string;
  status: ContractStatus;
};

const PAGE_SIZE = 6;

const initialOrganizationForm: OrganizationFormState = {
  name: '',
  documentNumber: '',
  status: 'onboarding',
};

function getContractStatusLabel(status: ContractStatus) {
  if (status === 'active') return 'Ativa';
  if (status === 'onboarding') return 'Em implantação';
  return 'Desativada';
}

function getContractStatusPillClass(status: ContractStatus) {
  if (status === 'active') return 'status-pill status-pill-success';
  if (status === 'onboarding') return 'status-pill status-pill-muted';
  return 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100';
}

function getOrganizationUsers(organizationId: string, role?: 'org_admin' | 'instructor' | 'learner') {
  return usersSeed.filter(
    (record) => record.organizationId === organizationId && (!role || record.role === role)
  );
}

function getOrganizationModuleCount(organization: OrganizationRecord) {
  return modulesSeed.filter((module) => module.organizationIds.includes(organization.id)).length;
}

export default function Organizations() {
  const { accessToken } = useAuth();
  const platformData = usePlatformData();
  const [records, setRecords] = useState<OrganizationRecord[]>(organizationsSeed);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>(initialOrganizationForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setRecords([...organizationsSeed]);
  }, [platformData.version]);

  const deleteTarget = records.find((record) => record.id === deleteTargetId) ?? null;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRecords = records.filter((record) => {
    const admins = getOrganizationUsers(record.id, 'org_admin');
    const instructors = getOrganizationUsers(record.id, 'instructor');
    const learners = getOrganizationUsers(record.id, 'learner');
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${record.name} ${record.documentNumber} ${admins.map((admin) => admin.name).join(' ')} ${instructors
        .map((instructor) => instructor.name)
        .join(' ')} ${learners.map((learner) => learner.name).join(' ')}`
        .toLowerCase()
        .includes(normalizedSearch);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeOrganizations = records.filter((record) => record.status === 'active');
  const onboardingOrganizations = records.filter((record) => record.status === 'onboarding');
  const inactiveOrganizations = records.filter((record) => record.status === 'inactive');
  const orgAdmins = usersSeed.filter((record) => record.role === 'org_admin');
  const organizationFormIsValid =
    organizationForm.name.trim().length > 0 && organizationForm.documentNumber.trim().length > 0;
  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativas' },
    { value: 'onboarding', label: 'Em implantação' },
    { value: 'inactive', label: 'Desativadas' },
  ];

  function openCreateOrganizationDialog() {
    setOrganizationForm(initialOrganizationForm);
    setFormError('');
    setCreateDialogOpen(true);
  }

  function closeCreateOrganizationDialog() {
    setCreateDialogOpen(false);
    setOrganizationForm(initialOrganizationForm);
    setFormError('');
  }

  async function handleCreateOrganization() {
    if (!organizationFormIsValid || !accessToken || isSaving) return;

    const payload: OrganizationMutationPayload = {
      name: organizationForm.name.trim(),
      documentNumber: organizationForm.documentNumber.trim(),
      status: organizationForm.status,
    };

    setIsSaving(true);
    setFormError('');

    try {
      await createOrganization(accessToken, payload);
      await platformData.refresh();
      setRecords([...organizationsSeed]);
      setStatusFilter('all');
      setPage(1);
      closeCreateOrganizationDialog();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível criar a organização.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOrganization() {
    if (!deleteTarget || !accessToken || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deactivateOrganization(accessToken, deleteTarget.id);
      await platformData.refresh();
      setRecords([...organizationsSeed]);
      setStatusFilter('active');
      setPage(1);
      setDeleteTargetId(null);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Não foi possível desativar a organização.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organizações"
        description="Gerencie organizações clientes, admins da organização e módulos liberados para cada contrato."
        actions={
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            onClick={openCreateOrganizationDialog}
          >
            <Plus className="h-4 w-4" />
            Nova organização
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Organizações"
          value={`${records.length}`}
          caption={pluralize(activeOrganizations.length, 'ativa', 'ativas')}
          tooltip="Total de organizações cadastradas na plataforma."
          icon={Building2}
        />
        <StatCard
          label="Em implantação"
          value={`${onboardingOrganizations.length}`}
          caption={pluralize(inactiveOrganizations.length, 'desativada', 'desativadas')}
          tooltip="Organizações em fase de cadastro, configuração inicial ou liberação gradual."
          icon={ShieldCheck}
        />
        <StatCard
          label="Admins"
          value={`${orgAdmins.length}`}
          caption="Responsáveis cadastrados."
          tooltip="Admins de organização que podem gerenciar usuários e acompanhar operações."
          icon={UserCog}
        />
        <StatCard
          label="Módulos"
          value={`${getCatalogSummary().modules}`}
          caption={`${pluralize(getCatalogSummary().activeModules, 'ativo', 'ativos')} · ${getCatalogSummary().comingSoonModules} em breve`}
          tooltip="Catálogo de módulos que pode ser liberado por organização."
          icon={BookOpenCheck}
        />
      </section>

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Organizações cadastradas</h2>
            <p className="mt-1 text-sm text-white/60">
              Visão objetiva dos contratos e da composição de usuários por organização.
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
                placeholder="Buscar organização"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              ariaLabel="Filtrar organizações por status"
              onChange={(value) => {
                setStatusFilter(value as 'all' | ContractStatus);
                setPage(1);
              }}
            />
          </div>
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => {
                const adminCount = getOrganizationUsers(record.id, 'org_admin').length;
                const instructorCount = getOrganizationUsers(record.id, 'instructor').length;
                const learnerCount = getOrganizationUsers(record.id, 'learner').length;
                const moduleCount = getOrganizationModuleCount(record) || record.activeModules;

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="font-semibold text-white">{record.name}</div>
                      <div className="mt-1 text-xs text-white/45">{record.documentNumber}</div>
                    </td>
                    <td>{adminCount}</td>
                    <td>{instructorCount}</td>
                    <td>{learnerCount}</td>
                    <td>
                      <span className="chip chip-muted">{moduleCount}</span>
                    </td>
                    <td>
                      <span className={getContractStatusPillClass(record.status)}>
                        {getContractStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions table-actions-centered">
                        <Link to={`/app/organizations/${record.id}`} className="table-action-button">
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Link>
                        <button
                          type="button"
                          className="table-action-button table-action-danger"
                          disabled={record.status === 'inactive'}
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTargetId(record.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          {record.status === 'inactive' ? 'Desativada' : 'Desativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!paginatedRecords.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Nenhuma organização encontrada com os filtros atuais.
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
          totalItems={filteredRecords.length}
          pageSize={PAGE_SIZE}
          itemLabel="organizações"
          onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
        />
      </section>

      <ActionDialog
        open={createDialogOpen}
        title="Nova organização"
        description="Cadastre os dados básicos da organização cliente. Módulos e admins podem ser configurados na tela de detalhes."
        confirmLabel={isSaving ? 'Criando...' : 'Criar organização'}
        disabled={!organizationFormIsValid || isSaving}
        onClose={closeCreateOrganizationDialog}
        onConfirm={handleCreateOrganization}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="organization-name">
              Nome da organização
            </label>
            <input
              id="organization-name"
              className="admin-input"
              value={organizationForm.name}
              onChange={(event) =>
                setOrganizationForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Organização Demo"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="organization-document">
              CNPJ
            </label>
            <input
              id="organization-document"
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
                { value: 'onboarding', label: 'Em implantação' },
                { value: 'inactive', label: 'Desativada' },
              ]}
              ariaLabel="Selecionar status da organização"
              onChange={(value) =>
                setOrganizationForm((current) => ({ ...current, status: value as ContractStatus }))
              }
            />
          </div>
        </div>

        {formError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {formError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={deleteTarget !== null}
        title="Desativar organização"
        description={
          deleteTarget
            ? `Esta ação vai desativar ${deleteTarget.name}. Usuários, turmas e histórico permanecem preservados.`
            : undefined
        }
        confirmLabel={isDeleting ? 'Desativando...' : 'Desativar organização'}
        intent="danger"
        disabled={isDeleting}
        onClose={() => {
          setDeleteTargetId(null);
          setDeleteError('');
        }}
        onConfirm={handleDeleteOrganization}
      >
        {deleteError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {deleteError}
          </div>
        ) : null}
      </ActionDialog>
    </div>
  );
}
