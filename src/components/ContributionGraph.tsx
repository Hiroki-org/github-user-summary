import type { ContributionData } from "@/lib/types";

type Props = {
  contributions: ContributionData;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function ContributionGraph({ contributions }: Props) {
  const { calendar } = contributions;
  if (calendar.length === 0) return null;

  const cellSize = 12;
  const cellGap = 3;
  const step = cellSize + cellGap;
  const maxCount = Math.max(...calendar.map((d) => d.count), 1);

  // Group entries by week columns
  const entries = calendar
    .map((d) => {
      const date = new Date(d.date + "T00:00:00");
      return { ...d, dateObj: date, dayOfWeek: date.getDay() };
    })
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

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
  const svgHeight = 7 * step + 20;

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
    if (count === 0) return "rgba(var(--card-border-rgb), 0.4)"; // card-border equivalent
    const level = Math.ceil((count / maxCount) * 4);
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
        aria-label="Contribution calendar"
        className="min-w-full"
      >
        {monthLabels.map((m, i) => (
          <text
            key={`${m.label}-${i}`}
            x={m.x}
            y={10}
            className="fill-muted text-[10px] font-medium"
          >
            {m.label}
          </text>
        ))}

        {dayLabels.map((label, idx) =>
          label ? (
            <text
              key={idx}
              x={0}
              y={18 + idx * step + cellSize / 2 + 3}
              className="fill-muted text-[10px]"
            >
              {label}
            </text>
          ) : null,
        )}

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
              className="transition-all duration-200 hover:opacity-70 hover:stroke-foreground/20"
              style={{ strokeWidth: 1 }}
            >
              <title>
                {entry.date}: {entry.count} contribution{entry.count !== 1 ? "s" : ""}
              </title>
            </rect>
          )),
        )}
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
