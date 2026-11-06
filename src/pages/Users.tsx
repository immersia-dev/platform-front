import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import ActionDialog from '../components/ActionDialog';
import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  organizationsSeed,
  roleLabels,
  usersSeed,
  type AppRole,
  type UserRecord,
  type UserSex,
  type UserStatus,
} from '../data/mockPlatform';
import {
  createUser,
  deactivateUser,
  getApiErrorMessage,
  updateUser,
  type UserMutationPayload,
} from '../lib/apiClient';

type UserFormState = {
  name: string;
  email: string;
  documentNumber: string;
  sex: UserSex;
  birthDate: string;
  role: AppRole;
  organizationId: string;
  status: UserStatus;
};

const PAGE_SIZE = 6;
const DEFAULT_INITIAL_PASSWORD = '123456789';
const platformManagedRoles: AppRole[] = ['org_admin', 'instructor', 'learner'];
const organizationManagedRoles: AppRole[] = ['instructor', 'learner'];
const sexOptions: Array<{ value: UserSex; label: string }> = [
  { value: 'not_informed', label: 'Não informado' },
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Outro' },
];

function getOrganizationName(organizationId: string) {
  return organizationsSeed.find((record) => record.id === organizationId)?.name ?? null;
}

function getStatusLabel(status: UserStatus) {
  if (status === 'active') return 'Ativo';
  if (status === 'invited') return 'Convidado';
  return 'Desativado';
}

function getStatusPillClass(status: UserStatus) {
  if (status === 'active') return 'status-pill status-pill-success';
  if (status === 'invited') return 'status-pill status-pill-muted';
  return 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100';
}

function createEmptyForm(organizationId: string | null): UserFormState {
  return {
    name: '',
    email: '',
    documentNumber: '',
    sex: 'not_informed',
    birthDate: '',
    role: 'learner',
    organizationId: organizationId ?? '',
    status: 'active',
  };
}

