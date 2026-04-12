import { UserSummary } from "@/lib/types";
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
import MyPageBanner from "@/components/MyPageBanner";

interface Props {
  username: string;
  summary: UserSummary;
}

export default function UserSummaryView({ username, summary }: Props) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden relative">
      <ThemeController
        avatarUrl={summary.profile?.avatar_url}
        topLanguageColor={summary.repositories?.languages[0]?.color}
      />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent opacity-5 blur-[120px] animate-pulse-slow" />
        <div
          className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-success opacity-5 blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 relative z-10 animate-fade-in">
        {/* Errors */}
        {summary.errors.length > 0 && (
          <div className="mb-6 space-y-2 animate-slide-up">
            {summary.errors.map((err, index) => (
              <div
                key={`${err.section}-${index}`}
                className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <strong>{err.section}:</strong> {err.message}
              </div>
            ))}
          </div>
        )}

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
