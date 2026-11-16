import { Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  api,
  errorText,
  patch,
  post,
  roleNames,
  type BackRole,
  type User,
} from '../api';
import {
  downloadCsv,
  formatCpf,
  parseCsv,
  useLoad,
  useStableHeight,
  usePaged,
} from '../format';
import {
  blank,
  formFrom,
  personBody,
  type PersonForm as Form,
} from '../people';
import {
  Card,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageTitle,
  Segmented,
  Pager,
  SearchField,
} from '../ui';

type Filter = 'all' | 'instructor' | 'student';

/** Formulário de pessoa, usado também pela Immersia para os gestores de uma organização. */
export function PersonDialog({
  form,
  setForm,
  roles,
  error,
  onSave,
  onClose,
  onAnonymize,
}: {
  form: Form | null;
  setForm: (form: Form) => void;
  roles: BackRole[];
  error: string;
  onSave: () => void;
  onClose: () => void;
  onAnonymize?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!form) return null;
  const editing = Boolean(form.id);
  const valid =
    form.name.trim() &&
    (form.email.trim() || form.cpf.trim()) &&
    (editing
      ? !form.password || form.password.length >= 10
      : form.password.length >= 10);
  return (
    <Dialog
      open
      title={editing ? 'Editar pessoa' : 'Nova pessoa'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            disabled={!valid}
            onClick={onSave}
          >
            Salvar
          </button>
        </>
      }
    >
      <Field label="Nome">
        <input
          className="admin-input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail">
          <input
            className="admin-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="CPF">
          <input
            className="admin-input"
            inputMode="numeric"
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </Field>
      </div>
      {!editing && roles.length > 1 ? (
        <Field label="Perfil">
          <select
            className="admin-select"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as BackRole })
            }
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {roleNames[r]}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field
        label={
          editing ? 'Nova senha provisória (opcional)' : 'Senha provisória'
        }
        hint="Mínimo de 10 caracteres. A pessoa troca no primeiro acesso."
      >
        <input
          className="admin-input"
          type="text"
          autoComplete="off"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </Field>
      {editing ? (
        <label className="flex items-center gap-3 text-sm text-white/75">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />{' '}
          Acesso ativo
        </label>
      ) : null}
      {editing && onAnonymize ? (
        <div className="border-t border-white/10 pt-4">
          {confirming ? (
            <div className="space-y-3">
              <Notice tone="warn">
                Nome, e-mail e CPF são apagados e o acesso é encerrado. Os
                resultados ficam anônimos nos registros da organização. Não dá
                para desfazer.
              </Notice>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="danger-btn"
                  onClick={onAnonymize}
                >
                  Remover dados pessoais
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setConfirming(false)}
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="p-action p-action-danger"
              onClick={() => setConfirming(true)}
            >
              Remover dados pessoais (LGPD)
            </button>
          )}
        </div>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Dialog>
  );
}

