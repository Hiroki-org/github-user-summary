import type { TopRepo, PinnedRepo } from "@/lib/types";

type TopReposBlockProps = {
  reposToShow: (TopRepo | PinnedRepo)[];
};

export const TopReposBlock = ({ reposToShow }: TopReposBlockProps) => (
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
