import type { UserProfile, ContributionData, CardDisplayOptions } from "@/lib/types";

type StatsBlockProps = {
  profile: UserProfile;
  contributions: ContributionData | null;
  options: CardDisplayOptions;
};

export const StatsBlock = ({ profile, contributions, options }: StatsBlockProps) => {
  const {
    showContributionBreakdown = false,
    showStreaks = false,
  } = options || {};

  return (
    <>
      <div className="grid grid-cols-3 gap-8">
        <div>
          <div className="mb-1 text-4xl font-bold text-white">
            {(contributions?.totalContributions ?? 0).toLocaleString()}
          </div>
          <div className="text-lg uppercase tracking-wide text-gray-400">Contributions</div>
        </div>
        <div>
          <div className="mb-1 text-4xl font-bold text-white">
            {profile.followers.toLocaleString()}
          </div>
          <div className="text-lg uppercase tracking-wide text-gray-400">Followers</div>
        </div>
        <div>
          <div className="mb-1 text-4xl font-bold text-white">
            {profile.public_repos.toLocaleString()}
          </div>
          <div className="text-lg uppercase tracking-wide text-gray-400">Repositories</div>
        </div>
      </div>

      {showContributionBreakdown && contributions && (
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-400">Commits</span>
            <span className="text-xl font-bold text-white">{contributions.totalCommits.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-400">Pull Requests</span>
            <span className="text-xl font-bold text-white">{contributions.totalPRs.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-400">Issues</span>
            <span className="text-xl font-bold text-white">{contributions.totalIssues.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-400">Code Reviews</span>
            <span className="text-xl font-bold text-white">{contributions.totalReviews.toLocaleString()}</span>
          </div>
        </div>
      )}

      {showStreaks && contributions && (
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <div className="mb-1 text-3xl font-bold text-white">
              {contributions.longestStreak} days
            </div>
            <div className="text-base uppercase tracking-wide text-gray-400">Longest Streak</div>
          </div>
          <div>
            <div className="mb-1 text-3xl font-bold text-white">
              {contributions.currentStreak} days
            </div>
            <div className="text-base uppercase tracking-wide text-gray-400">Current Streak</div>
          </div>
        </div>
      )}
    </>
  );
};