export default function Pessoas() {
  const people = useLoad(() => api<User[]>('/users'), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (people.data ?? [])
      .filter(
        (u) =>
          u.role === 'instructor' ||
          u.role === 'student' ||
          u.role === 'company_admin'
      )
      .filter((u) => filter === 'all' || u.role === filter)
      .filter(
        (u) =>
          !term ||
          `${u.name} ${u.email ?? ''} ${u.cpf ?? ''}`
            .toLocaleLowerCase('pt-BR')
            .includes(term)
      );
  }, [people.data, filter, search]);

  async function save() {
    if (!form) return;
    setError('');
    try {
      if (form.id) await patch(`/users/${form.id}`, personBody(form));
      else await post('/users', personBody(form));
      setForm(null);
      void people.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  async function anonymize() {
    if (!form?.id) return;
    setError('');
    try {
      await post(`/users/${form.id}/anonymize`);
      setForm(null);
      void people.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  async function runImport() {
    setError('');
    try {
      setResult(
        await post<{ created: number; errors: string[] }>('/users/import', {
          password,
          rows,
        })
      );
      void people.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  // a lista não encolhe enquanto filtra ou busca; volta a medir quando os dados mudam
  const stableList = useStableHeight(people.data);
  const paged = usePaged(visible, 25, `${filter}|${search}`);
  return (
    <>
      <PageTitle
        title="Pessoas"
        actions={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setError('');
                setRows([]);
                setResult(null);
                setPassword('');
                setImporting(true);
              }}
            >
              <Upload className="h-4 w-4" /> Importar planilha
            </button>
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              onClick={() => {
                setError('');
                setForm(blank);
              }}
            >
              <Plus className="h-4 w-4" /> Nova pessoa
            </button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'instructor', label: 'Instrutores' },
            { value: 'student', label: 'Alunos' },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, e-mail ou CPF"
          className="sm:ml-auto sm:w-80"
        />
      </div>
      {people.loading ? (
        <Loading />
      ) : people.error ? (
        <ErrorState
          message={people.error}
          onRetry={() => void people.reload()}
        />
      ) : (
        <Card flush>
          <div ref={stableList}>
            {!visible.length ? (
              <Empty title="Ninguém encontrado" />
            ) : (
              <div className="overflow-x-auto">
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Acesso</th>
                      <th>Perfil</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.items.map((u) => (
                      <tr key={u.id} className={u.active ? '' : 'opacity-50'}>
                        <td className="font-medium text-white">
                          {u.role === 'student' ? (
                            <Link to={`/app/alunos/${u.id}`} className="p-link">
                              {u.name}
                            </Link>
                          ) : (
                            u.name
                          )}
                          {!u.active ? (
                            <span className="ml-2 text-xs text-white/50">
                              inativo
                            </span>
                          ) : null}
                        </td>
                        <td className="text-white/60">
                          {u.email ?? formatCpf(u.cpf)}
                        </td>
                        <td>{roleNames[u.role]}</td>
                        <td className="text-right">
                          {u.role !== 'company_admin' ? (
                            <button
                              type="button"
                              className="p-action"
                              onClick={() => {
                                setError('');
                                setForm(formFrom(u));
                              }}
                            >
                              Editar
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager {...paged} noun="pessoas" />
          </div>
        </Card>
      )}

      <PersonDialog
        form={form}
        setForm={setForm}
        roles={['student', 'instructor']}
        error={error}
        onSave={() => void save()}
        onClose={() => setForm(null)}
        onAnonymize={() => void anonymize()}
      />

      <Dialog
        open={importing}
        title="Importar planilha"
        onClose={() => setImporting(false)}
        footer={
          result ? (
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              onClick={() => setImporting(false)}
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setImporting(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-btn sm:w-auto sm:px-5"
                disabled={!rows.length || password.length < 10}
                onClick={() => void runImport()}
              >
                Importar {rows.length ? `${rows.length} pessoas` : ''}
              </button>
            </>
          )
        }
      >
        {result ? (
          <>
            <Notice tone={result.errors.length ? 'warn' : 'success'}>
              {result.created}{' '}
              {result.created === 1
                ? 'pessoa cadastrada'
                : 'pessoas cadastradas'}
              .
            </Notice>
            {result.errors.length ? (
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-amber-100/90">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm text-white/60">
              CSV com as colunas <strong>nome</strong>, <strong>email</strong>,{' '}
              <strong>cpf</strong> e <strong>perfil</strong> (aluno ou
              instrutor).{' '}
              <button
                type="button"
                className="text-cyan-200 underline"
                onClick={() =>
                  downloadCsv(
                    'modelo-pessoas.csv',
                    ['nome', 'email', 'cpf', 'perfil'],
                    [['Maria Souza', 'maria@empresa.com.br', '', 'aluno']]
                  )
                }
              >
                Baixar modelo
              </button>
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-white/70"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                setRows(file ? parseCsv(await file.text()) : []);
              }}
            />
            {rows.length ? (
              <p className="text-xs text-white/50">
                {rows.length} linhas encontradas.
              </p>
            ) : null}
            <Field
              label="Senha provisória para todos"
              hint="Cada pessoa troca no primeiro acesso."
            >
              <input
                className="admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </>
        )}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
