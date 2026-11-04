type BarPoint = {
  label: string;
  value: number;
  note?: string;
  color?: string;
};

type AnalyticsBarChartProps = {
  title: string;
  points: BarPoint[];
  valueSuffix?: string;
  maxValue?: number;
  emptyLabel?: string;
};

export default function AnalyticsBarChart({
  title,
  points,
  valueSuffix = '',
  maxValue,
  emptyLabel = 'Sem dados suficientes.',
}: AnalyticsBarChartProps) {
  const visiblePoints = points.filter((point) => point.value > 0 || point.note);
  const chartMax = maxValue ?? Math.max(...points.map((point) => point.value), 1);

  return (
    <article className="analytics-line-chart">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      {visiblePoints.length ? (
        <div className="mt-5 space-y-4">
          {visiblePoints.map((point) => {
            const width = Math.min(100, Math.max(0, (point.value / chartMax) * 100));

            return (
              <div key={point.label}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{point.label}</p>
                    {point.note ? <p className="mt-1 text-xs text-white/45">{point.note}</p> : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-white">
                    {point.value}
                    {valueSuffix}
                  </span>
                </div>

                <div className="analytics-bar-track">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background:
                        point.color ?? 'linear-gradient(90deg, #22d3ee 0%, #8b5cf6 100%)',
                    }}
                  />
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
