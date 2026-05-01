import type { RepositoryData } from "@/lib/types";
import LanguageChart from "./LanguageChart";
import { getTopicSizeClass } from "@/lib/topicUtils";

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

  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col">
      <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Skills & Languages
      </h3>

      {topLanguages.length > 0 && (
        <>
          <div className="mb-8 flex justify-center">
            <LanguageChart languages={languages} />
          </div>

          <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-card-bg/50 ring-1 ring-card-border/50">
            {topLanguages.map((lang, i) => (
              <div
                key={lang.name}
                data-testid="language-bar"
                className="transition-all duration-1000 ease-out hover:brightness-110"
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                  animation: `scaleIn 0.8s ease-out ${i * 0.1}s backwards`,
                  transformOrigin: 'left',
                }}
                title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          <div className="space-y-4">
            {topLanguages.slice(0, 5).map((lang, i) => (
              <div key={lang.name} className="group" style={{ animation: `slideUp 0.5s ease-out ${i * 0.1}s backwards` }}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground font-medium">
                    <span
                      className="inline-block h-3 w-3 rounded-full ring-2 ring-card-bg"
                      style={{ backgroundColor: lang.color }}
                    />
                    {lang.name}
                  </span>
                  <span className="text-muted font-mono text-xs">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-bg/50">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {topTopics.length > 0 && (
        <div className={`mt-auto ${topLanguages.length > 0 ? "pt-6 border-t border-card-border/50" : ""}`}>
          <h4 className="mb-3 text-sm font-medium text-muted uppercase tracking-wider">
            Repository Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic, i) => (
              <span
                key={topic.name}
                className={`inline-flex items-center gap-1 rounded-full border border-card-border bg-card-bg/50 px-3 py-1 text-foreground transition-all duration-300 hover:border-accent hover:bg-accent/10 hover:scale-105 cursor-default ${getTopicSizeClass(topic.count, maxTopicCount)}`}
                title={`${topic.name}: ${topic.count}`}
                style={{ animation: `scaleIn 0.4s ease-out ${0.5 + i * 0.05}s backwards` }}
              >
                {topic.name}
                <span className="text-muted/70 text-xs ml-1 font-mono">{topic.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
