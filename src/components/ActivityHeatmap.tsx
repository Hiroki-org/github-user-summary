type Props = {
  /** heatmap[dayOfWeek 0-6][hour 0-23] event counts */
  heatmap: number[][];
  totalEvents: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * SVG-based 7×24 activity heatmap.
 * Pure SVG — no external chart libraries.
 */
export default function ActivityHeatmap({ heatmap, totalEvents }: Props) {
  if (totalEvents === 0) return null;

  const cellSize = 16;
  const cellGap = 2;
  const step = cellSize + cellGap;
  const labelWidth = 32;
  const headerHeight = 20;
  const cols = 24;
  const rows = 7;

  const svgWidth = labelWidth + cols * step + cellGap;
  const svgHeight = headerHeight + rows * step + cellGap;

  const maxVal = Math.max(...heatmap.flat(), 1);

  function getColor(count: number): string {
    if (count === 0) return "var(--card-border)";
    const level = Math.ceil((count / maxVal) * 4);
    const colors: Record<number, string> = {
      1: "rgba(var(--accent-rgb),0.25)",
      2: "rgba(var(--accent-rgb),0.50)",
      3: "rgba(var(--accent-rgb),0.75)",
      4: "rgba(var(--accent-rgb),1)",
    };
    return colors[level] ?? "var(--card-border)";
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label="Activity heatmap — hours of day vs days of week"
        className="min-w-full"
      >
        {/* Hour labels (every 3h) */}
        {Array.from({ length: 8 }, (_, i) => i * 3).map((h) => (
          <text
            key={h}
            x={labelWidth + h * step + cellSize / 2}
            y={12}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: 9 }}
          >
            {h.toString().padStart(2, "0")}
          </text>
        ))}

        {/* Day labels & cells */}
        {DAYS.map((day, dIdx) => (
          <g key={day}>
            <text
              x={0}
              y={headerHeight + dIdx * step + cellSize / 2 + 3}
              className="fill-muted"
              style={{ fontSize: 9 }}
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
                  className="transition-colors duration-300"
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

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor:
                level === 0
                  ? "var(--card-border)"
                  : `rgba(var(--accent-rgb),${level * 0.25})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
