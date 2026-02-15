import type { RepositoryData } from "@/lib/types";

type Props = {
  repositories: RepositoryData;
};

export default function SkillsCard({ repositories }: Props) {
  const { languages } = repositories;

  if (languages.length === 0) {
    return (
      <div className="rounded-lg border border-card-border bg-card-bg p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Skills & Languages</h3>
        <p className="text-sm text-muted">No language data available.</p>
      </div>
    );
  }

  const topLanguages = languages.slice(0, 10);

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Skills & Languages</h3>

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
              <span className="text-muted">{lang.percentage.toFixed(1)}%</span>
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
    </div>
  );
}
