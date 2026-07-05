"use client";

import type { YearInReviewData } from "@/lib/types";

type Props = {
  title: string;
  caption?: string;
  data: YearInReviewData;
};

export default function YearInReviewSlide({ title, caption, data }: Props) {
  return (
    <article className="min-h-[320px] rounded-2xl border border-card-border bg-card-bg p-6 shadow-lg">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">
        {data.year}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
      {caption ? <p className="mt-2 text-sm text-muted">{caption}</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted">Total</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.totalContributions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted">Commits</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.totalCommits.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted">PRs</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.totalPRs.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted">Issues</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.totalIssues.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted">Reviews</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.totalReviews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted">Peak Hour (UTC)</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.mostActiveHour}:00
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        {data.mostActiveDay ? (
          <span className="rounded-full bg-success/15 px-3 py-1 text-success">
            Most active day: {data.mostActiveDay}
          </span>
        ) : null}
        {data.topRepository ? (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">
            Top repo: {data.topRepository.name} (
            {data.topRepository.contributions})
          </span>
        ) : null}
      </div>
    </article>
  );
}
