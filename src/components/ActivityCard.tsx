import type { ActivityData } from "@/lib/types";
import ActivityHeatmap from "./ActivityHeatmap";

type Props = {
  activity: ActivityData;
};


export default function ActivityCard({ activity }: Props) {
  const { heatmap, eventBreakdown, totalEvents } = activity;

  if (totalEvents === 0) {
    return null;
  }

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

      {/* Activity Heatmap (SVG 7 days × 24 hours) */}
      <div className="mb-6">
        <ActivityHeatmap heatmap={heatmap} totalEvents={totalEvents} />
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
