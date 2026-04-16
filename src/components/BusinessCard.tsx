import { forwardRef } from "react";
import type { CardBlockId, CardDisplayOptions, CardLayout, UserSummary } from "@/lib/types";
import { DEFAULT_CARD_LAYOUT } from "@/lib/types";
import {
  BuildingIcon,
  CalendarIcon,
  LinkIcon,
  MapPinIcon,
  TwitterIcon,
} from "./Icons";

type Props = {
  summary: UserSummary;
  layout?: CardLayout;
  options?: CardDisplayOptions;
};

const BusinessCard = forwardRef<HTMLDivElement, Props>(({ summary, layout, options }, ref) => {
  const { profile, repositories, contributions, interests, activity } = summary;

  if (!profile) return null;

  const activeLayout = layout ?? DEFAULT_CARD_LAYOUT;
  const {
    showCompany = false,
    showLocation = false,
    showWebsite = false,
    showTwitter = false,
    showJoinedDate = false,
    showTopics = false,
    showContributionBreakdown = false,
    showStreaks = false,
    showInterests = false,
    showActivityBreakdown = false,
  } = options || {};

  const topLanguages = repositories?.languages.slice(0, 5) || [];
  const topTopics = repositories?.topics.slice(0, 10) || [];
  const reposToShow =
    profile.pinnedRepos.length > 0
      ? profile.pinnedRepos.slice(0, 2)
      : repositories?.topRepos.slice(0, 2) || [];

  const renderAvatarBlock = () => (
    <div className="mb-10 flex items-center gap-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={profile.avatar_url}
        alt={profile.login}
        className="h-40 w-40 rounded-full border-4 border-card-border shadow-xl"
        crossOrigin="anonymous"
      />
      <div>
        <h1 className="mb-2 max-w-[760px] break-words text-5xl font-bold leading-tight tracking-tight text-white">
          {profile.name || profile.login}
        </h1>
        <p className="break-all text-3xl font-medium text-gray-400">@{profile.login}</p>
      </div>
    </div>
  );

  const renderBioBlock = () => (
    <>
      <div className="mb-8">
        <p className="line-clamp-3 max-w-2xl text-2xl leading-relaxed text-gray-300">
          {profile.bio || "No bio available."}
        </p>
      </div>

      {(showCompany || showLocation || showWebsite || showTwitter || showJoinedDate) && (
        <div className="mb-10 flex flex-wrap gap-x-8 gap-y-3 text-lg text-gray-300">
          {showCompany && profile.company && (
            <div className="flex items-center gap-2">
              <BuildingIcon className="text-accent" />
              <span>{profile.company}</span>
            </div>
          )}
          {showLocation && profile.location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="text-accent" />
              <span>{profile.location}</span>
            </div>
          )}
          {showWebsite && profile.blog && (
            <div className="flex items-center gap-2">
              <LinkIcon className="text-accent" />
              <span className="max-w-[200px] truncate">
                {profile.blog.replace(/^https?:\/\//, "")}
              </span>
            </div>
          )}
          {showTwitter && profile.twitter_username && (
            <div className="flex items-center gap-2">
              <TwitterIcon className="text-accent" />
              <span>@{profile.twitter_username}</span>
            </div>
          )}
          {showJoinedDate && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-accent" />
              <span>
                Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderStatsBlock = () => (
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

  const renderTopLanguagesBlock = () => (
    <div className="space-y-8">
      {topLanguages.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Top Languages
          </h3>
          <div className="space-y-3">
            {topLanguages.map((lang) => (
              <div key={lang.name} className="flex items-center gap-4">
                <span
                  className="h-4 w-4 rounded-full shadow-sm ring-2 ring-white/10"
                  style={{ backgroundColor: lang.color }}
                />
                <span className="flex-1 text-xl font-medium text-gray-200">{lang.name}</span>
                <span className="tabular-nums text-lg text-gray-500">{lang.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTopics && topTopics.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Top Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic) => (
              <span
                key={topic.name}
                className="break-all rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-gray-200"
              >
                #{topic.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {showInterests && interests && interests.topTopics.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.topTopics.slice(0, 8).map((topic) => (
              <span
                key={topic.name}
                className="break-all rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent-light"
              >
                #{topic.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {showActivityBreakdown && activity && activity.eventBreakdown.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {activity.eventBreakdown.slice(0, 5).map((event) => (
              <div key={event.type} className="flex items-center justify-between text-gray-300">
                <span>{event.type}</span>
                <span className="font-bold">{event.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTopReposBlock = () => (
    <div>
      {reposToShow.length > 0 && (
        <>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Top Repositories
          </h3>
          <div className="space-y-3">
            {reposToShow.map((repo) => (
              <div
                key={repo.name}
                className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="mb-1 truncate text-xl font-bold text-white">{repo.name}</div>
                <div className="flex items-center gap-6 text-base text-gray-400">
                  {repo.primaryLanguage && (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: repo.primaryLanguage.color }}
                      />
                      {repo.primaryLanguage.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="text-warning">★</span>
                    {repo.stargazerCount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderBlock = (blockId: CardBlockId) => {
    if (blockId === "avatar") {
      return renderAvatarBlock();
    }
    if (blockId === "bio") {
      return renderBioBlock();
    }
    if (blockId === "stats") {
      return renderStatsBlock();
    }
    if (blockId === "topLanguages") {
      return renderTopLanguagesBlock();
    }
    return renderTopReposBlock();
  };

  const fullBlocks = activeLayout.blocks.filter((block) => block.column === "full" && block.visible);
  const leftBlocks = activeLayout.blocks.filter((block) => block.column === "left" && block.visible);
  const rightBlocks = activeLayout.blocks.filter((block) => block.column === "right" && block.visible);

  return (
    <div
      ref={ref}
      data-testid="business-card-root"
      className="relative flex min-h-[630px] w-[1200px] flex-col overflow-hidden bg-gradient-to-br from-[#0d1117] to-[#161b22] p-16 font-sans text-white"
    >
      <div className="absolute -right-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-accent/10 blur-[100px]" />
      <div className="absolute -bottom-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-success/10 blur-[100px]" />

      <div className="z-10 flex flex-col gap-10">
        {fullBlocks.length > 0 && (
          <div className="space-y-8">
            {fullBlocks.map((block) => (
              <div key={block.id}>{renderBlock(block.id)}</div>
            ))}
          </div>
        )}

        <div className="flex gap-16">
          <div className="flex flex-1 flex-col space-y-8">
            {leftBlocks.map((block) => (
              <div key={block.id}>{renderBlock(block.id)}</div>
            ))}
          </div>
          <div className="flex w-[400px] flex-col space-y-8">
            {rightBlocks.map((block) => (
              <div key={block.id}>{renderBlock(block.id)}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="z-10 mt-auto flex items-center justify-between border-t border-white/10 pt-6">
        <div className="text-lg text-gray-500">Generated by GitHub User Summary</div>
        <div className="font-mono text-lg text-gray-500">github-user-summary.vercel.app</div>
      </div>
    </div>
  );
});

BusinessCard.displayName = "BusinessCard";

export default BusinessCard;
