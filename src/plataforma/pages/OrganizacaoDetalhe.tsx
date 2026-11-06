import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  api,
  errorText,
  patch,
  post,
  type Classroom,
  type Company,
  type CompanyCourse,
  type Course,
  type User,
} from '../api';
import { formatCnpj, formatCpf, formatDate, useLoad } from '../format';
import { blank, formFrom, personBody, type PersonForm } from '../people';
import {
  Card,
  Dialog,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageTitle,
  Stat,
} from '../ui';
import { PersonDialog } from './Pessoas';

/** Immersia: uma organização — gestores, cursos liberados e uso. */
export default function OrganizacaoDetalhe() {
  const { companyId = '' } = useParams();
  const data = useLoad(async () => {
    const [company, users, grants, courses, classes] = await Promise.all([
      api<Company>(`/companies/${companyId}`),
      api<User[]>(`/users?company_id=${companyId}`),
      api<CompanyCourse[]>(`/companies/${companyId}/courses`),
      api<Course[]>('/courses'),
      api<Classroom[]>(`/classes?company_id=${companyId}`),
    ]);
    return { company, users, grants, courses, classes };
  }, [companyId]);
  const [person, setPerson] = useState<PersonForm | null>(null);
  const [edit, setEdit] = useState<{ name: string; cnpj: string } | null>(null);
  const [grant, setGrant] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function run(
    action: () => Promise<unknown>,
    close: () => void = () => {}
  ) {
    setError('');
    try {
      await action();
      close();
      void data.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const { company, users, grants, courses, classes } = data.data;
  const managers = users.filter((u) => u.role === 'company_admin');
  const released = grants.filter((g) => !g.revoked_at);
  const title = new Map(courses.map((c) => [c.id, c.title]));
  const grantable = courses.filter(
    (c) =>
      c.published_at &&
      !c.archived_at &&
      !released.some((g) => g.course_id === c.id)
  );

  return (
    <>
      <PageTitle
        back="/app/organizacoes"
        title={company.name}
        subtitle={
          [formatCnpj(company.cnpj), company.active ? null : 'Inativa']
            .filter(Boolean)
            .join(' · ') || undefined
        }
        actions={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setError('');
                setEdit({ name: company.name, cnpj: formatCnpj(company.cnpj) });
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className={company.active ? 'ghost-btn' : 'secondary-btn'}
              onClick={() =>
                void run(() =>
                  patch(`/companies/${companyId}`, { active: !company.active })
                )
              }
            >
              {company.active ? 'Desativar' : 'Reativar'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Instrutores"
          value={users.filter((u) => u.role === 'instructor').length}
        />
        <Stat
          label="Alunos"
          value={users.filter((u) => u.role === 'student').length}
        />
        <Stat
          label="Turmas"
          value={classes.filter((c) => !c.archived_at).length}
        />
        <Stat label="Cursos liberados" value={released.length} />
      </div>
      {error && !person && !edit && grant === null ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title="Gestores"
          action={
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setError('');
                setPerson({ ...blank, role: 'company_admin' });
              }}
            >
              <Plus className="h-4 w-4" /> Gestor
            </button>
          }
        >
          {managers.length ? (
            <ul className="-my-2 divide-y divide-white/[0.06]">
              {managers.map((m) => (
                <li
                  key={m.id}
                  className={`flex items-center justify-between gap-3 py-2.5 ${m.active ? '' : 'opacity-50'}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-white/45">
                      {m.email ?? formatCpf(m.cpf)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-action"
                    onClick={() => {
                      setError('');
                      setPerson(formFrom(m));
                    }}
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50">
              Cadastre o gestor: ele cadastra instrutores, alunos e turmas.
            </p>
          )}
        </Card>

        <Card
          title="Cursos liberados"
          action={
            grantable.length ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setError('');
                  setGrant('');
                }}
              >
                <Plus className="h-4 w-4" /> Curso
              </button>
            ) : null
          }
        >
          {released.length ? (
            <ul className="-my-2 divide-y divide-white/[0.06]">
              {released.map((g) => (
                <li
                  key={g.course_id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {title.get(g.course_id) ?? 'Curso'}
                    </p>
                    <p className="text-xs text-white/45">
                      desde {formatDate(g.granted_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-action p-action-danger"
                    onClick={() =>
                      void run(() =>
                        post(
                          `/companies/${companyId}/courses/${g.course_id}/revoke`
                        )
                      )
                    }
                  >
                    Retirar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50">Nenhum curso liberado.</p>
          )}
        </Card>
      </div>

      <PersonDialog
        form={person}
        setForm={setPerson}
        roles={['company_admin']}
        error={error}
        onSave={() =>
          person &&
          void run(
            () =>
              person.id
                ? patch(`/users/${person.id}`, personBody(person))
                : post('/users', personBody(person, companyId)),
            () => setPerson(null)
          )
        }
        onClose={() => setPerson(null)}
      />

      <Dialog
        open={Boolean(edit)}
        title="Editar organização"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setEdit(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              disabled={!edit?.name.trim()}
              onClick={() =>
                edit &&
                void run(
                  () =>
                    patch(`/companies/${companyId}`, {
                      name: edit.name,
                      cnpj: edit.cnpj || null,
                    }),
                  () => setEdit(null)
                )
              }
            >
              Salvar
            </button>
          </>
        }
      >
        {edit ? (
          <>
            <Field label="Nome">
              <input
                className="admin-input"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </Field>
            <Field label="CNPJ">
              <input
                className="admin-input"
                value={edit.cnpj}
                onChange={(e) => setEdit({ ...edit, cnpj: e.target.value })}
              />
            </Field>
          </>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <Dialog
        open={grant !== null}
        title="Liberar curso"
        onClose={() => setGrant(null)}
        footer={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setGrant(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              disabled={!grant}
              onClick={() =>
                void run(
                  () =>
                    post(`/companies/${companyId}/courses`, {
                      course_id: grant,
                    }),
                  () => setGrant(null)
                )
              }
            >
              Liberar
            </button>
          </>
        }
      >
        <Field label="Curso publicado">
          <select
            className="admin-select"
            value={grant ?? ''}
            onChange={(e) => setGrant(e.target.value)}
          >
            <option value="">Escolha</option>
            {grantable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
