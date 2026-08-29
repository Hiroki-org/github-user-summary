import HeatmapLegend from "./HeatmapLegend";
import type { ContributionData } from "@/lib/types";

type Props = {
  contributions: ContributionData;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CELL_SIZE = 12;
const CELL_GAP = 3;
const STEP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 28;

function processCalendarData(calendar: ContributionData["calendar"]) {
  if (calendar.length === 0) {
    return { weeks: [], monthLabels: [], maxCount: 1 };
  }

  const maxCount = Math.max(...calendar.map((d) => d.count), 1);

  // Sakamoto's algorithm constants for day of week
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

  // Group entries by week columns
  const entries = calendar
    .map((d) => {
      // Manual parsing to avoid expensive Date parsing and instantiation
      const y = parseInt(d.date.slice(0, 4), 10);
      const m = parseInt(d.date.slice(5, 7), 10);
      const day = parseInt(d.date.slice(8, 10), 10);

      let y2 = y;
      if (m < 3) y2 -= 1;
      const dayOfWeek = (y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) + t[m - 1] + day) % 7;

      return { ...d, month: m - 1, dayOfWeek };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

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

  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstEntry = week[0];
    const month = firstEntry.month;
    if (month !== lastMonth) {
      monthLabels.push({
        label: MONTHS[month],
        x: DAY_LABEL_WIDTH + wIdx * STEP,
      });
      lastMonth = month;
    }
  });

  return { weeks, monthLabels, maxCount };
}


function getIntensityColor(count: number, maxCount: number): string {
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

function SvgMonthLabels({ monthLabels }: { monthLabels: { label: string; x: number }[] }) {
  return (
    <>
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
    </>
  );
}

function SvgDayLabels({ dayLabels }: { dayLabels: string[] }) {
  return (
    <>
      {dayLabels.map((label, idx) =>
        label ? (
          <text
            key={idx}
            x={0}
            y={18 + idx * STEP + CELL_SIZE / 2 + 3}
            className="fill-muted text-[10px]"
          >
            {label}
          </text>
        ) : null,
      )}
    </>
  );
}

export default function ContributionGraph({ contributions }: Props) {
  const { calendar } = contributions;
  if (calendar.length === 0) return null;

  const { weeks, monthLabels, maxCount } = processCalendarData(calendar);

  const svgWidth = DAY_LABEL_WIDTH + weeks.length * STEP + CELL_GAP;
  const svgHeight = 7 * STEP + 20;

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

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
        <SvgMonthLabels monthLabels={monthLabels} />

        <SvgDayLabels dayLabels={dayLabels} />

        {weeks.map((week, wIdx) =>
          week.map((entry) => (
            <rect
              key={entry.date}
              x={DAY_LABEL_WIDTH + wIdx * STEP}
              y={18 + entry.dayOfWeek * STEP}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={getIntensityColor(entry.count, maxCount)}
              className="transition-all duration-200 hover:opacity-70 hover:stroke-foreground/20"
              style={{ strokeWidth: 1 }}
            >
              <title>{`${entry.date}: ${entry.count} contribution${entry.count !== 1 ? "s" : ""}`}</title>
            </rect>
          )),
        )}
      </svg>

      <HeatmapLegend />
    </div>
  );
}
