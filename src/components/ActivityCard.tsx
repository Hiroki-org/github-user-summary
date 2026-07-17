import type { ActivityData } from "@/lib/types";
import ActivityHeatmap from "./ActivityHeatmap";

type Props = {
  activity: ActivityData;
};

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

export default function ActivityCard({ activity }: Props) {
  const { heatmap, eventBreakdown, totalEvents } = activity;

  if (totalEvents === 0) {
    return null;
  }



  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        <span className="text-xs font-medium text-muted bg-card-border/50 px-2 py-1 rounded-full">
          {totalEvents.toLocaleString()} events (last 90 days)
        </span>
      </div>

      {/* Activity Heatmap (SVG 7 days × 24 hours) */}
      <div className="mb-6">
        <ActivityHeatmap heatmap={heatmap} totalEvents={totalEvents} />
      </div>

      {/* Event Breakdown */}
      {eventBreakdown.length > 0 && (
        <div className="mt-auto pt-4 border-t border-card-border/50">
          <h4 className="mb-3 text-sm font-medium text-muted uppercase tracking-wider">
            Event Breakdown
          </h4>
          <div className="space-y-3">
            {eventBreakdown.slice(0, 8).map((event, i) => {
              const pct = (event.count / totalEvents) * 100;
              return (
                <div key={event.type} className="group" style={{ animation: `slideUp 0.5s ease-out ${i * 0.05}s backwards` }}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">
                      {eventLabels[event.type] ??
                        event.type.replace("Event", "")}
                    </span>
                    <span className="text-muted">
                      {event.count} <span className="text-muted/60">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-card-bg/50">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-1000 ease-out group-hover:brightness-110"
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
