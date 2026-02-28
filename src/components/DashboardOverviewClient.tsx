"use client";

import Link from "next/link";

import DashboardBusinessCardPreview from "@/components/DashboardBusinessCardPreview";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardOverviewClient() {
  const { summary, username, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-8 text-muted">
        Loading dashboard...
      </div>
    );
  }

  if (error || !summary || !username) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-card-border bg-card-bg p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {summary.profile?.name ?? username}
        </h1>
        <p className="mt-2 text-sm text-muted">
          This personal dashboard uses your signed-in GitHub identity and keeps
          your card configuration in local storage.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <DashboardBusinessCardPreview summary={summary} />
        <div className="space-y-4 rounded-xl border border-card-border bg-card-bg p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Quick actions
          </h2>
          <div className="grid gap-3 text-sm">
            <Link
              href={`/dashboard/year?year=${new Date().getUTCFullYear()}`}
              className="rounded-md border border-card-border px-4 py-2 text-muted transition-colors hover:border-muted hover:text-foreground"
            >
              Open Year in Review
            </Link>
            <Link
              href="/dashboard/stats"
              className="rounded-md border border-card-border px-4 py-2 text-muted transition-colors hover:border-muted hover:text-foreground"
            >
              Explore activity stats
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-md border border-card-border px-4 py-2 text-muted transition-colors hover:border-muted hover:text-foreground"
            >
              Customize card settings
            </Link>
            <Link
              href={`/${username}`}
              className="rounded-md border border-card-border px-4 py-2 text-muted transition-colors hover:border-muted hover:text-foreground"
            >
              View public profile page
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
