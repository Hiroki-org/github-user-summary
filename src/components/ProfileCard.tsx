import type { UserProfile } from "@/lib/types";

type Props = {
  profile: UserProfile;
};

export default function ProfileCard({ profile }: Props) {
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <img
          src={profile.avatar_url}
          alt={profile.login}
          className="h-32 w-32 rounded-full border-2 border-card-border"
        />

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-foreground">
            {profile.name ?? profile.login}
          </h2>
          <p className="text-muted">@{profile.login}</p>

          {profile.bio && (
            <p className="mt-2 text-sm text-foreground">{profile.bio}</p>
          )}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted sm:justify-start">
            {profile.company && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v1.25h2.25a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25h-8.5a.25.25 0 00-.25.25v12.5zM1.75 0A1.75 1.75 0 000 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0016 14.25v-8.5A1.75 1.75 0 0014.25 4H12V1.75A1.75 1.75 0 0010.25 0h-8.5zM12 5.5h2.25a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25H12V5.5zm-3 7.75v1.25h-2v-1.25H9zM3 3h2v1.5H3V3zm0 2.5h2V7H3V5.5zm0 2.5h2v1.5H3V8zm3-5h2v1.5H6V3zm0 2.5h2V7H6V5.5zm0 2.5h2v1.5H6V8z"/></svg>
                {profile.company}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.536 3.464a5 5 0 010 7.072L8 14.07l-3.536-3.535a5 5 0 117.072-7.072v.001zm1.06 8.132a6.5 6.5 0 10-9.192 0l3.535 3.536a1.5 1.5 0 002.122 0l3.535-3.536zM8 9a2 2 0 100-4 2 2 0 000 4z"/></svg>
                {profile.location}
              </span>
            )}
            {profile.blog && (
              <a
                href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-accent transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/></svg>
                {profile.blog.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h8.5a.25.25 0 01.25.25V6h-11V3.75a.25.25 0 01.25-.25h2zm-2.25 4v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5h-11z"/></svg>
              Joined {joinDate}
            </span>
          </div>

          {/* Stats */}
          <div className="mt-4 flex justify-center gap-6 text-sm sm:justify-start">
            <span>
              <strong className="text-foreground">{profile.followers.toLocaleString()}</strong>{" "}
              <span className="text-muted">followers</span>
            </span>
            <span>
              <strong className="text-foreground">{profile.following.toLocaleString()}</strong>{" "}
              <span className="text-muted">following</span>
            </span>
            <span>
              <strong className="text-foreground">{profile.public_repos.toLocaleString()}</strong>{" "}
              <span className="text-muted">repos</span>
            </span>
          </div>
        </div>
      </div>

      {/* Organizations */}
      {profile.orgs.length > 0 && (
        <div className="mt-6 border-t border-card-border pt-4">
          <h3 className="mb-2 text-sm font-medium text-muted">Organizations</h3>
          <div className="flex flex-wrap gap-2">
            {profile.orgs.map((org) => (
              <a
                key={org.login}
                href={`https://github.com/${org.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-card-border px-3 py-1.5 text-sm text-foreground hover:border-accent transition-colors"
              >
                <img
                  src={org.avatar_url}
                  alt={org.login}
                  className="h-5 w-5 rounded"
                />
                {org.login}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Repos */}
      {profile.pinnedRepos.length > 0 && (
        <div className="mt-4 border-t border-card-border pt-4">
          <h3 className="mb-2 text-sm font-medium text-muted">Pinned Repositories</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.pinnedRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-card-border p-3 hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-accent">{repo.name}</span>
                </div>
                {repo.description && (
                  <p className="mt-1 text-xs text-muted line-clamp-2">{repo.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  {repo.primaryLanguage && (
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: repo.primaryLanguage.color }}
                      />
                      {repo.primaryLanguage.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    ⭐ {repo.stargazerCount.toLocaleString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
