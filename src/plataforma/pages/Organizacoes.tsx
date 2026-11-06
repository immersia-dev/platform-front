import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api, errorText, post, type Company, type User } from '../api';
import { formatCnpj, useLoad, usePaged } from '../format';
import {
  Card,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageTitle,
  Pager,
  SearchField,
} from '../ui';

/** Immersia: organizações clientes. */
export default function Organizacoes() {
  const navigate = useNavigate();
  const data = useLoad(async () => {
    const [companies, users] = await Promise.all([
      api<Company[]>('/companies'),
      api<User[]>('/users'),
    ]);
    return { companies, users };
  }, []);
  const [form, setForm] = useState<{ name: string; cnpj: string } | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const term = query.trim().toLocaleLowerCase('pt-BR');
  const digits = query.replace(/\D/g, '');
  const filtered = (data.data?.companies ?? []).filter(
    (c) =>
      !term ||
      c.name.toLocaleLowerCase('pt-BR').includes(term) ||
      (digits && (c.cnpj ?? '').includes(digits))
  );
  const paged = usePaged(filtered, 20, query);

  async function create() {
    if (!form) return;
    setError('');
    try {
      const company = await post<Company>('/companies', {
        name: form.name,
        cnpj: form.cnpj || null,
      });
      navigate(`/app/organizacoes/${company.id}`);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const { companies, users } = data.data;

  return (
    <>
      <PageTitle
        title="Organizações"
        actions={
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            onClick={() => {
              setError('');
              setForm({ name: '', cnpj: '' });
            }}
          >
            <Plus className="h-4 w-4" /> Nova organização
          </button>
        }
      />
      <Card
        flush
        title="Organizações"
        action={
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Buscar nome ou CNPJ"
            className="w-full sm:w-64"
          />
        }
      >
        {!filtered.length ? (
          <div className="px-5 pb-5 sm:px-6">
            <Empty
              title={
                companies.length
                  ? 'Nenhuma organização encontrada'
                  : 'Nenhuma organização'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="p-table">
              <thead>
                <tr>
                  <th>Organização</th>
                  <th>CNPJ</th>
                  <th>Gestores</th>
                  <th>Alunos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {paged.items.map((c) => {
                  const people = users.filter((u) => u.company_id === c.id);
                  return (
                    <tr key={c.id} className={c.active ? '' : 'opacity-50'}>
                      <td>
                        <Link
                          to={`/app/organizacoes/${c.id}`}
                          className="p-link"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-white/55">
                        {formatCnpj(c.cnpj) || '—'}
                      </td>
                      <td className="tabular-nums">
                        {
                          people.filter((u) => u.role === 'company_admin')
                            .length
                        }
                      </td>
                      <td className="tabular-nums">
                        {people.filter((u) => u.role === 'student').length}
                      </td>
                      <td className="text-right text-xs text-white/45">
                        {c.active ? '' : 'Inativa'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager {...paged} noun="organizações" />
      </Card>

      <Dialog
        open={Boolean(form)}
        title="Nova organização"
        onClose={() => setForm(null)}
        footer={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setForm(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              disabled={!form?.name.trim()}
              onClick={() => void create()}
            >
              Criar
            </button>
          </>
        }
      >
        {form ? (
          <>
            <Field label="Nome">
              <input
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="CNPJ">
              <input
                className="admin-input"
                inputMode="numeric"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </Field>
          </>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
