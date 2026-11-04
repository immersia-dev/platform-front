import { Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import TablePagination from '../components/TablePagination';
import { useAuth } from '../auth/useAuth';
import {
  studentGroupMembershipsSeed,
  studentGroupsSeed,
  usersSeed,
  type UserStatus,
} from '../data/mockPlatform';
import { formatDateTime } from '../lib/instructorAnalytics';

const PAGE_SIZE = 6;

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

export default function Students() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [page, setPage] = useState(1);
  const organizationId = user?.organizationId ?? null;
  const organizationGroups = studentGroupsSeed.filter(
    (group) => group.organizationId === organizationId && group.status === 'active'
  );
  const learners = usersSeed.filter(
    (record) => record.organizationId === organizationId && record.role === 'learner'
  );
  const groupOptions = [
    { value: 'all', label: 'Todas as turmas' },
    ...organizationGroups.map((group) => ({ value: group.id, label: group.name })),
  ];
  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativos' },
    { value: 'invited', label: 'Convidados' },
    { value: 'inactive', label: 'Desativados' },
  ];

  function getActiveGroup(learnerId: string) {
    const activeMembership = studentGroupMembershipsSeed.find(
      (membership) => membership.learnerId === learnerId && membership.status === 'active'
    );

    return organizationGroups.find((group) => group.id === activeMembership?.groupId) ?? null;
  }

  function getLastGroup(learnerId: string) {
    const memberships = studentGroupMembershipsSeed
      .filter((membership) => membership.learnerId === learnerId)
      .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());

    const lastMembership = memberships[0] ?? null;
    const group = studentGroupsSeed.find((record) => record.id === lastMembership?.groupId) ?? null;

    return {
      group,
      membership: lastMembership,
    };
  }

  function getActiveMembership(learnerId: string) {
    return studentGroupMembershipsSeed.find(
      (membership) => membership.learnerId === learnerId && membership.status === 'active'
    );
  }

  const learnerRows = learners.map((learner) => ({
    learner,
    activeGroup: getActiveGroup(learner.id),
    lastGroup: getLastGroup(learner.id).group,
    activeMembership: getActiveMembership(learner.id),
  }));

  const filteredRows = learnerRows.filter((row) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch =
      searchTerm.length === 0 ||
      `${row.learner.name} ${row.learner.email} ${row.activeGroup?.name ?? ''}`
        .toLowerCase()
        .includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || row.learner.status === statusFilter;
    const matchesGroup = groupFilter === 'all' || row.activeGroup?.id === groupFilter;

    return matchesSearch && matchesStatus && matchesGroup;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!organizationId) return null;

  return (
    <div className="space-y-8">
      <PageHeader title="Alunos" />

      <section className="table-shell">
        <div className="table-shell-header gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Alunos cadastrados</h2>
            <p className="mt-1 text-sm text-white/60">
              Exibindo {filteredRows.length} de {learnerRows.length} alunos em{' '}
              {organizationGroups.length} turmas ativas.
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
                placeholder="Buscar aluno"
              />
            </div>

            <FilterSelect
              value={groupFilter}
              options={groupOptions}
              ariaLabel="Filtrar por turma"
              onChange={(value) => {
                setGroupFilter(value);
                setPage(1);
              }}
            />

            <FilterSelect
              value={statusFilter}
              options={statusOptions}
              ariaLabel="Filtrar por status"
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
                <th>Aluno</th>
                <th>Última turma</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Entrada na turma</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.learner.id}>
                  <td>
                    <div className="font-medium text-white">{row.learner.name}</div>
                    <div className="mt-1 text-xs text-white/50">{row.learner.email}</div>
                  </td>
                  <td>
                    {row.lastGroup ? (
                      <Link
                        to={`/app/groups/${row.lastGroup.id}`}
                        className="font-medium text-white transition hover:text-cyan-100"
                      >
                        {row.lastGroup.name}
                      </Link>
                    ) : (
                      <div className="font-medium text-white">Sem turma</div>
                    )}
                    {row.lastGroup ? (
                      <div className="mt-1 text-xs text-white/50">{row.lastGroup.code}</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={getStatusPillClass(row.learner.status)}>
                      {getStatusLabel(row.learner.status)}
                    </span>
                  </td>
                  <td>{formatDateTime(row.learner.lastAccessAt ?? null)}</td>
                  <td>{formatDateTime(row.activeMembership?.startedAt ?? null)}</td>
                  <td>
                    <div className="table-actions table-actions-centered">
                      <Link to={`/app/students/${row.learner.id}`} className="table-action-button">
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!paginatedRows.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-6 text-center text-sm text-white/55">
                      Nenhum aluno encontrado com os filtros atuais.
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
          itemLabel="alunos"
          onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
        />
      </section>
    </div>
  );
}
