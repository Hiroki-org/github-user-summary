import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { fetchUserSummary } from "@/lib/github";
import { UserNotFoundError } from "@/lib/types";

import LoginButton from "@/components/LoginButton";
import SearchForm from "@/components/SearchForm";
import ShareButtons from "@/components/ShareButtons";
import CardGenerator from "@/components/CardGenerator";
import ProfileCard from "@/components/ProfileCard";
import SkillsCard from "@/components/SkillsCard";
import ContributionsCard from "@/components/ContributionsCard";
import ReposCard from "@/components/ReposCard";
import ActivityCard from "@/components/ActivityCard";
import InterestsCard from "@/components/InterestsCard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import ThemeController from "@/components/ThemeController";

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
    <div className="flex min-h-screen flex-col overflow-hidden relative">
      <ThemeController
        avatarUrl={summary.profile?.avatar_url}
        topLanguageColor={summary.repositories?.languages[0]?.color}
      />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent opacity-5 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-success opacity-5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-card-border/50 bg-background/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold text-foreground hover:text-accent transition-colors"
          >
            GitHub User Summary
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
               <SearchForm />
            </div>
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 relative z-10 animate-fade-in">
        {/* Errors */}
        {summary.errors.length > 0 && (
          <div className="mb-6 space-y-2 animate-slide-up">
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

        {/* Share */}
        <div className="mb-6 flex justify-end items-center gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardGenerator summary={summary} />
          <ShareButtons username={username} />
        </div>

        {/* Profile Section */}
        {summary.profile && (
          <AnimatedWrapper delay="0.1s">
            <ProfileCard profile={summary.profile} />
          </AnimatedWrapper>
        )}

        {/* Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Skills */}
          {summary.repositories && (
            <AnimatedWrapper delay="0.2s">
              <SkillsCard repositories={summary.repositories} />
            </AnimatedWrapper>
          )}

          {/* Contributions */}
          {summary.contributions && (
            <AnimatedWrapper delay="0.3s">
              <ContributionsCard contributions={summary.contributions} />
            </AnimatedWrapper>
          )}

          {/* Repos */}
          {summary.repositories && (
            <AnimatedWrapper delay="0.4s">
              <ReposCard repositories={summary.repositories} />
            </AnimatedWrapper>
          )}

          {/* Interests */}
          {summary.interests && (
            <AnimatedWrapper delay="0.5s">
              <InterestsCard interests={summary.interests} />
            </AnimatedWrapper>
          )}

          {/* Activity */}
          {summary.activity && (
            <AnimatedWrapper delay="0.6s">
              <ActivityCard activity={summary.activity} />
            </AnimatedWrapper>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border/50 bg-background/50 backdrop-blur-sm px-6 py-8 text-center text-sm text-muted">
        Built with Next.js &amp; GitHub API
      </footer>
    </div>
  );
}
