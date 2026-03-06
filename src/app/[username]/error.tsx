"use client";

import { useEffect } from "react";
import Link from "next/link";

import { logger } from "@/lib/logger";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("User page error:", error);
  }, [error]);

  const isRateLimit = error.message.includes("rate limit");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-card-border bg-card-bg p-8 text-center">
        <div className="mb-4 text-5xl">
          {isRateLimit ? "⏳" : "😵"}
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          {isRateLimit ? "Rate Limit Exceeded" : "Something went wrong"}
        </h2>
        <p className="mb-6 text-sm text-muted">
          {isRateLimit
            ? "You've hit the GitHub API rate limit. Sign in with GitHub for a higher limit, or try again later."
            : error.message || "An unexpected error occurred while fetching user data."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border border-card-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
