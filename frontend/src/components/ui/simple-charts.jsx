const getMax = (data, key) => Math.max(...data.map((item) => item[key]), 1);

const compactNumber = (value) =>
  Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export function SimpleLineChart({ data = [], xKey, yKey, color = "#3b82f6", height = 260, maxLabels = 7 }) {
  if (!data.length) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">No chart data yet.</div>;
  }

  const max = getMax(data, yKey);
  const width = 640;
  const padding = { top: 24, right: 28, bottom: 48, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const points = data.map((item, index) => {
    const x = padding.left + (index * chartWidth) / Math.max(data.length - 1, 1);
    const y = padding.top + chartHeight - (Number(item[yKey] || 0) / max) * chartHeight;
    return { x, y, label: item[xKey], value: item[yKey] };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const labelStride = Math.max(1, Math.ceil(data.length / maxLabels));
  const shouldShowLabel = (index) => index === 0 || index === data.length - 1 || index % labelStride === 0;
  const areaPath =
    points.length > 1
      ? `${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
      : "";
  const yTicks = [0, 0.5, 1].map((ratio) => ({
    value: max * ratio,
    y: padding.top + chartHeight - ratio * chartHeight,
  }));

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[300px]">
        <defs>
          <linearGradient id={`line-fill-${yKey}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          return (
            <g key={tick.y}>
              <line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} stroke="#edf2f7" />
              <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {compactNumber(tick.value)}
              </text>
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill={`url(#line-fill-${yKey})`} />}
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? "4" : "3"} fill="#fff" stroke={color} strokeWidth="2" />
            {shouldShowLabel(index) && (
              <text x={point.x} y={height - 16} textAnchor="middle" fontSize="11" fill="#64748b">
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SimpleBarChart({ data, xKey, yKey, color = "#10b981", height = 260 }) {
  const max = getMax(data, yKey);

  return (
    <div className="flex items-end gap-3 pt-6" style={{ height }}>
      {data.map((item) => (
        <div key={item[xKey]} className="flex-1 h-full flex flex-col justify-end gap-2">
          <div
            className="rounded-t-md min-h-2"
            style={{ height: `${Math.max((item[yKey] / max) * 85, 4)}%`, backgroundColor: color }}
            title={`${item[xKey]}: ${item[yKey]}`}
          />
          <div className="text-xs text-gray-500 text-center">{item[xKey]}</div>
        </div>
      ))}
    </div>
  );
}

export function SimpleDonutChart({ data, colors }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const segments = data.reduce((result, item, index) => {
    const percent = (item.value / total) * 100;
    const offset = index === 0 ? 25 : result[index - 1].offset - result[index - 1].percent;
    return [...result, { item, index, percent, offset }];
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 42 42" className="w-52 h-52">
        {segments.map(({ item, index, percent, offset }) => {
          const dashArray = `${percent} ${100 - percent}`;
          return (
            <circle
              key={item.name}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth="7"
              strokeDasharray={dashArray}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
