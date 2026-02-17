import { forwardRef } from "react";
import type { UserSummary, CardConfig } from "@/lib/types";

type Props = {
  summary: UserSummary;
  config?: CardConfig;
};

const BusinessCard = forwardRef<HTMLDivElement, Props>(({ summary, config }, ref) => {
  const { profile, repositories, contributions } = summary;

  if (!profile) return null;

  const {
    showAvatar = true,
    showBio = true,
    showStats = true,
    showTopLanguages = true,
    showTopRepos = true,
    swapColumns = false,
    showCompany = false,
    showLocation = false,
    showWebsite = false,
    showTwitter = false,
    showJoinedDate = false,
    showTopics = false,
  } = config || {};

  const topLanguages = repositories?.languages.slice(0, 5) || [];
  const topTopics = repositories?.topics.slice(0, 10) || [];
  // Pinned repos or top repos
  const reposToShow =
    profile.pinnedRepos.length > 0
      ? profile.pinnedRepos.slice(0, 2)
      : repositories?.topRepos.slice(0, 2) || [];

  return (
    <div
      ref={ref}
      className="relative flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d1117] to-[#161b22] p-16 text-white font-sans"
    >
      {/* Background decoration */}
      <div className="absolute -right-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-accent/10 blur-[100px]" />
      <div className="absolute -bottom-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-success/10 blur-[100px]" />

      <div className={`z-10 flex flex-1 gap-16 ${swapColumns ? "flex-row-reverse" : ""}`}>
        {/* Left Column: Profile & Stats */}
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10 flex items-center gap-8">
            {/* Avatar - using img tag for html-to-image compatibility */}
            {showAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.login}
                className="h-40 w-40 rounded-full border-4 border-card-border shadow-xl"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
                {profile.name || profile.login}
              </h1>
              <p className="text-3xl text-gray-400 font-medium">@{profile.login}</p>
            </div>
          </div>

          {showBio && (
            <div className="mb-8">
              <p className="text-2xl leading-relaxed text-gray-300 line-clamp-3 max-w-2xl">
                {profile.bio || "No bio available."}
              </p>
            </div>
          )}

          {/* Contact Info */}
          {(showCompany || showLocation || showWebsite || showTwitter || showJoinedDate) && (
            <div className="mb-10 flex flex-wrap gap-x-8 gap-y-3 text-lg text-gray-300">
              {showCompany && profile.company && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                    <path d="M9 22v-4h6v4"/>
                    <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
                  </svg>
                  <span>{profile.company}</span>
                </div>
              )}
              {showLocation && profile.location && (
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                   </svg>
                   <span>{profile.location}</span>
                </div>
              )}
              {showWebsite && profile.blog && (
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                   </svg>
                   <span className="truncate max-w-[200px]">{profile.blog.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
              {showTwitter && profile.twitter_username && (
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                   </svg>
                   <span>@{profile.twitter_username}</span>
                </div>
              )}
              {showJoinedDate && (
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                   </svg>
                   <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          )}

          {showStats && (
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-white mb-1">
                  {(contributions?.totalContributions ?? 0).toLocaleString()}
                </div>
                <div className="text-lg text-gray-400 uppercase tracking-wide">Contributions</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1">
                  {profile.followers.toLocaleString()}
                </div>
                <div className="text-lg text-gray-400 uppercase tracking-wide">Followers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1">
                  {profile.public_repos.toLocaleString()}
                </div>
                <div className="text-lg text-gray-400 uppercase tracking-wide">Repositories</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Skills & Repos */}
        <div className="flex w-[400px] flex-col justify-center space-y-10">
          {/* Top Languages */}
          {showTopLanguages && topLanguages.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-5 text-2xl font-semibold text-accent flex items-center gap-2">
                Top Languages
              </h3>
              <div className="space-y-4">
                {topLanguages.map((lang) => (
                  <div key={lang.name} className="flex items-center gap-4">
                    <span
                      className="h-4 w-4 rounded-full shadow-sm ring-2 ring-white/10"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="flex-1 text-xl font-medium text-gray-200">
                      {lang.name}
                    </span>
                    <span className="text-lg text-gray-500 tabular-nums">
                      {lang.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Topics */}
          {showTopics && topTopics.length > 0 && (
            <div className="mb-8">
               <h3 className="mb-5 text-2xl font-semibold text-accent flex items-center gap-2">
                Top Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {topTopics.map((topic) => (
                  <span
                    key={topic.name}
                    className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-gray-200"
                  >
                    #{topic.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Repositories */}
          {showTopRepos && reposToShow.length > 0 && (
            <div>
              <h3 className="mb-5 text-2xl font-semibold text-accent flex items-center gap-2">
                 Top Repositories
              </h3>
              <div className="space-y-4">
                {reposToShow.map((repo) => (
                  <div
                    key={repo.name}
                    className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm"
                  >
                    <div className="mb-2 truncate text-xl font-bold text-white">
                      {repo.name}
                    </div>
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
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="z-10 mt-auto flex items-center justify-between border-t border-white/10 pt-6">
         <div className="text-lg text-gray-500">
            Generated by GitHub User Summary
         </div>
         <div className="text-lg font-mono text-gray-500">
            github-user-summary.vercel.app
         </div>
      </div>
    </div>
  );
});

BusinessCard.displayName = "BusinessCard";

export default BusinessCard;
