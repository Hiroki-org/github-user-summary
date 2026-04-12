import type { LanguageStats } from "@/lib/types";

type Props = {
  top: LanguageStats[];
};

export default function LanguageChartLegend({ top }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {top.map((lang) => (
        <div key={lang.name} className="flex items-center gap-2 group/item">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-transparent group-hover/item:ring-card-bg transition-all"
            style={{ backgroundColor: lang.color }}
          />
          <span className="truncate text-foreground font-medium">{lang.name}</span>
          <span className="ml-auto text-xs text-muted">
            {lang.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
