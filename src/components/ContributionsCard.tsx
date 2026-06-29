import type { CSSProperties, ReactNode } from "react";
import type { ContributionData } from "@/lib/types";
import ContributionGraph from "./ContributionGraph";

type Stat = {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
  suffix?: string;
};

type Props = {
  contributions: ContributionData;
};

// Extracted icons for better readability
const Icons = {
  Contributions: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  Commits: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  PullRequests: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  Issues: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  CodeReviews: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  LongestStreak: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
  CurrentStreak: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  MostActiveDay: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  MonthlyContributions: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  WeeklyContributions: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Header: <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
};


const getStats = (contributions: ContributionData): Stat[] => [
  {
    label: "Yearly Contributions",
    value: contributions.totalContributions,
    color: "var(--accent)",
    icon: Icons.Contributions
  },
  {
    label: "Monthly Contributions",
    value: contributions.monthlyContributions,
    color: "var(--accent)",
    icon: Icons.MonthlyContributions
  },
  {
    label: "Weekly Contributions",
    value: contributions.weeklyContributions,
    color: "var(--accent)",
    icon: Icons.WeeklyContributions
  },
  {
    label: "Commits",
    value: contributions.totalCommits,
    color: "var(--success)",
    icon: Icons.Commits
  },
  {
    label: "Pull Requests",
    value: contributions.totalPRs,
    color: "var(--accent)",
    icon: Icons.PullRequests
  },
  {
    label: "Issues",
    value: contributions.totalIssues,
    color: "var(--warning)",
    icon: Icons.Issues
  },
  {
    label: "Code Reviews",
    value: contributions.totalReviews,
    color: "var(--danger)",
    icon: Icons.CodeReviews
  },
  {
    label: "Longest Streak",
    value: contributions.longestStreak,
    suffix: " days",
    color: "var(--accent)",
    icon: Icons.LongestStreak
  },
  {
    label: "Current Streak",
    value: contributions.currentStreak,
    suffix: " days",
    color: "var(--success)",
    icon: Icons.CurrentStreak
  },
];

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const statColorStyle = { "--stat-color": stat.color } as CSSProperties;

  return (
    <div
      className="group rounded-lg border border-card-border/50 bg-card-bg/30 p-4 text-center hover:border-accent hover:bg-accent/5 hover:scale-105 transition-all duration-300"
      style={{ animation: `scaleIn 0.4s ease-out ${index * 0.05}s backwards` }}
    >
      <div
        className="mb-2 flex justify-center transition-colors [color:var(--stat-color)] group-hover:text-foreground"
        style={statColorStyle}
      >
        {stat.icon}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: stat.color }}>
        {stat.value.toLocaleString()}
        {stat.suffix && <span className="text-sm ml-1 opacity-70 font-normal">{stat.suffix}</span>}
      </div>
      <div className="mt-1 text-xs text-muted font-medium">{stat.label}</div>
    </div>
  );
}

function MostActiveDayCard({ day }: { day: string }) {
  return (
    <div className="group rounded-lg border border-card-border/50 bg-card-bg/30 p-4 text-center hover:border-accent hover:bg-accent/5 hover:scale-105 transition-all duration-300" style={{ animation: `scaleIn 0.4s ease-out 0.4s backwards` }}>
      <div className="mb-2 flex justify-center text-accent">
        {Icons.MostActiveDay}
      </div>
      <div className="text-base font-semibold text-foreground pt-1 pb-1">
        {day}
      </div>
      <div className="text-xs text-muted font-medium">Most Active Day</div>
    </div>
  );
}

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

  const stats = getStats(contributions);
  const showMostActiveDay = contributions.mostActiveDay.length > 0;

  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col">
      <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
        {Icons.Header}
        Contributions
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
        {showMostActiveDay && (
          <MostActiveDayCard day={contributions.mostActiveDay} />
        )}
      </div>

      {/* Full Contribution Graph */}
      {contributions.calendar.length > 0 && (
        <div className="mt-auto pt-4 border-t border-card-border/50">
          <ContributionGraph contributions={contributions} />
        </div>
      )}
    </div>
  );
}
