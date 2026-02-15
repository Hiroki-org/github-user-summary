import type { ActivityData } from "@/lib/types";

type Props = {
  activity: ActivityData;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const INTENSITY_COLORS: Record<number, string> = {
  0: "bg-foreground/5",
  1: "bg-accent/25",
  2: "bg-accent/50",
  3: "bg-accent/75",
  4: "bg-accent",
};

export default function ActivityCard({ activity }: Props) {
  const { heatmap, eventBreakdown, totalEvents } = activity;

  if (totalEvents === 0) {
    return (
      <div className="rounded-lg border border-card-border bg-card-bg p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Activity</h3>
        <p className="text-sm text-muted">No recent activity data available.</p>
      </div>
    );
  }

  // Find max value for heatmap intensity
  const maxVal = Math.max(...heatmap.flat(), 1);

  // Event type labels
  const eventLabels: Record<string, string> = {
    PushEvent: "Pushes",
    PullRequestEvent: "Pull Requests",
    IssuesEvent: "Issues",
    IssueCommentEvent: "Comments",
    CreateEvent: "Creates",
    DeleteEvent: "Deletes",
    WatchEvent: "Stars",
    ForkEvent: "Forks",
    PullRequestReviewEvent: "Reviews",
    ReleaseEvent: "Releases",
  };

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Activity</h3>
        <span className="text-sm text-muted">{totalEvents.toLocaleString()} events</span>
      </div>

      {/* Activity Heatmap (7 days × 24 hours) */}
      <div className="mb-6 overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="mb-1 flex">
            <div className="w-10 shrink-0" />
            {HOURS.filter((h) => h % 3 === 0).map((h) => (
              <div
                key={h}
                className="text-xs text-muted"
                style={{ width: `${(3 / 24) * 100}%` }}
              >
                {h.toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1 mb-0.5">
              <span className="w-10 shrink-0 text-xs text-muted">{day}</span>
              <div className="flex flex-1 gap-px">
                {HOURS.map((hour) => {
                  const count = heatmap[dayIdx]?.[hour] ?? 0;
                  const intensity =
                    count === 0 ? 0 : Math.ceil((count / maxVal) * 4);
                  return (
                    <div
                      key={hour}
                      className={`aspect-square flex-1 rounded-sm ${INTENSITY_COLORS[intensity]}`}
                      title={`${day} ${hour}:00 — ${count} events`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-foreground/5" />
            <div className="h-3 w-3 rounded-sm bg-accent/25" />
            <div className="h-3 w-3 rounded-sm bg-accent/50" />
            <div className="h-3 w-3 rounded-sm bg-accent/75" />
            <div className="h-3 w-3 rounded-sm bg-accent" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Event Breakdown */}
      {eventBreakdown.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted">Event Breakdown</h4>
          <div className="space-y-2">
            {eventBreakdown.slice(0, 8).map((event) => {
              const pct = (event.count / totalEvents) * 100;
              return (
                <div key={event.type}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      {eventLabels[event.type] ?? event.type.replace("Event", "")}
                    </span>
                    <span className="text-muted">
                      {event.count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
