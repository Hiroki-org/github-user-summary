"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import YearInReviewCarousel from "@/components/YearInReviewCarousel";
import { useYearInReview } from "@/hooks/useDashboardData";

export default function DashboardYearClient() {
  const searchParams = useSearchParams();
  const queryYear = searchParams.get("year");
  const resolvedYear = useMemo(() => {
    const current = new Date().getUTCFullYear();
    if (!queryYear) {
      return current;
    }
    const parsed = Number.parseInt(queryYear, 10);
    if (!Number.isFinite(parsed)) {
      return current;
    }
    return Math.min(Math.max(parsed, 2008), current);
  }, [queryYear]);

  const { data, isLoading, error } = useYearInReview(resolvedYear);

  if (isLoading) {
    return <div className="rounded-xl border border-card-border bg-card-bg p-8 text-muted">Loading year in review...</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
        Failed to load year in review.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Year in Review {data.year}</h1>
        <p className="mt-2 text-sm text-muted">
          Generated from GitHub GraphQL contributions and commit timing sampled via REST commits.
        </p>
      </header>
      <YearInReviewCarousel data={data} />
    </div>
  );
}
