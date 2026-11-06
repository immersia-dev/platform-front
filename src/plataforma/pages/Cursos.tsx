import { ImageOff, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { api, errorText, post, type Course } from '../api';
import {
  courseCover,
  formatHours,
  useLoad,
  usePaged,
  validityText,
} from '../format';
import { courseBody, emptyCourse, type CourseForm } from '../courses';
import {
  Card,
  CourseState,
  Dialog,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageTitle,
  Pager,
  SearchField,
} from '../ui';
import Catalogo from './Catalogo';
import { CourseFields } from './CursoDetalhe';

/** Immersia: o catálogo inteiro. Gestor: o catálogo como vitrine (os cursos da organização e os para contratar). */
export default function Cursos() {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? <CatalogAdmin /> : <Catalogo />;
}

function CatalogAdmin() {
  const navigate = useNavigate();
  const courses = useLoad(() => api<Course[]>('/courses'), []);
  const [form, setForm] = useState<CourseForm | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return (courses.data ?? []).filter(
      (c) => !q || c.title.toLocaleLowerCase('pt-BR').includes(q)
    );
  }, [courses.data, query]);
  const paged = usePaged(filtered, 20, query);

  async function create() {
    if (!form) return;
    setError('');
    try {
      const course = await post<Course>('/courses', courseBody(form));
      navigate(`/app/cursos/${course.id}`);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  return (
    <>
      <PageTitle
        title="Catálogo de cursos"
        actions={
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            onClick={() => {
              setError('');
              setForm(emptyCourse);
            }}
          >
            <Plus className="h-4 w-4" /> Novo curso
          </button>
        }
      />
      {courses.loading ? (
        <Loading />
      ) : courses.error ? (
        <ErrorState
          message={courses.error}
          onRetry={() => void courses.reload()}
        />
      ) : (
        <Card
          flush
          title="Cursos"
          action={
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Buscar curso"
              className="w-full sm:w-64"
            />
          }
        >
          {!filtered.length ? (
            <div className="px-5 pb-5 sm:px-6">
              <Empty
                title={query ? 'Nenhum curso encontrado' : 'Nenhum curso'}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="p-table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Carga horária</th>
                    <th>Validade</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          to={`/app/cursos/${c.id}`}
                          className="flex items-center gap-3"
                        >
                          {courseCover(c.cover_url) ? (
                            <img
                              src={courseCover(c.cover_url) ?? ''}
                              alt=""
                              className="h-10 w-16 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span
                              className="grid h-10 w-16 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500/20 via-violet-600/20 to-fuchsia-600/15"
                              title="Sem foto de capa"
                            >
                              <ImageOff className="h-4 w-4 text-white/40" />
                            </span>
                          )}
                          <span className="p-link">{c.title}</span>
                        </Link>
                      </td>
                      <td>{formatHours(c.workload_hours)}</td>
                      <td>{validityText(c)}</td>
                      <td>
                        <CourseState course={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager {...paged} noun="cursos" />
            </div>
          )}
        </Card>
      )}

      <Dialog
        open={Boolean(form)}
        title="Novo curso"
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
              disabled={!form?.title.trim()}
              onClick={() => void create()}
            >
              Criar
            </button>
          </>
        }
      >
        {form ? <CourseFields form={form} setForm={setForm} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
