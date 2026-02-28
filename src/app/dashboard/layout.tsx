import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-6 rounded-xl border border-card-border bg-card-bg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.user?.image ?? ""}
              alt={session.user?.name ?? "Signed in user"}
              className="h-10 w-10 rounded-full border border-card-border"
            />
            <div>
              <p className="text-sm text-muted">Signed in as</p>
              <p className="font-medium text-foreground">{session.user?.name ?? session.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-md border border-card-border px-3 py-1.5 text-muted hover:text-foreground">
              Overview
            </Link>
            <Link href="/dashboard/year" className="rounded-md border border-card-border px-3 py-1.5 text-muted hover:text-foreground">
              Year
            </Link>
            <Link href="/dashboard/stats" className="rounded-md border border-card-border px-3 py-1.5 text-muted hover:text-foreground">
              Stats
            </Link>
            <Link href="/dashboard/settings" className="rounded-md border border-card-border px-3 py-1.5 text-muted hover:text-foreground">
              Settings
            </Link>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
