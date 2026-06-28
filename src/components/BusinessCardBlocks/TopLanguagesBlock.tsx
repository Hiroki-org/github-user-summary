import type { LanguageStats, InterestsData, ActivityData, CardDisplayOptions } from "@/lib/types";

type TopLanguagesBlockProps = {
  topLanguages: LanguageStats[];
  topTopics: { name: string; count: number }[];
  interests: InterestsData | null;
  activity: ActivityData | null;
  options: CardDisplayOptions;
};

export const TopLanguagesBlock = ({
  topLanguages,
  topTopics,
  interests,
  activity,
  options,
}: TopLanguagesBlockProps) => {
  const {
    showTopics = false,
    showInterests = false,
    showActivityBreakdown = false,
  } = options || {};

  return (
    <div className="space-y-8">
      {topLanguages.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Top Languages
          </h3>
          <div className="space-y-3">
            {topLanguages.map((lang) => (
              <div key={lang.name} className="flex items-center gap-4">
                <span
                  className="h-4 w-4 rounded-full shadow-sm ring-2 ring-white/10"
                  style={{ backgroundColor: lang.color }}
                />
                <span className="flex-1 text-xl font-medium text-gray-200">{lang.name}</span>
                <span className="tabular-nums text-lg text-gray-500">{lang.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTopics && topTopics.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Top Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic) => (
              <span
                key={topic.name}
                className="break-all rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-gray-200"
              >
                #{topic.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {showInterests && interests && interests.topTopics.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.topTopics.slice(0, 8).map((topic) => (
              <span
                key={topic.name}
                className="break-all rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent-light"
              >
                #{topic.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {showActivityBreakdown && activity && activity.eventBreakdown.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-accent">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {activity.eventBreakdown.slice(0, 5).map((event) => (
              <div key={event.type} className="flex items-center justify-between text-gray-300">
                <span>{event.type}</span>
                <span className="font-bold">{event.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
