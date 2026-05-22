import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { fetchUserSummary } from "@/lib/github";
import { UserNotFoundError } from "@/lib/types";

import ShareButtons from "@/components/ShareButtons";
import CardGenerator from "@/components/CardGenerator";
import ProfileCard from "@/components/ProfileCard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import ThemeController from "@/components/ThemeController";
import MyPageBanner from "@/components/MyPageBanner";

import BackgroundDecoration from "./components/BackgroundDecoration";
import ErrorMessages from "./components/ErrorMessages";
import UserSummaryGrid from "./components/UserSummaryGrid";

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

      <BackgroundDecoration />

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 relative z-10 animate-fade-in">
        <ErrorMessages errors={summary.errors} />

        <MyPageBanner username={username} />

        {/* Share */}
        <div
          className="mb-6 flex justify-end items-center gap-3 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <CardGenerator summary={summary} />
          <ShareButtons username={username} />
        </div>

        {/* Profile Section */}
        {summary.profile && (
          <AnimatedWrapper delay="0.1s">
            <ProfileCard profile={summary.profile} />
          </AnimatedWrapper>
        )}

        <UserSummaryGrid summary={summary} />
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border/50 bg-background/50 backdrop-blur-sm px-6 py-8 text-center text-sm text-muted">
        Built with Next.js &amp; GitHub API
      </footer>
    </div>
  );
}
