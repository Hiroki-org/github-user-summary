import type { LanguageStats } from "@/lib/types";

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
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Build arc segments
  let accumulated = 0;
  const segments = top.map((lang) => {
    const pct = lang.percentage / 100;
    const dashLength = pct * circumference;
    const offset = -accumulated * circumference + circumference * 0.25; // start at 12 o'clock
    accumulated += pct;
    return {
      name: lang.name,
      color: lang.color,
      percentage: lang.percentage,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: offset,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* Donut */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        aria-label="Language distribution chart"
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
        />

        {/* Segments (render in reverse so first segment paints on top) */}
        {[...segments].reverse().map((seg) => (
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
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        ))}

        {/* Center label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-foreground text-lg font-bold"
          style={{ fontSize: 18 }}
        >
          {languages.length}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-muted"
          style={{ fontSize: 11 }}
        >
          languages
        </text>
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {top.map((lang) => (
          <div key={lang.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: lang.color }}
            />
            <span className="truncate text-foreground">{lang.name}</span>
            <span className="ml-auto text-xs text-muted">
              {lang.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
