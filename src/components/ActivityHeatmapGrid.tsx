"use client";

type Props = {
  heatmap: number[][];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensityClass(value: number): string {
  if (value <= 0) return "bg-card-border/40";
  if (value <= 2) return "bg-accent/30";
  if (value <= 5) return "bg-accent/50";
  if (value <= 9) return "bg-accent/70";
  return "bg-accent";
}

export default function ActivityHeatmapGrid({ heatmap }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card-bg p-4">
      <div className="min-w-[700px]">
        <div className="mb-3 grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1 text-[10px] text-muted">
          <span />
          {Array.from({ length: 24 }).map((_, hour) => (
            <span key={hour} className="text-center">
              {hour}
            </span>
          ))}
        </div>
        <div className="space-y-1">
          {heatmap.map((row, day) => (
            <div
              key={weekdayLabels[day]}
              className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1"
            >
              <span className="pr-2 text-xs text-muted">
                {weekdayLabels[day]}
              </span>
              {row.map((value, hour) => (
                <div
                  key={`${day}-${hour}`}
                  title={`${weekdayLabels[day]} ${hour}:00 - ${value} commits`}
                  className={`h-5 rounded-sm ${intensityClass(value)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
