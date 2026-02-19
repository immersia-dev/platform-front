import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Trophy,
  Clock3,
  CheckCircle2,
  Target,
  Zap,
  User,
  Mail,
  Building2,
} from 'lucide-react';

import { mockStudents, avgOf } from '../mocks/students';

// ─── Cores ───────────────────────────────────────────────
const CYAN = '#2ac6ff';
const VIOLET = '#7c3aed';
const EMERALD = '#34d399';
const ROSE = '#fb7185';
const AMBER = '#fbbf24';
const CHART_COLORS = [CYAN, VIOLET, '#a855f7', EMERALD, ROSE, AMBER];

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

// ─── Info pill ───────────────────────────────────────────
function InfoPill({
  icon: Icon,
  label,
  value,
  accent = CYAN,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="glass-surface flex items-center gap-4 p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}20` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
          {label}
        </p>
        <p className="text-lg font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────
export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const student = useMemo(
    () => mockStudents.find((s) => s.id === studentId),
    [studentId],
  );

  // se não encontrar, volta
  if (!student) {
    return (
      <main className="immersia-bg flex min-h-screen items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Aluno não encontrado</p>
          <button
            onClick={() => navigate('/instructor')}
            className="primary-btn mt-4 max-w-xs"
          >
            Voltar ao dashboard
          </button>
        </div>
      </main>
    );
  }

  const { sessions } = student;

  // KPIs individuais
  const avgScore = Math.round(avgOf(sessions.map((s) => s.score)));
  const avgAccuracy = Math.round(avgOf(sessions.map((s) => s.accuracy)));
  const avgDuration = Math.round(
    avgOf(sessions.map((s) => s.durationMinutes)),
  );
  const avgResponse = avgOf(
    sessions.map((s) => s.avgResponseTimeSec),
  ).toFixed(1);
  const completedCount = sessions.filter((s) => s.completed).length;
  const completionPct = Math.round((completedCount / sessions.length) * 100);

  // ── Gráfico: nota por treinamento (bar) ────────────────
  const scoreByTraining = sessions.map((s) => ({
    name:
      s.trainingTitle.length > 22
        ? s.trainingTitle.slice(0, 22) + '…'
        : s.trainingTitle,
    score: s.score,
  }));

  // ── Gráfico: evolução nota (area) ──────────────────────
  const scoreTimeline = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date.slice(5),
      Nota: s.score,
    }));

  // ── Gráfico: radar métricas ────────────────────────────
  const radarData = sessions.map((s) => ({
    training:
      s.trainingTitle.length > 18
        ? s.trainingTitle.slice(0, 18) + '…'
        : s.trainingTitle,
    Nota: s.score,
    Acurácia: s.accuracy,
    'Tempo Resp.': Math.round((1 - s.avgResponseTimeSec / 10) * 100), // invertido p/ radar
  }));

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="topbar">
        <div className="container-page flex h-16 items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/instructor')}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </header>

      <section className="container-page pb-16 pt-10">
        {/* ── Cabeçalho do aluno ──────────────────────── */}
        <div className="glass-surface p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {student.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {student.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {student.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {sessions.length} sessão(ões)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={[
                  'chip text-sm font-semibold',
                  avgScore >= 80
                    ? 'chip-success'
                    : avgScore >= 60
                      ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                      : 'border-rose-300/20 bg-rose-400/10 text-rose-200',
                ].join(' ')}
              >
                Nota média: {avgScore}
              </span>
            </div>
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────── */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <InfoPill
            icon={Trophy}
            label="Nota Média"
            value={avgScore}
            accent={VIOLET}
          />
          <InfoPill
            icon={Target}
            label="Acurácia"
            value={`${avgAccuracy}%`}
            accent={CYAN}
          />
          <InfoPill
            icon={Clock3}
            label="Duração Média"
            value={`${avgDuration} min`}
            accent={AMBER}
          />
          <InfoPill
            icon={Zap}
            label="Tempo Resposta"
            value={`${avgResponse}s`}
            accent={ROSE}
          />
          <InfoPill
            icon={CheckCircle2}
            label="Conclusão"
            value={`${completionPct}%`}
            accent={EMERALD}
          />
        </div>

        {/* ── Gráficos ────────────────────────────────── */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Nota por treinamento */}
          <div className="glass-surface p-6">
            <h2 className="mb-4 text-sm font-semibold">
              Nota por Treinamento
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreByTraining}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="score" name="Nota" radius={[8, 8, 0, 0]}>
                  {scoreByTraining.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evolução da nota */}
          <div className="glass-surface p-6">
            <h2 className="mb-4 text-sm font-semibold">
              Evolução da Nota
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={scoreTimeline}>
                <defs>
                  <linearGradient
                    id="gradStudent"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={VIOLET} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
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
                  dataKey="Nota"
                  stroke={VIOLET}
                  strokeWidth={2}
                  fill="url(#gradStudent)"
                  dot={{ fill: VIOLET, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        {radarData.length >= 3 && (
          <div className="mt-6 glass-surface p-6">
            <h2 className="mb-4 text-sm font-semibold">
              Radar de Desempenho por Treinamento
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="training"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <Radar
                  name="Nota"
                  dataKey="Nota"
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
                <Radar
                  name="Tempo Resposta"
                  dataKey="Tempo Resp."
                  stroke={EMERALD}
                  fill={EMERALD}
                  fillOpacity={0.15}
                />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Histórico de sessões ─────────────────────── */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Histórico de Sessões</h2>

          <div className="glass-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                    <th className="px-6 py-4">Treinamento</th>
                    <th className="px-6 py-4">Módulo</th>
                    <th className="px-6 py-4 text-center">Data</th>
                    <th className="px-6 py-4 text-center">Duração</th>
                    <th className="px-6 py-4 text-center">Acertos</th>
                    <th className="px-6 py-4 text-center">Acurácia</th>
                    <th className="px-6 py-4 text-center">Tempo Resp.</th>
                    <th className="px-6 py-4 text-center">Nota</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sessions]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-white/5 transition hover:bg-white/5"
                      >
                        <td className="px-6 py-4 font-medium">
                          {s.trainingTitle}
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {s.module}
                        </td>
                        <td className="px-6 py-4 text-center text-white/70">
                          {new Date(s.date + 'T00:00:00').toLocaleDateString(
                            'pt-BR',
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.durationMinutes} min
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.correctAnswers}/{s.totalQuestions}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.accuracy}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.avgResponseTimeSec.toFixed(1)}s
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={[
                              'font-semibold',
                              s.score >= 80
                                ? 'text-emerald-300'
                                : s.score >= 60
                                  ? 'text-amber-300'
                                  : 'text-rose-300',
                            ].join(' ')}
                          >
                            {s.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={[
                              'chip text-xs',
                              s.completed ? 'chip-success' : 'chip-muted',
                            ].join(' ')}
                          >
                            {s.completed ? 'Concluído' : 'Pendente'}
                          </span>
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
