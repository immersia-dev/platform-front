type AnalyticsLineChartPoint = {
  label: string;
  value: number;
  note?: string;
};

type AnalyticsLineChartProps = {
  points: AnalyticsLineChartPoint[];
  valueSuffix?: string;
  emptyLabel?: string;
};

export default function AnalyticsLineChart({
  points,
  valueSuffix = '',
  emptyLabel = 'Sem dados suficientes para exibir a série.',
}: AnalyticsLineChartProps) {
  if (!points.length) {
    return <p className="text-sm text-white/60">{emptyLabel}</p>;
  }

  const width = 680;
  const height = 220;
  const paddingX = 20;
  const paddingY = 24;
  const maxValue = Math.max(...points.map((point) => point.value), 100);
  const safeMax = maxValue <= 0 ? 100 : maxValue;
  const stepX = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;

  const chartPoints = points.map((point, index) => {
    const ratio = point.value / safeMax;
    const x = paddingX + stepX * index;
    const y = height - paddingY - ratio * (height - paddingY * 2);

    return { ...point, x, y };
  });

  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="analytics-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="analytics-line-chart-svg" aria-hidden="true">
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = height - paddingY - ratio * (height - paddingY * 2);
          return <line key={ratio} x1="0" x2={width} y1={y} y2={y} className="analytics-grid-line" />;
        })}

        <polyline points={polyline} className="analytics-line-path" />

        {chartPoints.map((point) => (
          <g key={`${point.label}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="5" className="analytics-line-dot" />
            <text x={point.x} y={point.y - 12} textAnchor="middle" className="analytics-line-value">
              {point.value}
              {valueSuffix}
            </text>
          </g>
        ))}
      </svg>

      <div className="analytics-line-chart-labels">
        {points.map((point) => (
          <div key={`${point.label}-${point.value}`} className="analytics-line-chart-label">
            <span className="analytics-line-chart-day">{point.label}</span>
            {point.note ? <span className="analytics-line-chart-note">{point.note}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
