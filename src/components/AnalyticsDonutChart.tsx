type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type AnalyticsDonutChartProps = {
  title: string;
  centerLabel: string;
  centerValue: string;
  segments: DonutSegment[];
  emptyLabel?: string;
};

export default function AnalyticsDonutChart({
  title,
  centerLabel,
  centerValue,
  segments,
  emptyLabel = 'Sem dados suficientes.',
}: AnalyticsDonutChartProps) {
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  const total = visibleSegments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;
  const gradientStops = visibleSegments
    .map((segment) => {
      const start = cursor;
      const end = cursor + (segment.value / total) * 100;
      cursor = end;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <article className="analytics-line-chart">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="relative h-44 w-44 shrink-0 rounded-full"
          style={{
            background: total > 0 ? `conic-gradient(${gradientStops})` : 'rgba(255,255,255,0.08)',
          }}
          aria-hidden="true"
        >
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full border border-white/10 bg-[#0d0a1a] text-center">
            <strong className="text-3xl font-semibold text-white">{centerValue}</strong>
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              {centerLabel}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {total > 0 ? (
            <div className="mt-5 space-y-3">
              {visibleSegments.map((segment) => {
                const percentage = Math.round((segment.value / total) * 100);

                return (
                  <div key={segment.label} className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: segment.color }}
                      />
                      <span className="truncate text-sm text-white/70">{segment.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {segment.value} · {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/60">{emptyLabel}</p>
          )}
        </div>
      </div>
    </article>
  );
}
