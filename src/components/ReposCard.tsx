import type { RepositoryData } from "@/lib/types";

type Props = {
  repositories: RepositoryData;
};

export default function ReposCard({ repositories }: Props) {
  const { topRepos, totalCount } = repositories;

  if (topRepos.length === 0) {
    return (
      <div className="rounded-lg border border-card-border bg-card-bg p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Top Repositories</h3>
        <p className="text-sm text-muted">No repository data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Top Repositories</h3>
        <span className="text-sm text-muted">{totalCount.toLocaleString()} total</span>
      </div>

      <div className="space-y-3">
        {topRepos.map((repo) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-card-border p-3 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-accent">{repo.name}</span>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                  </svg>
                  {repo.stargazerCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  {repo.forkCount.toLocaleString()}
                </span>
              </div>
            </div>
            {repo.description && (
              <p className="mt-1 text-xs text-muted line-clamp-2">{repo.description}</p>
            )}
            {repo.primaryLanguage && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: repo.primaryLanguage.color }}
                />
                {repo.primaryLanguage.name}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
