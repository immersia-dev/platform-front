type StackedSegment = {
  label: string;
  value: number;
  color: string;
};

type StackedRow = {
  label: string;
  note?: string;
  segments: StackedSegment[];
};

type AnalyticsStackedBarChartProps = {
  title: string;
  rows: StackedRow[];
  emptyLabel?: string;
};

export default function AnalyticsStackedBarChart({
  title,
  rows,
  emptyLabel = 'Sem dados suficientes.',
}: AnalyticsStackedBarChartProps) {
  const visibleRows = rows.filter((row) =>
    row.segments.some((segment) => segment.value > 0)
  );

  return (
    <article className="analytics-line-chart">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      {visibleRows.length ? (
        <div className="mt-5 space-y-5">
          {visibleRows.map((row) => {
            const total = row.segments.reduce((sum, segment) => sum + segment.value, 0);

            return (
              <div key={row.label}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{row.label}</p>
                    {row.note ? <p className="mt-1 text-xs text-white/45">{row.note}</p> : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-white">{total}</span>
                </div>

                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/8">
                  {row.segments.map((segment) => {
                    const width = total ? (segment.value / total) * 100 : 0;

                    return (
                      <div
                        key={segment.label}
                        title={`${segment.label}: ${segment.value}`}
                        style={{ width: `${width}%`, background: segment.color }}
                      />
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
                  {row.segments.map((segment) => (
                    <span key={segment.label}>{segment.label}: {segment.value}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">{emptyLabel}</p>
      )}
    </article>
  );
}
