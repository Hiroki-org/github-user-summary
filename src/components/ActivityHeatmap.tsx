type Props = {
  /** heatmap[dayOfWeek 0-6][hour 0-23] event counts */
  heatmap: number[][];
  totalEvents: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * SVG-based 7×24 activity heatmap.
 */
export default function ActivityHeatmap({ heatmap, totalEvents }: Props) {
  if (totalEvents === 0) return null;

  const cellSize = 14;
  const cellGap = 3;
  const step = cellSize + cellGap;
  const labelWidth = 32;
  const headerHeight = 20;
  const cols = 24;
  const rows = 7;

  const svgWidth = labelWidth + cols * step + cellGap;
  const svgHeight = headerHeight + rows * step + cellGap;

  const maxVal = Math.max(...heatmap.flat(), 1);

  function getColor(count: number): string {
    if (count === 0) return "rgba(var(--card-border-rgb), 0.4)";
    const level = Math.ceil((count / maxVal) * 4);
    const colors: Record<number, string> = {
      1: "rgba(var(--accent-rgb), 0.4)",
      2: "rgba(var(--accent-rgb), 0.6)",
      3: "rgba(var(--accent-rgb), 0.8)",
      4: "rgba(var(--accent-rgb), 1)",
    };
    return colors[level] ?? "rgba(var(--card-border-rgb), 0.4)";
  }

  return (
    <div className="overflow-x-auto pb-2 scrollbar-hide">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label="Activity heatmap"
        className="min-w-full"
      >
        {Array.from({ length: 8 }, (_, i) => i * 3).map((h) => (
          <text
            key={h}
            x={labelWidth + h * step + cellSize / 2}
            y={12}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {h.toString().padStart(2, "0")}
          </text>
        ))}

        {DAYS.map((day, dIdx) => (
          <g key={day}>
            <text
              x={0}
              y={headerHeight + dIdx * step + cellSize / 2 + 3}
              className="fill-muted text-[10px]"
            >
              {day}
            </text>
            {Array.from({ length: 24 }, (_, hIdx) => {
              const count = heatmap[dIdx]?.[hIdx] ?? 0;
              return (
                <rect
                  key={hIdx}
                  x={labelWidth + hIdx * step}
                  y={headerHeight + dIdx * step}
                  width={cellSize}
                  height={cellSize}
                  rx={3}
                  fill={getColor(count)}
                  className="transition-all duration-200 hover:opacity-70"
                >
                  <title>
                    {day} {hIdx}:00 — {count} event{count !== 1 ? "s" : ""}
                  </title>
                </rect>
              );
            })}
          </g>
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor:
                level === 0
                  ? "rgba(var(--card-border-rgb), 0.4)"
                  : `rgba(var(--accent-rgb), ${0.2 + level * 0.2})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
