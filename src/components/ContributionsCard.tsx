import type { ContributionData } from "@/lib/types";
import ContributionGraph from "./ContributionGraph";

type Props = {
  contributions: ContributionData;
};

export default function ContributionsCard({ contributions }: Props) {
  const isEmpty =
    contributions.totalContributions === 0 &&
    contributions.totalCommits === 0 &&
    contributions.totalPRs === 0 &&
    contributions.totalIssues === 0 &&
    contributions.totalReviews === 0;

  if (isEmpty) {
    return null;
  }

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
    {
      label: "🔥 Longest Streak",
      value: contributions.longestStreak,
      suffix: " days",
      color: "var(--accent)",
    },
    {
      label: "⚡ Current Streak",
      value: contributions.currentStreak,
      suffix: " days",
      color: "var(--success)",
    },
  ];

  const showMostActiveDay = contributions.mostActiveDay.length > 0;

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Contributions
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-card-border p-3 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
              {"suffix" in stat ? stat.suffix : ""}
            </div>
            <div className="mt-1 text-xs text-muted">{stat.label}</div>
          </div>
        ))}
        {showMostActiveDay && (
          <div className="rounded-md border border-card-border p-3 text-center">
            <div className="text-base font-semibold text-foreground">
              📅 {contributions.mostActiveDay}
            </div>
            <div className="mt-1 text-xs text-muted">Most Active Day</div>
          </div>
        )}
      </div>

      {/* Full Contribution Graph */}
      {contributions.calendar.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium text-muted">
            Contribution Calendar
          </h4>
          <ContributionGraph contributions={contributions} />
        </div>
      )}
    </div>
  );
}
