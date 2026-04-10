import type { LanguageStats } from "@/lib/types";
import LanguageChartDonut from "./LanguageChartDonut";
import LanguageChartLegend from "./LanguageChartLegend";

type Props = {
  languages: LanguageStats[];
  /** Outer diameter of the donut in px (default 180) */
  size?: number;
};

/**
 * SVG donut chart for language distribution.
 * Pure SVG — no external chart libraries.
 */
export default function LanguageChart({ languages, size = 180 }: Props) {
  if (languages.length === 0) return null;

  const top = languages.slice(0, 8);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start animate-fade-in">
      {/* Donut */}
      <LanguageChartDonut top={top} size={size} />

      {/* Legend */}
      <LanguageChartLegend top={top} />
    </div>
  );
}