export default function Users() {
  const { accessToken, user } = useAuth();
  const platformData = usePlatformData();
  const [records, setRecords] = useState<UserRecord[]>(usersSeed);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [page, setPage] = useState(1);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(() => createEmptyForm(user?.organizationId ?? null));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setRecords([...usersSeed]);
  }, [platformData.version]);

  if (!user) return null;

  const activeUser = user;
  const allowedFormRoles =
    activeUser.role === 'super_admin' ? platformManagedRoles : organizationManagedRoles;
  const scopedRecords = records.filter((record) => {
    if (activeUser.role === 'super_admin') return record.role !== 'super_admin';

    return (
      record.organizationId === activeUser.organizationId &&
      organizationManagedRoles.includes(record.role)
    );
  });
  const visibleRoleOptions = Array.from(new Set(scopedRecords.map((record) => record.role)));
  const filteredRecords = scopedRecords.filter((record) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch =
      searchTerm.length === 0 ||
      `${record.name} ${record.email} ${record.organizationName ?? ''}`.toLowerCase().includes(searchTerm);
    const matchesRole = roleFilter === 'all' || record.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const deleteTarget = records.find((record) => record.id === deleteTargetId) ?? null;
  const emailAlreadyUsed = records.some(
    (record) =>
      record.id !== editingId && record.email.toLowerCase() === form.email.trim().toLowerCase()
  );
  const canSaveUser =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    allowedFormRoles.includes(form.role) &&
    !emailAlreadyUsed &&
    (form.role === 'super_admin' || form.organizationId.length > 0);
  const roleOptions = [
    { value: 'all', label: 'Todos os perfis' },
    ...visibleRoleOptions.map((role) => ({ value: role, label: roleLabels[role] })),
  ];
  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativos' },
    { value: 'invited', label: 'Convidados' },
    { value: 'inactive', label: 'Desativados' },
  ];
  const formRoleOptions = allowedFormRoles.map((role) => ({ value: role, label: roleLabels[role] }));
  const organizationOptions = [
    { value: '', label: 'Selecionar organização' },
    ...organizationsSeed.map((organization) => ({ value: organization.id, label: organization.name })),
  ];
  const currentOrganizationName =
    form.role === 'super_admin'
      ? 'Immersia'
      : getOrganizationName(form.organizationId) ?? 'Organização não definida';

  function canManageRecord(record: UserRecord) {
    if (activeUser.role === 'super_admin') return record.role !== 'super_admin';

    return (
      record.organizationId === activeUser.organizationId &&
      organizationManagedRoles.includes(record.role)
    );
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(createEmptyForm(activeUser.organizationId));
    setSaveError('');
    setDialogMode('create');
  }

  function openEditDialog(record: UserRecord) {
    if (!canManageRecord(record)) return;

    setEditingId(record.id);
    setForm({
      name: record.name,
      email: record.email,
      documentNumber: record.documentNumber,
      sex: record.sex,
      birthDate: record.birthDate,
      role: record.role,
      organizationId: record.organizationId ?? '',
      status: record.status,
    });
    setSaveError('');
    setDialogMode('edit');
  }

  function closeUserDialog() {
    setDialogMode(null);
    setEditingId(null);
    setForm(createEmptyForm(activeUser.organizationId));
    setSaveError('');
  }

  async function handleSaveUser() {
    if (!canSaveUser || !accessToken || isSaving) return;

    const organizationId = form.role === 'super_admin' ? null : form.organizationId;
    const payload: UserMutationPayload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      documentNumber: form.documentNumber.trim(),
      sex: form.sex,
      birthDate: form.birthDate,
      role: form.role,
      organizationId,
      status: form.status,
    };

    setIsSaving(true);
    setSaveError('');

    try {
      if (editingId) {
        await updateUser(accessToken, editingId, payload);
      } else {
        await createUser(accessToken, {
          ...payload,
          password: DEFAULT_INITIAL_PASSWORD,
        });
      }

      await platformData.refresh();
      setRecords([...usersSeed]);
      setRoleFilter('all');
      setStatusFilter('all');
      setPage(1);
      closeUserDialog();
    } catch (caughtError) {
      setSaveError(getApiErrorMessage(caughtError, 'Não foi possível salvar o usuário.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (
      !deleteTarget ||
      !canManageRecord(deleteTarget) ||
      deleteTarget.email === activeUser.email ||
      !accessToken ||
      isDeleting
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deactivateUser(accessToken, deleteTarget.id);
      await platformData.refresh();
      setRecords([...usersSeed]);
      setStatusFilter('active');
      setPage(1);
      setDeleteTargetId(null);
    } catch (caughtError) {
      setDeleteError(getApiErrorMessage(caughtError, 'Não foi possível desativar o usuário.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Usuários"
        actions={
          <button type="button" className="primary-btn sm:w-auto sm:px-5" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Novo usuário
          </button>
        }
      />

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Perfis cadastrados</h2>
            <p className="mt-1 text-sm text-white/60">
              {activeUser.role === 'super_admin'
                ? 'Usuários cadastrados em todas as organizações da plataforma.'
                : 'Usuários da sua organização, com gestão de instrutores e alunos.'}
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
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Organização</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => {
                const manageable = canManageRecord(record);
                const canDelete =
                  manageable && record.email !== activeUser.email && record.status !== 'inactive';

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="font-semibold text-white">{record.name}</div>
                      <div className="mt-1 text-xs text-white/50">{record.email}</div>
                    </td>
                    <td>{roleLabels[record.role]}</td>
                    <td>{record.organizationName ?? 'Immersia'}</td>
                    <td>
                      <span className={getStatusPillClass(record.status)}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>
                      {record.lastAccessAt
                        ? new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(record.lastAccessAt))
                        : 'Sem atividade'}
                    </td>
                    <td>
                      <div className="table-actions table-actions-centered">
                        <button
                          type="button"
                          className="table-action-button"
                          disabled={!manageable}
                          onClick={() => openEditDialog(record)}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          className="table-action-button table-action-danger"
                          disabled={!canDelete}
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTargetId(record.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          {record.status === 'inactive' ? 'Desativado' : 'Desativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!paginatedRecords.length ? (
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
          totalItems={filteredRecords.length}
          pageSize={PAGE_SIZE}
          itemLabel="usuários"
          onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
        />
      </section>

      <ActionDialog
        open={dialogMode !== null}
        title={dialogMode === 'edit' ? 'Editar usuário' : 'Criar usuário'}
        description={
          activeUser.role === 'super_admin'
            ? 'Defina o perfil e o escopo de acesso do usuário.'
            : 'Cadastre instrutores e alunos vinculados à sua organização.'
        }
        confirmLabel={
          isSaving ? 'Salvando...' : dialogMode === 'edit' ? 'Salvar alterações' : 'Criar usuário'
        }
        disabled={!canSaveUser || isSaving}
        onClose={closeUserDialog}
        onConfirm={handleSaveUser}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/70">Nome completo</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="admin-input"
              placeholder="Ex.: Maria Silva"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/70">E-mail</span>
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="admin-input"
              placeholder="nome@organizacao.com"
              type="email"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/70">Documento</span>
            <input
              value={form.documentNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, documentNumber: event.target.value }))
              }
              className="admin-input"
              placeholder="CPF ou documento interno"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-semibold text-white/70">Sexo</span>
            <FilterSelect
              value={form.sex}
              options={sexOptions}
              ariaLabel="Selecionar sexo"
              onChange={(value) => setForm((current) => ({ ...current, sex: value as UserSex }))}
            />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/70">Data de nascimento</span>
            <input
              value={form.birthDate}
              onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
              className="admin-input"
              type="date"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="mb-2 block text-sm font-semibold text-white/70">Perfil de acesso</span>
            <FilterSelect
              value={form.role}
              options={formRoleOptions}
              ariaLabel="Selecionar perfil de acesso"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  role: value as AppRole,
                  organizationId:
                    value === 'super_admin' ? '' : current.organizationId || activeUser.organizationId || '',
                }))
              }
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-white/70">Status</span>
            <FilterSelect
              value={form.status}
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'invited', label: 'Convidado' },
                { value: 'inactive', label: 'Desativado' },
              ]}
              ariaLabel="Selecionar status do usuário"
              onChange={(value) =>
                setForm((current) => ({ ...current, status: value as UserStatus }))
              }
            />
          </div>
        </div>

        {activeUser.role === 'super_admin' && form.role !== 'super_admin' ? (
          <div>
            <span className="mb-2 block text-sm font-semibold text-white/70">Organização</span>
            <FilterSelect
              value={form.organizationId}
              options={organizationOptions}
              ariaLabel="Selecionar organização"
              onChange={(value) => setForm((current) => ({ ...current, organizationId: value }))}
            />
          </div>
        ) : (
          <div className="readonly-field">
            <span className="readonly-field-label">Organização</span>
            <strong className="readonly-field-value">{currentOrganizationName}</strong>
          </div>
        )}

        {emailAlreadyUsed ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Já existe um usuário cadastrado com este e-mail.
          </div>
        ) : null}

        {saveError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {saveError}
          </div>
        ) : null}
      </ActionDialog>

      <ActionDialog
        open={Boolean(deleteTarget)}
        title="Desativar usuário"
        description="Confirme a desativação do acesso deste usuário. O histórico de aprendizagem será preservado."
        confirmLabel={isDeleting ? 'Desativando...' : 'Desativar usuário'}
        intent="danger"
        disabled={isDeleting}
        onClose={() => {
          setDeleteTargetId(null);
          setDeleteError('');
        }}
        onConfirm={handleDeleteUser}
      >
        {deleteTarget ? (
          <div className="readonly-field">
            <span className="readonly-field-label">Usuário</span>
            <strong className="readonly-field-value">{deleteTarget.name}</strong>
            <p className="mt-1 text-sm text-white/50">{deleteTarget.email}</p>
          </div>
        ) : null}

        {deleteError ? (
          <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {deleteError}
          </div>
        ) : null}
      </ActionDialog>
    </div>
  );
}
