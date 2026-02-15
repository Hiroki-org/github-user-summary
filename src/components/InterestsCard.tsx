import type { InterestsData } from "@/lib/types";

type Props = {
  interests: InterestsData;
};

function getTopicSize(count: number, maxCount: number): string {
  if (maxCount <= 0) {
    return "text-sm";
  }

  const ratio = count / maxCount;
  if (ratio >= 0.8) {
    return "text-base font-semibold";
  }
  if (ratio >= 0.5) {
    return "text-sm font-medium";
  }
  return "text-xs";
}

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
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Interests</h3>
        <span className="text-sm text-muted">
          ⭐ {totalStarred.toLocaleString()} starred
        </span>
      </div>

      {topTopics.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 text-sm font-medium text-muted">Top Topics</h4>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic) => (
              <span
                key={topic.name}
                className={`inline-flex items-center gap-1 rounded-full border border-card-border bg-background px-2.5 py-1 text-foreground ${getTopicSize(topic.count, maxTopicCount)}`}
                title={`${topic.name}: ${topic.count}`}
              >
                {topic.name}
                <span className="text-muted">{topic.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {topLanguages.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted">
            Interest Languages
          </h4>
          <div className="space-y-2">
            {topLanguages.slice(0, 8).map((lang) => (
              <div
                key={lang.name}
                className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm"
              >
                <span className="text-foreground">{lang.name}</span>
                <span className="text-muted">{lang.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
