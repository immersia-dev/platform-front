import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { api, type VrRequest } from '../api';
import {
  formatDateTime,
  formatScore,
  useLoad,
  useStableHeight,
  usePaged,
} from '../format';
import {
  Card,
  Empty,
  ErrorState,
  Loading,
  OutcomeBadge,
  PageTitle,
  PracticeBadge,
  Segmented,
  VrStatusBadge,
  Pager,
  SearchField,
} from '../ui';

type Filter = 'all' | 'assessment' | 'practice';

/** Sessões VR: o aluno vê os próprios resultados; instrutor e gestor, as das turmas. */
export default function Sessoes() {
  const { user } = useAuth();
  const learner = user?.role === 'learner';
  const [filter, setFilter] = useState<Filter>('all');
  const list = useLoad(() => api<VrRequest[]>('/vr-requests'), [], 8000);
  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (list.data ?? []).filter(
      (r) =>
        (filter === 'all' || r.mode === filter) &&
        (!term ||
          `${r.student_name ?? ''} ${r.requested_by_name ?? ''} ${r.lesson_title} ${r.course_title ?? ''}`
            .toLocaleLowerCase('pt-BR')
            .includes(term))
    );
  }, [list.data, filter, search]);
  const hasPractice = (list.data ?? []).some((r) => r.mode === 'practice');

  // a lista não encolhe enquanto filtra ou busca; volta a medir quando os dados mudam
  const stableList = useStableHeight(list.data);
  const paged = usePaged(rows, 25, `${filter}|${search}`);
  return (
    <>
      <PageTitle
        title={learner ? 'Resultados' : 'Sessões VR'}
        actions={
          user?.role === 'instructor' || learner ? (
            <Link to="/app/iniciar" className="primary-btn sm:w-auto sm:px-5">
              <Play className="h-4 w-4" /> Iniciar treinamento
            </Link>
          ) : null
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {!learner && hasPractice ? (
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'assessment', label: 'Alunos' },
              { value: 'practice', label: 'Testes' },
            ]}
          />
        ) : null}
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={
            learner ? 'Buscar treinamento' : 'Buscar aluno ou treinamento'
          }
          className="sm:ml-auto sm:w-80"
        />
      </div>
      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={() => void list.reload()} />
      ) : (
        <Card flush>
          <div ref={stableList}>
            {!rows.length ? (
              <Empty
                title={
                  search ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão ainda'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="p-table">
                  <thead>
                    <tr>
                      {!learner ? <th>Aluno</th> : null}
                      <th>Treinamento</th>
                      <th>Situação</th>
                      <th>Nota</th>
                      <th>Resultado</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.items.map((r) => (
                      <tr key={r.id}>
                        {!learner ? (
                          <td>
                            <Link
                              to={`/app/sessoes/${r.id}`}
                              className="p-link whitespace-nowrap"
                            >
                              {r.mode === 'practice'
                                ? r.requested_by_name
                                : (r.student_name ?? 'Aluno')}
                            </Link>
                            {r.mode === 'practice' ? (
                              <span className="ml-2">
                                <PracticeBadge />
                              </span>
                            ) : null}
                          </td>
                        ) : null}
                        <td>
                          {learner ? (
                            <Link
                              to={`/app/sessoes/${r.id}`}
                              className="p-link"
                            >
                              {r.lesson_title}
                            </Link>
                          ) : (
                            r.lesson_title
                          )}
                          {r.course_title ? (
                            <span className="block text-xs text-white/40">
                              {r.course_title}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <VrStatusBadge status={r.status} />
                        </td>
                        <td className="tabular-nums">
                          {formatScore(r.best_score)}
                        </td>
                        <td>
                          <OutcomeBadge outcome={r.outcome} />
                        </td>
                        <td className="whitespace-nowrap text-white/55">
                          {formatDateTime(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager {...paged} noun="sessões" />
          </div>
        </Card>
      )}
    </>
  );
}
