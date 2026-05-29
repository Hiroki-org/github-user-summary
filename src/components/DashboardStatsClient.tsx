"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ActivityHeatmapGrid from "@/components/ActivityHeatmapGrid";
import { useDashboardData, useDashboardStats } from "@/hooks/useDashboardData";

export function buildEventSeries(events: { type: string; count: number }[]) {
  return events.slice(0, 6).map((event) => ({
    name: event.type.replace("Event", ""),
    count: event.count,
  }));
}

function StatBarChart({
  title,
  data,
  xAxisKey,
  barKey,
  barColor,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  xAxisKey: string;
  barKey: string;
  barColor: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.2)"
            />
            <XAxis
              dataKey={xAxisKey}
              stroke="currentColor"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              stroke="currentColor"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey={barKey} fill={barColor} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EventBreakdownChart({
  chartData,
}: {
  chartData: { name: string; count: number }[];
}) {
  return (
    <StatBarChart
      title="Recent Event Breakdown"
      data={chartData}
      xAxisKey="name"
      barKey="count"
      barColor="#0ea5e9"
    />
  );
}

function MonthlyContributionsChart({
  data,
}: {
  data: { month: string; total: number }[];
}) {
  return (
    <StatBarChart
      title="Monthly Contributions"
      data={data}
      xAxisKey="month"
      barKey="total"
      barColor="#22c55e"
    />
  );
}

export default function DashboardStatsClient() {
  const year = useMemo(() => new Date().getUTCFullYear(), []);
  const {
    summary,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();
  const {
    heatmap,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats(year);

  if (dashboardLoading || statsLoading) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-8 text-muted">
        Loading stats...
      </div>
    );
  }

  if (dashboardError || statsError || !summary) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
        Failed to load stats.
      </div>
    );
  }

  const chartData = buildEventSeries(summary.activity?.eventBreakdown ?? []);
  const contributionMonthly = Array.from({ length: 12 }, (_, month) => ({
    month: new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
      month: "short",
    }),
    total: 0,
  }));

  for (const day of summary.contributions?.calendar ?? []) {
    let month = 0;
    // Fast path for standard YYYY-MM-DD date strings
    if (day.date.length >= 10 && day.date.charCodeAt(4) === 45 && day.date.charCodeAt(7) === 45) {
      const m1 = day.date.charCodeAt(5) - 48;
      const m2 = day.date.charCodeAt(6) - 48;
      month = m1 * 10 + m2 - 1; // 0-indexed month

      // Basic validation
      if (month < 0 || month > 11) {
        month = new Date(`${day.date}T00:00:00Z`).getUTCMonth();
      }
    } else {
      month = new Date(`${day.date}T00:00:00Z`).getUTCMonth();
    }

    // Safety check just in case the month is somehow out of bounds or NaN
    if (month >= 0 && month <= 11 && !Number.isNaN(month)) {
      contributionMonthly[month].total += day.count;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Activity Stats
        </h1>
        <p className="mt-2 text-sm text-muted">
          Event trends, monthly contribution totals, and commit-time heatmap.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <EventBreakdownChart chartData={chartData} />
        <MonthlyContributionsChart data={contributionMonthly} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">
          Commit Time Heatmap (UTC)
        </h2>
        <ActivityHeatmapGrid
          heatmap={
            heatmap ??
            Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
          }
        />
      </section>
    </div>
  );
}
