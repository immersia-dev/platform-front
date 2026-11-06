import { useEffect, useState, type ReactNode } from 'react';

// Gráficos das telas de acompanhamento: uma série por gráfico (nunca dois eixos), marcas finas,
// grade discreta e dica ao passar o mouse ou tocar.

export type ChartPoint = {
  label: string;
  value: number | null;
  detail?: ReactNode;
};

const DEFAULT_W = 640;

/** Largura real do gráfico em px: o texto fica sempre do mesmo tamanho, em cartão largo ou estreito. */
function useWidth() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_W);
  useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width)))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return [setEl, width] as const;
}
const PAD = { top: 18, right: 16, bottom: 26, left: 30 };

function labelEvery(n: number) {
  return n <= 8 ? 1 : Math.ceil(n / 7);
}

function Tooltip({
  x,
  width: W,
  children,
}: {
  x: number;
  width: number;
  children: ReactNode;
}) {
  const left = Math.min(88, Math.max(12, (x / W) * 100));
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0d0b1d]/95 px-3 py-2 text-xs text-white/80 shadow-xl"
      style={{ left: `${left}%` }}
      role="status"
    >
      {children}
    </div>
  );
}

/** Nota (0 a 100) ao longo do tempo, com a linha do mínimo do treinamento. */
export function ScoreLine({
  points,
  reference,
  height = 220,
  empty = 'Sem tentativas no período.',
}: {
  points: ChartPoint[];
  reference?: number | null;
  height?: number;
  empty?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth();
  if (!points.some((p) => p.value != null))
    return (
      <div ref={box}>
        <p className="py-8 text-center text-sm text-white/45">{empty}</p>
      </div>
    );
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const x = (i: number) =>
    PAD.left + (points.length > 1 ? step * i : innerW / 2);
  const y = (v: number) =>
    PAD.top + innerH * (1 - Math.max(0, Math.min(100, v)) / 100);
  const every = labelEvery(points.length);

  // a linha liga os períodos com tentativa (os vazios aparecem nas barras de tentativas)
  const line = points
    .flatMap((p, i) => (p.value == null ? [] : [`${x(i)},${y(p.value)}`]))
    .join(' ');
  const segments = line ? [line] : [];
  const lastIndex = points.map((p) => p.value != null).lastIndexOf(true);
  const active = hover != null ? points[hover] : null;

  return (
    <div ref={box} className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Nota média ao longo do tempo"
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="rgba(255,255,255,0.07)"
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgba(255,255,255,0.4)"
            >
              {v}
            </text>
          </g>
        ))}
        {reference != null ? (
          <g>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(reference)}
              y2={y(reference)}
              stroke="rgba(252,211,77,0.55)"
              strokeDasharray="5 5"
            />
            <text
              x={PAD.left + 6}
              y={y(reference) - 6}
              textAnchor="start"
              fontSize="11"
              fill="rgba(252,211,77,0.85)"
            >
              mínimo {reference}
            </text>
          </g>
        ) : null}
        {hover != null ? (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="rgba(255,255,255,0.18)"
          />
        ) : null}
        {segments.map((d) => (
          <polyline
            key={d}
            points={d}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {points.map((p, i) =>
          p.value != null ? (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={hover === i ? 5.5 : 4}
              fill="#22d3ee"
              stroke="#0d0b1d"
              strokeWidth="2"
            />
          ) : null
        )}
        {lastIndex >= 0 && hover == null ? (
          <text
            x={x(lastIndex)}
            y={y(points[lastIndex].value ?? 0) - 10}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#fff"
          >
            {Math.round(points[lastIndex].value ?? 0)}
          </text>
        ) : null}
        {points.map((p, i) =>
          i % every === 0 || i === points.length - 1 ? (
            <text
              key={`l${i}`}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(255,255,255,0.4)"
            >
              {p.label}
            </text>
          ) : null
        )}
        {points.map((_, i) => (
          <rect
            key={`h${i}`}
            x={x(i) - Math.max(step, 24) / 2}
            y={0}
            width={Math.max(step, 24)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
          />
        ))}
      </svg>
      {active && hover != null ? (
        <Tooltip width={W} x={x(hover)}>
          <p className="font-medium text-white">{active.label}</p>
          {active.detail ?? (
            <p>
              {active.value != null
                ? `Nota ${Math.round(active.value)}`
                : 'Sem tentativa'}
            </p>
          )}
        </Tooltip>
      ) : null}
    </div>
  );
}

/** Contagem por período (ex.: tentativas por dia). */
export function CountBars({
  points,
  height = 120,
  unit = 'tentativas',
}: {
  points: ChartPoint[];
  height?: number;
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth();
  const max = Math.max(1, ...points.map((p) => p.value ?? 0));
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - 8 - PAD.bottom;
  const slot = innerW / Math.max(1, points.length);
  const bar = Math.max(2, Math.min(28, slot - 2));
  const every = labelEvery(points.length);
  const active = hover != null ? points[hover] : null;
  return (
    <div ref={box} className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${unit} por período`}
      >
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={8 + innerH}
          y2={8 + innerH}
          stroke="rgba(255,255,255,0.1)"
        />
        {points.map((p, i) => {
          const h = ((p.value ?? 0) / max) * innerH;
          const cx = PAD.left + slot * i + slot / 2;
          return (
            <g key={i}>
              {h > 0 ? (
                <path
                  d={`M${cx - bar / 2},${8 + innerH} v${-(h - Math.min(4, h / 2))} q0,${-Math.min(4, h / 2)} ${Math.min(4, bar / 2)},${-Math.min(4, h / 2)} h${bar - 2 * Math.min(4, bar / 2)} q${Math.min(4, bar / 2)},0 ${Math.min(4, bar / 2)},${Math.min(4, h / 2)} v${h - Math.min(4, h / 2)} z`}
                  fill={hover === i ? '#a78bfa' : 'rgba(167,139,250,0.7)'}
                />
              ) : null}
              {i % every === 0 || i === points.length - 1 ? (
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(255,255,255,0.4)"
                >
                  {p.label}
                </text>
              ) : null}
              <rect
                x={PAD.left + slot * i}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onClick={() => setHover(i)}
              />
            </g>
          );
        })}
        <text
          x={PAD.left - 8}
          y={14}
          textAnchor="end"
          fontSize="11"
          fill="rgba(255,255,255,0.4)"
        >
          {max}
        </text>
      </svg>
      {active && hover != null ? (
        <Tooltip width={W} x={PAD.left + slot * hover + slot / 2}>
          <p className="font-medium text-white">{active.label}</p>
          {active.detail ?? (
            <p>
              {active.value ?? 0} {unit}
            </p>
          )}
        </Tooltip>
      ) : null}
    </div>
  );
}

/** Barra horizontal simples (0 a 100%), com marcador opcional de referência. */
export function Meter({
  value,
  reference,
  tone = 'cyan',
}: {
  value: number;
  reference?: number | null;
  tone?: 'cyan' | 'ok' | 'warn' | 'bad' | 'violet';
}) {
  const color = {
    cyan: 'bg-cyan-300/80',
    ok: 'bg-emerald-300/80',
    warn: 'bg-amber-300/80',
    bad: 'bg-rose-300/80',
    violet: 'bg-violet-300/80',
  }[tone];
  return (
    <div
      className="relative h-1.5 w-full overflow-visible rounded-full bg-white/10"
      aria-hidden="true"
    >
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
      {reference != null ? (
        <div
          className="absolute -top-1 h-3.5 w-0.5 rounded bg-white/60"
          style={{
            left: `calc(${Math.max(0, Math.min(100, reference))}% - 1px)`,
          }}
          title="Organização"
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- distribuições e tendências compactas

export type Slice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

/** Donut de uma distribuição (ex.: situação de conformidade), com total no centro e legenda com números. */
export function Donut({
  slices,
  center,
  caption,
  size = 168,
}: {
  slices: Slice[];
  center?: ReactNode;
  caption?: string;
  size?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  const gap = total && slices.filter((s) => s.value).length > 1 ? 1.2 : 0;
  const active = slices.find((s) => s.key === hover);
  const arcs = slices.reduce<
    { slice: Slice; length: number; offset: number }[]
  >((acc, slice) => {
    const offset = acc.length
      ? acc[acc.length - 1].offset + acc[acc.length - 1].length
      : 0;
    acc.push({ slice, length: total ? (slice.value / total) * c : 0, offset });
    return acc;
  }, []);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={caption ?? 'Distribuição'}
        >
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="10"
          />
          {arcs.map(({ slice, length, offset }) =>
            slice.value ? (
              <circle
                key={slice.key}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={slice.color}
                strokeWidth={hover === slice.key ? 12 : 10}
                strokeDasharray={`${Math.max(0, length - gap)} ${c}`}
                strokeDashoffset={-offset}
                onMouseEnter={() => setHover(slice.key)}
                onMouseLeave={() => setHover(null)}
              />
            ) : null
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-white">
              {active ? active.value : (center ?? total)}
            </p>
            <p className="px-3 text-[11px] leading-tight text-white/50">
              {active ? active.label : caption}
            </p>
          </div>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {slices.map((s) => (
          <li
            key={s.key}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1 transition ${hover === s.key ? 'bg-white/[0.06]' : ''}`}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="min-w-0 flex-1 leading-tight text-white/75">
              {s.label}
            </span>
            <span className="tabular-nums text-white">{s.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-white/45">
              {total ? `${Math.round((s.value / total) * 100)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barra 100% empilhada (ex.: situação dos alunos de uma turma), com 2px de respiro entre os segmentos. */
export function StackedBar({
  slices,
  height = 10,
  legend = false,
}: {
  slices: Slice[];
  height?: number;
  legend?: boolean;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  return (
    <div>
      <div
        className="flex w-full gap-[2px] overflow-hidden rounded-full bg-white/[0.07]"
        style={{ height }}
        role="img"
        aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(', ')}
      >
        {total
          ? slices
              .filter((s) => s.value)
              .map((s) => (
                <div
                  key={s.key}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(s.value / total) * 100}%`,
                    background: s.color,
                  }}
                  title={`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}
                />
              ))
          : null}
      </div>
      {legend ? (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
          {slices
            .filter((s) => s.value)
            .map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.label}{' '}
                <span className="tabular-nums text-white/80">{s.value}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Tendência compacta (sem eixos) para cartões: nota média semanal. Semanas sem tentativa ficam de fora. */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  label = 'Tendência da nota média',
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
  label?: string;
}) {
  const known = values.flatMap((v, i) => (v == null ? [] : [{ v, i }]));
  if (!known.length)
    return <span className="text-xs text-white/35">sem tentativas</span>;
  const min = Math.min(...known.map((p) => p.v), 50);
  const max = Math.max(...known.map((p) => p.v), 100);
  const x = (i: number) =>
    values.length > 1 ? (i / (values.length - 1)) * (width - 6) + 3 : width / 2;
  const y = (v: number) =>
    height - 4 - ((v - min) / Math.max(1, max - min)) * (height - 8);
  const last = known[known.length - 1];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}: última ${Math.round(last.v)}`}
    >
      {known.length > 1 ? (
        <polyline
          points={known.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      <circle cx={x(last.i)} cy={y(last.v)} r="3" fill="#22d3ee" />
    </svg>
  );
}

/** Colunas com o valor em cima (ex.: nota média na 1ª, 2ª, 3ª tentativa), escala 0–100 e linha do mínimo. */
export function ValueColumns({
  points,
  reference,
  height = 180,
  empty = 'Sem tentativas.',
}: {
  points: ChartPoint[];
  reference?: number | null;
  height?: number;
  empty?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth();
  if (!points.some((p) => p.value != null))
    return (
      <div ref={box}>
        <p className="py-8 text-center text-sm text-white/45">{empty}</p>
      </div>
    );
  const top = 34;
  const bottom = 24;
  const innerH = height - top - bottom;
  const base = top + innerH;
  const slot = (W - PAD.left - PAD.right) / points.length;
  const bar = Math.min(56, slot * 0.6);
  const y = (v: number) =>
    top + innerH * (1 - Math.max(0, Math.min(100, v)) / 100);
  const active = hover != null ? points[hover] : null;
  return (
    <div ref={box} className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Nota média por tentativa"
      >
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={base}
          y2={base}
          stroke="rgba(255,255,255,0.1)"
        />
        {reference != null ? (
          <g>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(reference)}
              y2={y(reference)}
              stroke="rgba(252,211,77,0.55)"
              strokeDasharray="5 5"
            />
            {/* legenda no canto, acima das colunas: não disputa espaço com os valores */}
            <line
              x1={W - PAD.right - 92}
              x2={W - PAD.right - 76}
              y1={8}
              y2={8}
              stroke="rgba(252,211,77,0.75)"
              strokeDasharray="4 3"
            />
            <text
              x={W - PAD.right}
              y={12}
              textAnchor="end"
              fontSize="11"
              fill="rgba(252,211,77,0.85)"
            >
              mínimo {reference}
            </text>
          </g>
        ) : null}
        {points.map((p, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const h = p.value != null ? base - y(p.value) : 0;
          const rr = Math.min(4, h / 2, bar / 2);
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(i)}
            >
              {h > 0 ? (
                <path
                  d={`M${cx - bar / 2},${base} v${-(h - rr)} q0,${-rr} ${rr},${-rr} h${bar - 2 * rr} q${rr},0 ${rr},${rr} v${h - rr} z`}
                  fill={hover === i ? '#67e8f9' : 'rgba(34,211,238,0.75)'}
                />
              ) : null}
              {p.value != null ? (
                <text
                  x={cx}
                  y={y(p.value) - 7}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#fff"
                >
                  {Math.round(p.value)}
                </text>
              ) : null}
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(255,255,255,0.45)"
              >
                {p.label}
              </text>
              <rect
                x={PAD.left + slot * i}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>
      {active?.detail && hover != null ? (
        <Tooltip width={W} x={PAD.left + slot * hover + slot / 2}>
          <p className="font-medium text-white">{active.label}</p>
          {active.detail}
        </Tooltip>
      ) : null}
    </div>
  );
}

export type MatrixCell = {
  tone: 'ok' | 'warn' | 'bad' | 'info' | 'none';
  text?: string;
  title: string;
};

/** Matriz linhas × colunas (ex.: alunos × etapas do curso). Cada célula tem cor e texto, nunca só cor. */
export function Matrix({
  columns,
  rows,
}: {
  columns: { key: string; label: string; hint?: string }[];
  rows: { key: string; label: ReactNode; cells: MatrixCell[] }[];
}) {
  const tone = {
    ok: 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100',
    warn: 'border-amber-300/25 bg-amber-400/15 text-amber-100',
    bad: 'border-rose-300/25 bg-rose-400/15 text-rose-100',
    info: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
    none: 'border-white/[0.06] bg-white/[0.03] text-white/35',
  } as const;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] bg-[#110e24] px-2 py-1 text-left font-medium text-white/45">
              Aluno
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className="min-w-24 px-1 py-1 text-left font-medium text-white/55"
                title={c.hint}
              >
                <span className="line-clamp-2">{c.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th
                scope="row"
                className="sticky left-0 z-[1] bg-[#110e24] px-2 py-1 text-left font-normal text-white/85"
              >
                {r.label}
              </th>
              {r.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`h-9 rounded-lg border px-2 text-center tabular-nums ${tone[cell.tone]}`}
                  title={cell.title}
                >
                  {cell.text ?? (cell.tone === 'none' ? '—' : '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
