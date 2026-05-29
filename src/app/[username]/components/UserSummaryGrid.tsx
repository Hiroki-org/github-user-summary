import SkillsCard from "@/components/SkillsCard";
import ContributionsCard from "@/components/ContributionsCard";
import ReposCard from "@/components/ReposCard";
import ActivityCard from "@/components/ActivityCard";
import InterestsCard from "@/components/InterestsCard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import { UserSummary } from "@/lib/types";

type Props = {
  summary: UserSummary;
};

export default function UserSummaryGrid({ summary }: Props) {
  return (
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
  );
}
