import {
  Archive,
  BookOpen,
  ChevronRight,
  GraduationCap,
  LifeBuoy,
  Plus,
  Star,
  X,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import {
  api,
  errorText,
  post,
  type Analytics,
  type ClassRisk,
  type ClassSummary,
  type Classroom,
  type User,
} from '../api';
import { Meter, Sparkline, StackedBar } from '../charts';
import {
  complianceColor,
  complianceLabels,
  complianceOrder,
  formatRelative,
  formatScore,
  pct,
  plural,
  riskHelp,
  riskLabels,
  riskPill,
  signalHelp,
  useLoad,
  usePaged,
  useStableHeight,
} from '../format';
import {
  Card,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Kpi,
  Loading,
  Notice,
  PageTitle,
  Pager,
  SearchField,
  Segmented,
} from '../ui';

/** Escolha de um ou mais instrutores (caixas de marcação). */
export function InstructorPicker({
  instructors,
  value,
  onChange,
}: {
  instructors: User[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  if (!instructors.length)
    return (
      <p className="text-sm text-white/50">
        Cadastre um instrutor em Pessoas primeiro.
      </p>
    );
  return (
    <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-white/10 p-2">
      {instructors.map((i) => (
        <label
          key={i.id}
          className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-white/5"
        >
          <input
            type="checkbox"
            checked={value.includes(i.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, i.id]
                  : value.filter((v) => v !== i.id)
              )
            }
          />
          {i.name}
        </label>
      ))}
    </div>
  );
}

type Filter = 'all' | 'attention' | 'bom' | 'sem_dados';
type Sort = 'risk' | 'name' | 'score' | 'activity';
const PAGE = 12; // 3 ou 4 colunas: páginas sempre completas

/** Ordem de leitura: o que exige ação vem primeiro. */
const riskRank: Record<ClassRisk, number> = {
  critico: 0,
  atencao: 1,
  sem_dados: 2,
  bom: 3,
};

const normalize = (text: string) =>
  text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');

function MiniNumber({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="min-w-0" title={title}>
      <p className="truncate text-[11px] text-white/45">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

function ClassCard({
  classroom,
  summary,
  instructorNames,
}: {
  classroom: Classroom;
  summary: ClassSummary | undefined;
  instructorNames: string[];
}) {
  const risk: ClassRisk = summary?.risk ?? 'sem_dados';
  const slices = complianceOrder.map((key) => ({
    key,
    label: complianceLabels[key],
    value: summary?.status_counts[key] ?? 0,
    color: complianceColor[key],
  }));
  const learners = summary?.learners ?? 0;
  return (
    <Link
      to={`/app/turmas/${classroom.id}`}
      className="p-card flex flex-col gap-4 transition hover:border-cyan-300/25 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">
            {classroom.name}
          </h2>
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-white/50"
            title="Instrutores"
          >
            <UsersRound className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {instructorNames.join(', ') || '—'}
            </span>
          </p>
          <p
            className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50"
            title="Cursos"
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {summary?.courses.join(', ') || 'Sem curso'}
            </span>
          </p>
        </div>
        <span className={`${riskPill[risk]} shrink-0`} title={riskHelp[risk]}>
          {riskLabels[risk]}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <MiniNumber
          label="Participação"
          value={pct(summary?.participation)}
          title="Alunos que treinaram no VR nos últimos 90 dias"
        />
        <MiniNumber
          label="Média"
          value={formatScore(summary?.avg_score)}
          title="Nota média no VR (0 a 100)"
        />
        <MiniNumber
          label="Aprovação"
          value={pct(summary?.pass_rate)}
          title="Tentativas que atingiram o critério"
        />
        <MiniNumber
          label="Aptos"
          value={summary?.paths ? `${summary.apto}/${summary.paths}` : '—'}
          title="Aluno × curso aptos"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-white/50">Progresso médio</span>
          <span className="tabular-nums text-white/75">
            {summary?.paths ? `${summary.completion_percent}%` : '—'}
          </span>
        </div>
        <Meter
          value={summary?.completion_percent ?? 0}
          tone={(summary?.completion_percent ?? 0) >= 80 ? 'ok' : 'cyan'}
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs text-white/50">
          Situação · {plural(learners, 'aluno', 'alunos')}
        </p>
        {summary?.paths ? (
          <StackedBar slices={slices} legend />
        ) : (
          <p className="text-xs text-white/35">Nenhum aluno com curso.</p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3">
        <div className="min-w-0 space-y-1 text-xs">
          <p className="text-white/45">
            Última atividade{' '}
            <span className="text-white/75">
              {formatRelative(summary?.last_attempt_at)}
            </span>
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {summary?.need_support ? (
              <span className="text-rose-200" title={signalHelp.reforco}>
                {summary.need_support} em reforço
              </span>
            ) : null}
            {summary?.no_attempt ? (
              <span className="text-white/55" title={signalHelp.sem_tentativa}>
                {summary.no_attempt} sem tentativa
              </span>
            ) : null}
            {summary?.learners &&
            !summary.need_support &&
            !summary.no_attempt ? (
              <span className="text-emerald-200/80">Todos treinaram</span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0" title="Nota média semanal (8 semanas)">
          <Sparkline values={(summary?.weekly ?? []).map((w) => w.avg_score)} />
        </div>
      </div>
    </Link>
  );
}

export default function Turmas() {
  const { user } = useAuth();
  const manager = user?.role === 'org_admin';
  const data = useLoad(async () => {
    const [classes, people, analytics] = await Promise.all([
      api<Classroom[]>('/classes'),
      api<User[]>('/users'),
      api<Analytics>('/analytics?days=90').catch(() => null),
    ]);
    return { classes, people, analytics };
  }, []);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [course, setCourse] = useState('');
  const [instructor, setInstructor] = useState('');
  const [sort, setSort] = useState<Sort>('activity');

  async function create() {
    setError('');
    try {
      await post('/classes', {
        company_id: user?.organizationId,
        name,
        instructor_ids: chosen,
      });
      setCreating(false);
      setName('');
      setChosen([]);
      void data.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  // tudo o que a lista precisa vem antes dos retornos de carregamento (a paginação é um hook)
  const view = useMemo(() => {
    const { classes = [], people = [], analytics = null } = data.data ?? {};
    const names = new Map(people.map((p) => [p.id, p.name]));
    const summaries = new Map(
      (analytics?.classes ?? []).map((c) => [c.class_id, c])
    );
    const riskOf = (c: Classroom) => summaries.get(c.id)?.risk ?? 'sem_dados';
    const needsAttention = (c: Classroom) =>
      ['critico', 'atencao'].includes(riskOf(c));
    const instructorsOf = (c: Classroom) =>
      summaries.get(c.id)?.instructor_names ??
      c.instructor_ids.map((i) => names.get(i) ?? '—');
    const coursesOf = (c: Classroom) => summaries.get(c.id)?.courses ?? [];
    const active = classes.filter((c) => !c.archived_at);
    const needle = normalize(query.trim());
    const matchesFilter = (c: Classroom) =>
      filter === 'all' ||
      (filter === 'attention' ? needsAttention(c) : riskOf(c) === filter);
    const visible = active
      .filter(
        (c) =>
          !needle ||
          normalize(
            `${c.name} ${instructorsOf(c).join(' ')} ${coursesOf(c).join(' ')}`
          ).includes(needle)
      )
      .filter(matchesFilter)
      .filter((c) => !course || coursesOf(c).includes(course))
      .filter((c) => !instructor || c.instructor_ids.includes(instructor))
      .sort((a, b) => {
        const byName = a.name.localeCompare(b.name, 'pt-BR');
        const sa = summaries.get(a.id);
        const sb = summaries.get(b.id);
        if (sort === 'name') return byName;
        if (sort === 'score')
          return (sb?.avg_score ?? -1) - (sa?.avg_score ?? -1) || byName;
        if (sort === 'activity')
          return (
            (sb?.last_attempt_at ?? '').localeCompare(
              sa?.last_attempt_at ?? ''
            ) || byName
          );
        return riskRank[riskOf(a)] - riskRank[riskOf(b)] || byName;
      });
    const count = (f: Filter) =>
      f === 'all'
        ? active.length
        : active.filter(
            f === 'attention' ? needsAttention : (c) => riskOf(c) === f
          ).length;
    return {
      names,
      summaries,
      active,
      visible,
      count,
      instructorsOf,
      archived: classes.filter((c) => c.archived_at),
      courseOptions: [...new Set(active.flatMap(coursesOf))].sort((x, y) =>
        x.localeCompare(y, 'pt-BR')
      ),
      instructorOptions: people
        .filter(
          (p) =>
            p.role === 'instructor' &&
            active.some((c) => c.instructor_ids.includes(p.id))
        )
        .sort((x, y) => x.name.localeCompare(y.name, 'pt-BR')),
    };
  }, [data.data, query, filter, course, instructor, sort]);
  const filterKey = `${query}|${filter}|${course}|${instructor}|${sort}`;
  const paged = usePaged(view.visible, PAGE, filterKey);
  const stableGrid = useStableHeight(data.data);
  const filtering = Boolean(query || filter !== 'all' || course || instructor);
  const clear = () => {
    setQuery('');
    setFilter('all');
    setCourse('');
    setInstructor('');
  };

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const { people, analytics } = data.data;
  const { names, summaries, active, visible, archived, count } = view;
  const instructors = people.filter((p) => p.role === 'instructor' && p.active);
  const attention = count('attention');
  const k = analytics?.kpis;

  return (
    <>
      <PageTitle
        title={manager ? 'Turmas' : 'Minhas turmas'}
        subtitle="Últimos 90 dias"
        actions={
          manager ? (
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              onClick={() => setCreating(true)}
            >
              <Plus className="h-4 w-4" /> Nova turma
            </button>
          ) : null
        }
      />

      {active.length ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={UsersRound}
            label="Turmas"
            value={active.length}
            hint={
              attention
                ? `${attention} ${attention === 1 ? 'pede' : 'pedem'} atenção`
                : 'Nenhuma em atenção'
            }
            tone={attention ? 'warn' : undefined}
          />
          <Kpi
            icon={GraduationCap}
            label="Alunos"
            value={k?.learners ?? '—'}
            hint={
              k
                ? `${k.active_learners} treinaram · ${pct(k.participation)}`
                : undefined
            }
          />
          <Kpi
            icon={Star}
            label="Média geral"
            value={formatScore(k?.avg_score)}
            hint={k ? `${pct(k.pass_rate)} no critério` : undefined}
            help="Nota média das tentativas no VR (0 a 100)"
          />
          <Kpi
            icon={LifeBuoy}
            label="Precisam de reforço"
            value={k?.need_support ?? '—'}
            tone={k?.need_support ? 'bad' : 'ok'}
            hint={k?.no_attempt ? `${k.no_attempt} sem tentativa` : 'Alunos'}
            help={signalHelp.reforco}
          />
        </div>
      ) : null}

      {active.length ? (
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Buscar turma, instrutor ou curso"
              className="w-full lg:w-80"
            />
            <div className="overflow-x-auto">
              <Segmented<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: `Todas ${count('all')}` },
                  {
                    value: 'attention',
                    label: `Precisam de atenção ${attention}`,
                  },
                  { value: 'bom', label: `Saudáveis ${count('bom')}` },
                  {
                    value: 'sem_dados',
                    label: `Sem dados ${count('sem_dados')}`,
                  },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {view.courseOptions.length > 1 ? (
              <select
                className="admin-select sm:w-64"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                aria-label="Curso"
              >
                <option value="">Todos os cursos</option>
                {view.courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
            {manager && view.instructorOptions.length > 1 ? (
              <select
                className="admin-select sm:w-56"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                aria-label="Instrutor"
              >
                <option value="">Todos os instrutores</option>
                {view.instructorOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              className="admin-select sm:w-56"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Ordenar"
            >
              <option value="activity">Ordenar: atividade recente</option>
              <option value="risk">Ordenar: situação</option>
              <option value="name">Ordenar: nome</option>
              <option value="score">Ordenar: maior média</option>
            </select>
            <span className="text-xs text-white/45 sm:ml-auto">
              {plural(visible.length, 'turma', 'turmas')}
              {filtering ? ` de ${active.length}` : ''}
            </span>
            {filtering ? (
              <button type="button" className="p-action" onClick={clear}>
                <X className="h-3.5 w-3.5" /> Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!active.length ? (
        <Card>
          <Empty title="Nenhuma turma">
            {manager
              ? 'Crie a primeira turma e matricule os alunos.'
              : 'O gestor ainda não colocou você em uma turma.'}
          </Empty>
        </Card>
      ) : (
        <div ref={stableGrid}>
          {!visible.length ? (
            <Card>
              <Empty title="Nenhuma turma encontrada">
                <button type="button" className="p-action mt-1" onClick={clear}>
                  Limpar filtros
                </button>
              </Empty>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
              {paged.items.map((c) => (
                <ClassCard
                  key={c.id}
                  classroom={c}
                  summary={summaries.get(c.id)}
                  instructorNames={view.instructorsOf(c)}
                />
              ))}
            </div>
          )}
          {paged.pages > 1 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <Pager {...paged} noun="turmas" />
            </div>
          ) : null}
        </div>
      )}

      {archived.length ? (
        <details className="group mt-8">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-white/45 hover:text-white/70">
            <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
            <Archive className="h-4 w-4" />
            {plural(archived.length, 'turma arquivada', 'turmas arquivadas')}
          </summary>
          <ul className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {archived.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/app/turmas/${c.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-white/55 hover:text-white"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="hidden shrink-0 text-xs text-white/35 sm:inline">
                    {c.instructor_ids
                      .map((i) => names.get(i) ?? '—')
                      .join(', ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Dialog
        open={creating}
        title="Nova turma"
        onClose={() => setCreating(false)}
        footer={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setCreating(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              disabled={!name.trim() || !chosen.length}
              onClick={() => void create()}
            >
              Criar
            </button>
          </>
        }
      >
        <Field label="Nome">
          <input
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Brigada · turno A"
          />
        </Field>
        <Field label="Instrutores">
          <InstructorPicker
            instructors={instructors}
            value={chosen}
            onChange={setChosen}
          />
        </Field>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
