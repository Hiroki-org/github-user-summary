import type { LanguageStats } from "@/lib/types";

type Props = {
  languages: LanguageStats[];
  /** Outer diameter of the donut in px (default 180) */
  size?: number;
};

type SegmentData = {
  name: string;
  color: string;
  percentage: number;
  dashArray: string;
  dashOffset: number;
};

const STROKE_WIDTH = 28;

function DonutChart({ segments, size, totalCount }: { segments: SegmentData[], size: number, totalCount: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = STROKE_WIDTH;
  const radius = (size - strokeWidth) / 2;

  return (
    <div className="relative group">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 transform transition-transform duration-500 hover:scale-105"
        aria-label={`Language distribution: ${segments.map((s) => `${s.name} ${s.percentage.toFixed(1)}%`).join(", ")}`}
        role="img"
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />

        {/* Segments (render in reverse so first segment paints on top) */}
        {[...segments].reverse().map((seg, i) => (
          <circle
            key={seg.name}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
            style={{
              animation: `fadeIn 1s ease-out ${i * 0.1}s backwards`,
              transformOrigin: 'center',
            }}
          >
            <title>{seg.name}: {seg.percentage.toFixed(1)}%</title>
          </circle>
        ))}

        {/* Center label */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-foreground text-2xl font-bold"
        >
          {totalCount}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-muted text-xs uppercase tracking-wider"
        >
          languages
        </text>
      </svg>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-accent/5 blur-2xl -z-10 group-hover:bg-accent/10 transition-colors duration-500" />
    </div>
  );
}

function ChartLegend({ languages }: { languages: LanguageStats[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {languages.map((lang) => (
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

function calculateSegments(languages: LanguageStats[], circumference: number): SegmentData[] {
  const segments: SegmentData[] = [];
  let accumulated = 0;
  for (const lang of languages) {
    const pct = lang.percentage / 100;
    const dashLength = pct * circumference;
    const offset = -accumulated * circumference + circumference * 0.25; // start at 12 o'clock
    segments.push({
      name: lang.name,
      color: lang.color,
      percentage: lang.percentage,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: offset,
    });
    accumulated += pct;
  }
  return segments;
}

/**
 * SVG donut chart for language distribution.
 * Pure SVG — no external chart libraries.
 */
export default function LanguageChart({ languages, size = 180 }: Props) {
  if (languages.length === 0) return null;

  const top = languages.slice(0, 8);
  const strokeWidth = STROKE_WIDTH;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = calculateSegments(top, circumference);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start animate-fade-in">
      <DonutChart segments={segments} size={size} totalCount={top.length} />
      <ChartLegend languages={top} />
    </div>
  );
}
