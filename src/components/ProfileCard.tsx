import type { UserProfile } from "@/lib/types";
import { sanitizeUrl } from "@/lib/validators";

type Props = {
  profile: UserProfile;
};

// Internal components for modularity
const Avatar = ({ url, login }: { url: string; login: string }) => (
  <div className="group relative shrink-0">
    <div className="absolute inset-0 rounded-full bg-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
    <img
      src={url}
      alt={login}
      className="relative h-36 w-36 rounded-full border-4 border-card-bg shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2"
    />
  </div>
);

const ProfileMeta = ({ profile, joinDate }: { profile: UserProfile; joinDate: string }) => (
  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted sm:justify-start">
    {profile.company && (
      <span className="flex items-center gap-2 hover:text-foreground transition-colors">
        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v1.25h2.25a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25h-8.5a.25.25 0 00-.25.25v12.5zM1.75 0A1.75 1.75 0 000 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0016 14.25v-8.5A1.75 1.75 0 0014.25 4H12V1.75A1.75 1.75 0 0010.25 0h-8.5zM12 5.5h2.25a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25H12V5.5zm-3 7.75v1.25h-2v-1.25H9zM3 3h2v1.5H3V3zm0 2.5h2V7H3V5.5zm0 2.5h2v1.5H3V8zm3-5h2v1.5H6V3zm0 2.5h2V7H6V5.5zm0 2.5h2v1.5H6V8z"/></svg>
        {profile.company}
      </span>
    )}
    {profile.location && (
      <span className="flex items-center gap-2 hover:text-foreground transition-colors">
        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.536 3.464a5 5 0 010 7.072L8 14.07l-3.536-3.535a5 5 0 117.072-7.072v.001zm1.06 8.132a6.5 6.5 0 10-9.192 0l3.535 3.536a1.5 1.5 0 002.122 0l3.535-3.536zM8 9a2 2 0 100-4 2 2 0 000 4z"/></svg>
        {profile.location}
      </span>
    )}
    {profile.blog && (
      <a
        href={sanitizeUrl(profile.blog)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:text-accent transition-colors"
      >
        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/></svg>
        {profile.blog.replace(/^https?:\/\//, "")}
      </a>
    )}
    <span className="flex items-center gap-2 hover:text-foreground transition-colors">
      <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h8.5a.25.25 0 01.25.25V6h-11V3.75a.25.25 0 01.25-.25h2zm-2.25 4v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5h-11z"/></svg>
      Joined {joinDate}
    </span>
  </div>
);

const ProfileStats = ({ profile }: { profile: UserProfile }) => (
  <div className="flex justify-center gap-8 pt-2 sm:justify-start">
    <div className="text-center sm:text-left">
      <div className="text-2xl font-bold text-foreground">
        {profile.followers.toLocaleString()}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted">Followers</div>
    </div>
    <div className="text-center sm:text-left">
      <div className="text-2xl font-bold text-foreground">
        {profile.following.toLocaleString()}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted">Following</div>
    </div>
    <div className="text-center sm:text-left">
      <div className="text-2xl font-bold text-foreground">
        {profile.public_repos.toLocaleString()}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted">Repos</div>
    </div>
  </div>
);

const Organizations = ({ orgs }: { orgs: UserProfile["orgs"] }) => {
  if (orgs.length === 0) return null;

  return (
    <div className="mt-8 border-t border-card-border/50 pt-6">
      <h3 className="mb-3 text-sm font-medium text-muted uppercase tracking-wider">Organizations</h3>
      <div className="flex flex-wrap gap-3">
        {orgs.map((org) => (
          <a
            key={org.login}
            href={`https://github.com/${org.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-card-border bg-card-bg/50 px-3 py-2 text-sm text-foreground hover:border-accent hover:bg-accent/5 transition-all duration-300"
          >
            <img
              src={org.avatar_url}
              alt={org.login}
              className="h-6 w-6 rounded transition-transform group-hover:scale-110"
            />
            <span className="font-medium">{org.login}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

const PinnedRepos = ({ repos }: { repos: UserProfile["pinnedRepos"] }) => {
  if (repos.length === 0) return null;

  return (
    <div className="mt-6 border-t border-card-border/50 pt-6">
      <h3 className="mb-3 text-sm font-medium text-muted uppercase tracking-wider">Pinned Repositories</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {repos.map((repo) => (
          <a
            key={repo.name}
            href={sanitizeUrl(repo.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between rounded-lg border border-card-border bg-card-bg/30 p-4 hover:border-accent hover:bg-accent/5 hover:shadow-lg transition-all duration-300"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-semibold text-accent group-hover:underline">
                  {repo.name}
                </span>
              </div>
              {repo.description && (
                <p className="text-sm text-muted line-clamp-2 mb-3">
                  {repo.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted mt-auto">
              {repo.primaryLanguage && (
                <span className="flex items-center gap-1.5">
                  <span
                    data-testid="language-indicator"
                    className="inline-block h-3 w-3 rounded-full border border-card-bg shadow-sm"
                    style={{ backgroundColor: repo.primaryLanguage.color }}
                  />
                  {repo.primaryLanguage.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-warning" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                {repo.stargazerCount.toLocaleString()}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default function ProfileCard({ profile }: Props) {
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="glass-card rounded-xl p-8 animate-fade-in">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <Avatar url={profile.avatar_url} login={profile.login} />

        <div className="flex-1 text-center sm:text-left space-y-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {profile.name ?? profile.login}
            </h2>
            <p className="text-lg text-muted font-medium">@{profile.login}</p>
          </div>

          {profile.bio && (
            <p className="text-foreground/90 leading-relaxed max-w-2xl">{profile.bio}</p>
          )}

          <ProfileMeta profile={profile} joinDate={joinDate} />
          <ProfileStats profile={profile} />
        </div>
      </div>

      <Organizations orgs={profile.orgs} />
      <PinnedRepos repos={profile.pinnedRepos} />
    </div>
  );
}
