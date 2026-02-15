import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { fetchUserSummary } from "@/lib/github";
import { UserNotFoundError } from "@/lib/types";

import LoginButton from "@/components/LoginButton";
import SearchForm from "@/components/SearchForm";
import ProfileCard from "@/components/ProfileCard";
import SkillsCard from "@/components/SkillsCard";
import ContributionsCard from "@/components/ContributionsCard";
import ReposCard from "@/components/ReposCard";
import ActivityCard from "@/components/ActivityCard";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} - GitHub User Summary`,
    description: `GitHub profile summary for ${username}.`,
    openGraph: {
      title: `${username} - GitHub User Summary`,
      description: `GitHub profile summary for ${username}.`,
      images: [`/api/og/${encodeURIComponent(username)}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${username} - GitHub User Summary`,
      images: [`/api/og/${encodeURIComponent(username)}`],
    },
  };
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  let summary;
  try {
    summary = await fetchUserSummary(username, token);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-accent transition-colors">
            GitHub User Summary
          </Link>
          <div className="flex items-center gap-4">
            <SearchForm />
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Errors */}
        {summary.errors.length > 0 && (
          <div className="mb-6 space-y-2">
            {summary.errors.map((err) => (
              <div
                key={err.section}
                className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <strong>{err.section}:</strong> {err.message}
              </div>
            ))}
          </div>
        )}

        {/* Profile Section */}
        {summary.profile && <ProfileCard profile={summary.profile} />}

        {/* Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Skills */}
          {summary.repositories && (
            <SkillsCard repositories={summary.repositories} />
          )}

          {/* Contributions */}
          {summary.contributions && (
            <ContributionsCard contributions={summary.contributions} />
          )}

          {/* Repos */}
          {summary.repositories && (
            <ReposCard repositories={summary.repositories} />
          )}

          {/* Activity */}
          {summary.activity && (
            <ActivityCard activity={summary.activity} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border px-6 py-4 text-center text-sm text-muted">
        Built with Next.js &amp; GitHub API
      </footer>
    </div>
  );
}
