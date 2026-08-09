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

  let maxCount = 1;
  for (let i = 0; i < calendar.length; i++) {
    if (calendar[i].count > maxCount) maxCount = calendar[i].count;
  }

  // Create sortable array without instantiating dates excessively
  const entries = new Array(calendar.length);
  const dateObj = new Date(0); // reuse a single date object

  for (let i = 0; i < calendar.length; i++) {
    const d = calendar[i];
    const year = parseInt(d.date.substring(0, 4), 10);
    const month = parseInt(d.date.substring(5, 7), 10) - 1;
    const day = parseInt(d.date.substring(8, 10), 10);

    dateObj.setFullYear(year, month, day);

    entries[i] = {
      date: d.date,
      count: d.count,
      dayOfWeek: dateObj.getDay(),
      timestamp: dateObj.getTime(), // stored for sorting
      month: month // stored for label generation
    };
  }

  // Sort by timestamp
  entries.sort((a, b) => a.timestamp - b.timestamp);

  type EntryType = typeof entries[0];
  const weeks: EntryType[][] = [];
  let currentWeek: EntryType[] = [];

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
  for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
    const week = weeks[wIdx];
    const firstEntry = week[0];
    if (firstEntry.month !== lastMonth) {
      monthLabels.push({
        label: MONTHS[firstEntry.month],
        x: DAY_LABEL_WIDTH + wIdx * STEP,
      });
      lastMonth = firstEntry.month;
    }
  }

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
