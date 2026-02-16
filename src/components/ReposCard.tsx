import type { RepositoryData } from "@/lib/types";

type Props = {
  repositories: RepositoryData;
};

export default function ReposCard({ repositories }: Props) {
  const { topRepos, totalCount } = repositories;

  if (topRepos.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Top Repositories
        </h3>
        <span className="text-xs font-medium text-muted bg-card-border/50 px-2 py-1 rounded-full">
          {totalCount.toLocaleString()} total
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {topRepos.map((repo, i) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-card-border/50 bg-card-bg/30 p-3 hover:border-accent hover:bg-accent/5 hover:shadow-md transition-all duration-300"
            style={{ animation: `slideUp 0.5s ease-out ${i * 0.1}s backwards` }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-accent group-hover:underline decoration-accent/50 underline-offset-2">
                {repo.name}
              </span>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted group-hover:text-foreground transition-colors">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-warning" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                  {repo.stargazerCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>
                  {repo.forkCount.toLocaleString()}
                </span>
              </div>
            </div>
            {repo.description && (
              <p className="mt-1 text-xs text-muted line-clamp-2 group-hover:text-foreground/80 transition-colors">
                {repo.description}
              </p>
            )}
            {repo.primaryLanguage && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-card-bg"
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
