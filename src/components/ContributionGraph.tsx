import type { ContributionData } from "@/lib/types";

type Props = {
  contributions: ContributionData;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * GitHub-style contribution calendar grid using pure SVG.
 * Renders the calendar data as a grid of colored rects.
 */
export default function ContributionGraph({ contributions }: Props) {
  const { calendar } = contributions;
  if (calendar.length === 0) return null;

  const cellSize = 12;
  const cellGap = 2;
  const step = cellSize + cellGap;
  const maxCount = Math.max(...calendar.map((d) => d.count), 1);

  // Group entries by week columns
  // Parse dates and arrange into week columns (Sun = start of week)
  const entries = calendar
    .map((d) => {
      const date = new Date(d.date + "T00:00:00");
      return { ...d, dateObj: date, dayOfWeek: date.getDay() };
    })
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Build columns: each column = one week
  const weeks: (typeof entries)[] = [];
  let currentWeek: typeof entries = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(entry);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const dayLabelWidth = 28;
  const svgWidth = dayLabelWidth + weeks.length * step + cellGap;
  const svgHeight = 7 * step + 20; // 7 rows + month labels

  // Month labels
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstEntry = week[0];
    const month = firstEntry.dateObj.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        label: MONTHS[month],
        x: dayLabelWidth + wIdx * step,
      });
      lastMonth = month;
    }
  });

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  function getIntensityColor(count: number): string {
    if (count === 0) return "var(--card-border)";
    const level = Math.ceil((count / maxCount) * 4);
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
        aria-label="Contribution calendar"
        className="min-w-full"
      >
        {/* Month labels */}
        {monthLabels.map((m, i) => (
          <text
            key={`${m.label}-${i}`}
            x={m.x}
            y={10}
            className="fill-muted"
            style={{ fontSize: 10 }}
          >
            {m.label}
          </text>
        ))}

        {/* Day labels */}
        {dayLabels.map((label, idx) =>
          label ? (
            <text
              key={idx}
              x={0}
              y={18 + idx * step + cellSize / 2 + 3}
              className="fill-muted"
              style={{ fontSize: 10 }}
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Grid cells */}
        {weeks.map((week, wIdx) =>
          week.map((entry) => (
            <rect
              key={entry.date}
              x={dayLabelWidth + wIdx * step}
              y={18 + entry.dayOfWeek * step}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={getIntensityColor(entry.count)}
              className="transition-colors duration-300"
            >
              <title>
                {entry.date}: {entry.count} contribution{entry.count !== 1 ? "s" : ""}
              </title>
            </rect>
          )),
        )}
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
