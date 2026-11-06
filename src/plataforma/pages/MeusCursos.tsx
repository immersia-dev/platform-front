import { Award, Clock, Glasses, GraduationCap, Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { api, type LearningPath } from '../api';
import { courseCover, formatHours, nextLesson, useLoad } from '../format';
import {
  Card,
  ComplianceBadge,
  Empty,
  ErrorState,
  Loading,
  PageTitle,
} from '../ui';

function CourseCard({ path }: { path: LearningPath }) {
  const cover = courseCover(path.course_cover_url);
  const next = nextLesson(path);
  const vrCount = path.lessons.filter((l) => l.type === 'vr_training').length;
  const hasVr = vrCount > 0;
  const done = path.lessons.filter((l) => l.completed_at).length;
  const certified = ['apto', 'a_vencer', 'vencido'].includes(path.status);
  const to = `/app/meus-cursos/${path.enrollment_id}/${path.class_course_id}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:border-cyan-300/30">
      <Link
        to={to}
        className="relative block h-40 overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20">
            <GraduationCap className="h-10 w-10 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0918] via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {hasVr ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Glasses className="h-3.5 w-3.5" />{' '}
              {vrCount > 1 ? `${vrCount} treinamentos VR` : 'VR'}
            </span>
          ) : null}
          {path.workload_hours ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Clock className="h-3.5 w-3.5" />{' '}
              {formatHours(path.workload_hours)}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold leading-snug text-white">
            <Link to={to}>{path.course_title}</Link>
          </h2>
          <ComplianceBadge status={path.status} />
        </div>
        {path.course_description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-white/55">
            {path.course_description}
          </p>
        ) : null}
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
            style={{ width: `${path.completion_percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/45">
          {path.completion_percent}% · {done} de {path.lessons.length} etapas
        </p>
        {next ? (
          <p className="mt-2 text-sm text-white/65">
            Próxima: <span className="text-white">{next.title}</span>
          </p>
        ) : null}
        <div className="mt-auto flex gap-2 pt-5">
          <Link to={to} className="primary-btn flex-1">
            <Play className="h-4 w-4" />{' '}
            {done === 0 ? 'Começar' : next ? 'Continuar' : 'Ver curso'}
          </Link>
          {certified ? (
            <Link
              to={`/app/certificados/${path.enrollment_id}/${path.class_course_id}`}
              className="secondary-btn"
              aria-label="Certificado"
              title="Certificado"
            >
              <Award className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Início do aluno: galeria de cursos, números e o próximo passo. */
/** Início do aluno: só a galeria dos cursos. O desempenho fica em Meu desempenho. */
export default function MeusCursos() {
  const { user } = useAuth();
  const data = useLoad(() => api<LearningPath[]>('/me/learning'), []);
  const [search, setSearch] = useState('');
  const firstName = user?.name.split(' ')[0] ?? '';
  const paths = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const all = data.data ?? [];
    return term
      ? all.filter((p) =>
          p.course_title.toLocaleLowerCase('pt-BR').includes(term)
        )
      : all;
  }, [data.data, search]);

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );

  return (
    <>
      <PageTitle
        title={firstName ? `Olá, ${firstName}` : 'Meus cursos'}
        subtitle={data.data.length ? 'Meus cursos' : undefined}
        actions={
          data.data.length > 3 ? (
            <input
              className="admin-input sm:w-72"
              placeholder="Buscar curso"
              aria-label="Buscar curso"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          ) : null
        }
      />
      {!data.data.length ? (
        <Card>
          <Empty title="Nenhum curso por enquanto">
            Seus cursos aparecem aqui quando você for matriculado em uma turma.
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paths.map((path) => (
            <CourseCard
              key={`${path.enrollment_id}:${path.class_course_id}`}
              path={path}
            />
          ))}
        </div>
      )}
    </>
  );
}
