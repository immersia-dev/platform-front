import {
  BookOpenText,
  CheckCircle2,
  Clock,
  Glasses,
  ListChecks,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { api, type CatalogCourse } from '../api';
import {
  courseCover,
  formatHours,
  formatMinutes,
  plural,
  useLoad,
  validityText,
} from '../format';
import {
  Dialog,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageTitle,
  SearchField,
} from '../ui';

function contents(c: CatalogCourse) {
  return [
    c.materials ? plural(c.materials, 'material', 'materiais') : null,
    c.quizzes ? plural(c.quizzes, 'quiz', 'quizzes') : null,
    c.vr_trainings
      ? plural(c.vr_trainings, 'treinamento VR', 'treinamentos VR')
      : null,
  ].filter(Boolean) as string[];
}

function CourseCard({
  course: c,
  onOpen,
}: {
  course: CatalogCourse;
  onOpen: () => void;
}) {
  const cover = courseCover(c.cover_url);
  const body = (
    <>
      <div className="relative h-40 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20">
            <BookOpenText className="h-10 w-10 text-white/45" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0918] via-[#0b0918]/20 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {c.released ? (
            <span className="chip-overlay">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Na sua
              organização
            </span>
          ) : null}
          {c.vr_trainings ? (
            <span className="chip-overlay">
              <Glasses className="h-3.5 w-3.5" /> VR
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug text-white">
          {c.title}
        </h3>
        {c.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/60">
            {c.description}
          </p>
        ) : null}
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
          {c.workload_hours ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatHours(c.workload_hours)}
            </span>
          ) : null}
          {contents(c).length ? (
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" /> {contents(c).join(' · ')}
            </span>
          ) : null}
        </p>
        <div className="mt-auto pt-5">
          <span
            className={`p-action ${c.released ? '' : 'p-action-accent'}`}
            aria-hidden="true"
          >
            {c.released ? 'Ver curso' : 'Conhecer o curso'}
          </span>
        </div>
      </div>
    </>
  );
  const className =
    'group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-left transition hover:border-cyan-300/30';
  return c.released ? (
    <Link to={`/app/cursos/${c.id}`} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" className={className} onClick={onOpen}>
      {body}
    </button>
  );
}

function CourseDialog({
  course: c,
  onClose,
}: {
  course: CatalogCourse;
  onClose: () => void;
}) {
  const facts: [string, string][] = [
    ['Carga horária', formatHours(c.workload_hours)],
    ['Validade', validityText(c)],
    ['Etapas', contents(c).join(' · ') || '—'],
    ['Tempo estimado', c.minutes ? formatMinutes(c.minutes) : '—'],
  ];

  return (
    <Dialog
      open
      wide
      title={c.title}
      onClose={onClose}
      footer={
        <button type="button" className="secondary-btn" onClick={onClose}>
          Fechar
        </button>
      }
    >
      {c.description ? (
        <p className="text-sm leading-relaxed text-white/70">{c.description}</p>
      ) : null}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white/[0.04] px-3 py-2.5">
            <dt className="text-[11px] text-white/45">{k}</dt>
            <dd className="mt-0.5 text-sm text-white">{v}</dd>
          </div>
        ))}
      </dl>
      {c.syllabus ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
            Conteúdo programático
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/70">
            {c.syllabus}
          </p>
        </div>
      ) : null}
      <Notice>
        Este curso ainda não faz parte do plano da sua organização. Para
        contratá-lo, fale com a equipe Immersia.
      </Notice>
    </Dialog>
  );
}

/** Gestor: o catálogo Immersia, com os cursos da organização e os disponíveis para contratar. */
export default function Catalogo() {
  const { user } = useAuth();
  const data = useLoad(() => api<CatalogCourse[]>('/catalog'), []);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return (data.data ?? []).filter(
      (c) =>
        !q ||
        `${c.title} ${c.description ?? ''} ${c.syllabus ?? ''}`
          .toLocaleLowerCase('pt-BR')
          .includes(q)
    );
  }, [data.data, query]);
  const mine = list.filter((c) => c.released);
  const available = list.filter((c) => !c.released);
  const opened = data.data?.find((c) => c.id === openId) ?? null;

  const grid = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4';

  return (
    <>
      <PageTitle
        title="Cursos"
        subtitle={`Catálogo Immersia${user?.organizationName ? ` · ${user.organizationName}` : ''}`}
        actions={
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Buscar curso"
            className="w-full sm:w-72"
          />
        }
      />
      {data.loading && !data.data ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={() => void data.reload()} />
      ) : (
        <div className="space-y-9">
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/55">
                Na sua organização
              </h2>
              <span className="text-xs text-white/40">
                {plural(mine.length, 'curso', 'cursos')}
              </span>
            </div>
            {mine.length ? (
              <div className={grid}>
                {mine.map((c) => (
                  <CourseCard key={c.id} course={c} onOpen={() => {}} />
                ))}
              </div>
            ) : (
              <section className="p-card">
                <Empty
                  title={
                    query ? 'Nenhum curso encontrado' : 'Nenhum curso ainda'
                  }
                >
                  {query
                    ? undefined
                    : 'Fale com a equipe Immersia para contratar um curso.'}
                </Empty>
              </section>
            )}
          </section>

          <section>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/55">
                Disponíveis para contratar
              </h2>
              <span className="text-xs text-white/40">
                {plural(available.length, 'curso', 'cursos')}
              </span>
            </div>
            <p className="mb-4 text-sm text-white/50">
              Cursos do catálogo Immersia que a sua organização ainda não tem.
              Para contratar, fale com a equipe Immersia.
            </p>
            {available.length ? (
              <div className={grid}>
                {available.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    onOpen={() => setOpenId(c.id)}
                  />
                ))}
              </div>
            ) : (
              <section className="p-card">
                <Empty
                  title={
                    query
                      ? 'Nenhum curso encontrado'
                      : 'Sua organização já tem todo o catálogo'
                  }
                />
              </section>
            )}
          </section>
        </div>
      )}

      {opened ? (
        <CourseDialog course={opened} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  );
}
