import type { InterestsData } from "@/lib/types";
import { getTopicSizeClass } from "@/lib/topicUtils";

type Props = {
  interests: InterestsData;
};

export default function InterestsCard({ interests }: Props) {
  const { topTopics, topLanguages, totalStarred } = interests;

  if (
    totalStarred === 0 ||
    (topTopics.length === 0 && topLanguages.length === 0)
  ) {
    return null;
  }

  const maxTopicCount =
    topTopics.length > 0
      ? Math.max(...topTopics.map((topic) => topic.count))
      : 0;

  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Interests
        </h3>
        <span className="text-xs font-medium text-muted bg-card-border/50 px-2 py-1 rounded-full flex items-center gap-1">
          <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          {totalStarred.toLocaleString()} starred
        </span>
      </div>

      {topTopics.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-muted uppercase tracking-wider">Top Topics</h4>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic, i) => (
              <span
                key={topic.name}
                className={`inline-flex items-center gap-1 rounded-full border border-card-border bg-card-bg/50 px-3 py-1 text-foreground transition-all duration-300 hover:border-accent hover:bg-accent/10 hover:scale-105 cursor-default ${getTopicSizeClass(topic.count, maxTopicCount)}`}
                title={`${topic.name}: ${topic.count}`}
                style={{ animation: `scaleIn 0.4s ease-out ${i * 0.05}s backwards` }}
              >
                {topic.name}
                <span className="text-muted/70 text-xs ml-1 font-mono">{topic.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {topLanguages.length > 0 && (
        <div className="mt-auto">
          <h4 className="mb-3 text-sm font-medium text-muted uppercase tracking-wider">
            Interest Languages
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {topLanguages.slice(0, 8).map((lang, i) => (
              <div
                key={lang.name}
                className="flex items-center justify-between rounded-lg border border-card-border/50 bg-card-bg/30 px-3 py-2 text-sm hover:bg-card-bg/50 transition-colors"
                style={{ animation: `fadeIn 0.5s ease-out ${0.2 + i * 0.05}s backwards` }}
              >
                <span className="text-foreground font-medium truncate pr-2">{lang.name}</span>
                <span className="text-xs text-muted bg-card-border/30 px-1.5 py-0.5 rounded-full">{lang.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
