"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

type Props = {
  username: string;
};

export default function MyPageBanner({ username }: Props) {
  const { data: session, status } = useSession();

  if (status !== "authenticated") {
    return null;
  }

  const viewer = session.user?.login?.toLowerCase();
  if (!viewer || viewer !== username.toLowerCase()) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          This is your profile. Open your private dashboard for deeper insights
          and customization.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Go to My Dashboard
        </Link>
      </div>
    </div>
  );
}
