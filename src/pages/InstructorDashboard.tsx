import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  Trophy,
  Clock3,
  CheckCircle2,
  LogOut,
  ChevronRight,
  BarChart3,
  Target,
  Zap,
  TrendingUp,
} from 'lucide-react';

import {
  mockStudents,
  allSessions,
  completedSessions,
  avgOf,
  studentAvgScore,
  studentCompletionRate,
} from '../mocks/students';

// ─── Cores do tema ───────────────────────────────────────
const CYAN = '#2ac6ff';
const VIOLET = '#7c3aed';
const PURPLE = '#a855f7';
const EMERALD = '#34d399';
const ROSE = '#fb7185';
const AMBER = '#fbbf24';
const PIE_COLORS = [EMERALD, ROSE, AMBER, CYAN];
const CHART_COLORS = [CYAN, VIOLET, PURPLE, EMERALD, ROSE, AMBER];

// ─── Custom Tooltip ──────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/15 bg-black/80 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-xl">
      {label && <p className="mb-1 font-medium text-white/70">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}:{' '}
          <span className="font-semibold">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = CYAN,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="glass-surface flex items-center gap-5 p-6" enable-xr>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${accent}20` }}
      >
        <Icon className="h-6 w-6" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-white/55">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-white/50">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────
export default function InstructorDashboard() {
  const navigate = useNavigate();

  // ── Dados agregados ────────────────────────────────────
  const sessions = useMemo(() => allSessions(), []);
  const completed = useMemo(() => completedSessions(), []);

  const totalStudents = mockStudents.length;
  const totalSessions = sessions.length;
  const completionRate = Math.round(
    (completed.length / totalSessions) * 100,
  );
  const globalAvgScore = Math.round(avgOf(sessions.map((s) => s.score)));
  const globalAvgDuration = Math.round(
    avgOf(sessions.map((s) => s.durationMinutes)),
  );
  const globalAvgResponse = avgOf(
    sessions.map((s) => s.avgResponseTimeSec),
  ).toFixed(1);

  // ── Gráfico: nota média por aluno (bar) ────────────────
  const scoreByStudent = useMemo(
    () =>
      mockStudents
        .map((s) => ({
          name: s.name.split(' ').slice(0, 2).join(' '),
          score: Math.round(studentAvgScore(s)),
        }))
        .sort((a, b) => b.score - a.score),
    [],
  );

  // ── Gráfico: sessões por dia (line) ────────────────────
  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      map[s.date] = (map[s.date] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        sessões: count,
      }));
  }, [sessions]);

  // ── Gráfico: distribuição por módulo (pie) ─────────────
  const byModule = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      map[s.module] = (map[s.module] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  // ── Gráfico: status concluído vs pendente (pie) ────────
  const statusPie = useMemo(() => {
    const done = sessions.filter((s) => s.completed).length;
    return [
      { name: 'Concluído', value: done },
      { name: 'Pendente', value: sessions.length - done },
    ];
  }, [sessions]);

  // ── Gráfico: radar de métricas por módulo ──────────────
  const radarData = useMemo(() => {
    const modules = [...new Set(sessions.map((s) => s.module))];
    return modules.map((mod) => {
      const modSessions = sessions.filter((s) => s.module === mod);
      return {
        module: mod,
        'Nota Média': Math.round(avgOf(modSessions.map((s) => s.score))),
        Acurácia: Math.round(avgOf(modSessions.map((s) => s.accuracy))),
        'Tempo Resp. (s)': Number(
          avgOf(modSessions.map((s) => s.avgResponseTimeSec)).toFixed(1),
        ),
      };
    });
  }, [sessions]);

  // ── Gráfico: evolução de score ao longo do tempo (area)
  const scoreOverTime = useMemo(() => {
    const sorted = [...sessions].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const map: Record<string, { total: number; count: number }> = {};
    sorted.forEach((s) => {
      if (!map[s.date]) map[s.date] = { total: 0, count: 0 };
      map[s.date].total += s.score;
      map[s.date].count += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count }]) => ({
        date: date.slice(5),
        'Nota Média': Math.round(total / count),
      }));
  }, [sessions]);

  // ── Tabela de alunos ───────────────────────────────────
  const studentRows = useMemo(
    () =>
      mockStudents.map((s) => ({
        ...s,
        avgScore: Math.round(studentAvgScore(s)),
        completion: Math.round(studentCompletionRate(s)),
        totalSessions: s.sessions.length,
      })),
    [],
  );

  function logout() {
    navigate('/');
  }

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="topbar" enable-xr>
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-semibold tracking-tight">
              Dashboard do Instrutor
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="chip hover:bg-white/15 transition"
          >
            <LogOut className="h-4 w-4 text-white/70" />
            Sair
          </button>
        </div>
      </header>

      {/* ── Conteúdo ───────────────────────────────────── */}
      <section className="container-page pb-16 pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="mt-2 text-sm text-white/60">
          Acompanhe o desempenho dos alunos nos treinamentos de segurança
          operacional em VR.
        </p>

        {/* KPIs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Users}
            label="Alunos"
            value={totalStudents}
            sub={`${totalSessions} sessões realizadas`}
            accent={CYAN}
          />
          <KpiCard
            icon={Trophy}
            label="Nota Média Global"
            value={globalAvgScore}
            sub="de 100 pontos"
            accent={VIOLET}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Taxa de Conclusão"
            value={`${completionRate}%`}
            sub={`${completed.length}/${totalSessions} sessões`}
            accent={EMERALD}
          />
          <KpiCard
            icon={Clock3}
            label="Duração Média"
            value={`${globalAvgDuration} min`}
            sub={`Resp. média: ${globalAvgResponse}s`}
            accent={AMBER}
          />
        </div>

        {/* ── Linha 1: Bar + Line ─────────────────────── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Nota média por aluno */}
          <div className="glass-surface p-6" enable-xr>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-semibold">Nota Média por Aluno</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scoreByStudent} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="score" name="Nota" radius={[0, 8, 8, 0]}>
                  {scoreByStudent.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sessões por dia */}
          <div className="glass-surface p-6" enable-xr>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold">Sessões por Dia</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={sessionsByDate}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="sessões"
                  name="Sessões"
                  stroke={CYAN}
                  strokeWidth={2}
                  dot={{ fill: CYAN, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Linha 2: Pie status + Pie módulos + Radar ── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Status */}
          <div className="glass-surface p-6" enable-xr>
            <h2 className="mb-4 text-sm font-semibold">Status das Sessões</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {statusPie.map((_, i) => (
                    <Cell
                      key={`status-${i}`}
                      fill={i === 0 ? EMERALD : ROSE}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Módulos */}
          <div className="glass-surface p-6" enable-xr>
            <h2 className="mb-4 text-sm font-semibold">
              Sessões por Módulo
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byModule}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {byModule.map((_, i) => (
                    <Cell
                      key={`mod-${i}`}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="glass-surface p-6" enable-xr>
            <h2 className="mb-4 text-sm font-semibold">
              Métricas por Módulo
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="module"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <Radar
                  name="Nota Média"
                  dataKey="Nota Média"
                  stroke={VIOLET}
                  fill={VIOLET}
                  fillOpacity={0.3}
                />
                <Radar
                  name="Acurácia"
                  dataKey="Acurácia"
                  stroke={CYAN}
                  fill={CYAN}
                  fillOpacity={0.2}
                />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Linha 3: Area evolução de nota ──────────── */}
        <div className="mt-6 glass-surface p-6" enable-xr>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold">
              Evolução da Nota Média ao Longo do Tempo
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={scoreOverTime}>
              <defs>
                <linearGradient
                  id="gradientScore"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="Nota Média"
                stroke={VIOLET}
                strokeWidth={2}
                fill="url(#gradientScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Tabela de alunos ────────────────────────── */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Alunos</h2>

          <div className="glass-surface overflow-hidden" enable-xr>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-6 py-4">Depto.</th>
                    <th className="px-6 py-4 text-center">Sessões</th>
                    <th className="px-6 py-4 text-center">Nota Média</th>
                    <th className="px-6 py-4 text-center">Conclusão</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 transition hover:bg-white/5 cursor-pointer"
                      onClick={() =>
                        navigate(`/instructor/student/${s.id}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-white/50">{s.email}</p>
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {s.department}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.totalSessions}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={[
                            'font-semibold',
                            s.avgScore >= 80
                              ? 'text-emerald-300'
                              : s.avgScore >= 60
                                ? 'text-amber-300'
                                : 'text-rose-300',
                          ].join(' ')}
                        >
                          {s.avgScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={[
                            'font-semibold',
                            s.completion === 100
                              ? 'text-emerald-300'
                              : 'text-amber-300',
                          ].join(' ')}
                        >
                          {s.completion}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="inline h-4 w-4 text-white/40" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
