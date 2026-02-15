import type { ContributionData } from "@/lib/types";

type Props = {
  contributions: ContributionData;
};

export default function ContributionsCard({ contributions }: Props) {
  const stats = [
    {
      label: "Total Contributions",
      value: contributions.totalContributions,
      color: "var(--accent)",
    },
    {
      label: "Commits",
      value: contributions.totalCommits,
      color: "var(--success)",
    },
    {
      label: "Pull Requests",
      value: contributions.totalPRs,
      color: "var(--accent)",
    },
    {
      label: "Issues",
      value: contributions.totalIssues,
      color: "var(--warning)",
    },
    {
      label: "Code Reviews",
      value: contributions.totalReviews,
      color: "var(--danger)",
    },
  ];

  // Recent calendar data (last 30 days)
  const recentCalendar = contributions.calendar.slice(-30);
  const maxCount = Math.max(...recentCalendar.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Contributions</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-card-border p-3 text-center"
          >
            <div
              className="text-2xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mini Contribution Calendar (last 30 days) */}
      {recentCalendar.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium text-muted">Last 30 Days</h4>
          <div className="flex gap-0.5">
            {recentCalendar.map((day) => {
              const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4);
              const opacityMap: Record<number, string> = {
                0: "opacity-10",
                1: "opacity-30",
                2: "opacity-50",
                3: "opacity-75",
                4: "opacity-100",
              };
              return (
                <div
                  key={day.date}
                  className={`h-4 flex-1 rounded-sm bg-accent ${opacityMap[intensity]}`}
                  title={`${day.date}: ${day.count} contributions`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{recentCalendar[0]?.date}</span>
            <span>{recentCalendar[recentCalendar.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
