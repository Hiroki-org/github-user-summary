import type { RepositoryData } from "@/lib/types";
import LanguageChart from "./LanguageChart";

type Props = {
  repositories: RepositoryData;
};

export default function SkillsCard({ repositories }: Props) {
  const { languages, topics } = repositories;

  if (languages.length === 0 && topics.length === 0) {
    return null;
  }

  const topLanguages = languages.slice(0, 10);
  const topTopics = topics.slice(0, 10);
  const maxTopicCount =
    topTopics.length > 0
      ? Math.max(...topTopics.map((topic) => topic.count))
      : 0;

  const topicClassName = (count: number): string => {
    if (maxTopicCount <= 0) {
      return "text-xs";
    }
    const ratio = count / maxTopicCount;
    if (ratio >= 0.8) {
      return "text-base font-semibold";
    }
    if (ratio >= 0.5) {
      return "text-sm font-medium";
    }
    return "text-xs";
  };

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Skills & Languages
      </h3>

      {topLanguages.length > 0 && (
        <>
          {/* Donut Chart Visualization */}
          <div className="mb-6">
            <LanguageChart languages={languages} />
          </div>

          {/* Language Bar */}
          <div className="mb-4 flex h-3 overflow-hidden rounded-full">
            {topLanguages.map((lang) => (
              <div
                key={lang.name}
                className="transition-all duration-300"
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                }}
                title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Language List */}
          <div className="space-y-3">
            {topLanguages.map((lang) => (
              <div key={lang.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: lang.color }}
                    />
                    {lang.name}
                  </span>
                  <span className="text-muted">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {languages.length > 10 && (
            <p className="mt-3 text-xs text-muted">
              +{languages.length - 10} more languages
            </p>
          )}
        </>
      )}

      {topTopics.length > 0 && (
        <div
          className={
            topLanguages.length > 0
              ? "mt-6 border-t border-card-border pt-4"
              : ""
          }
        >
          <h4 className="mb-2 text-sm font-medium text-muted">
            Repository Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic) => (
              <span
                key={topic.name}
                className={`inline-flex items-center gap-1 rounded-full border border-card-border bg-background px-2.5 py-1 text-foreground ${topicClassName(topic.count)}`}
                title={`${topic.name}: ${topic.count}`}
              >
                {topic.name}
                <span className="text-muted">{topic.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
