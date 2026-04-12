import { useMemo } from "react";
import type { LanguageStats } from "@/lib/types";

type Props = {
  top: LanguageStats[];
  size: number;
};

export default function LanguageChartDonut({ top, size }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    const result = [];
    let accumulated = 0;

    for (const lang of top) {
      const pct = lang.percentage / 100;
      const dashLength = pct * circumference;
      const offset = -accumulated * circumference + circumference * 0.25; // start at 12 o'clock
      result.push({
        name: lang.name,
        color: lang.color,
        percentage: lang.percentage,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: offset,
      });
      accumulated += pct;
    }

    return result;
  }, [top, circumference]);

  const reversedSegments = useMemo(() => [...segments].reverse(), [segments]);

  return (
    <div className="relative group">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 transform transition-transform duration-500 hover:scale-105"
        aria-label={`Language distribution: ${top.map((s) => `${s.name} ${s.percentage.toFixed(1)}%`).join(", ")}`}
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
        {reversedSegments.map((seg, i) => {
          const originalIndex = segments.length - 1 - i;

          return (
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
                animation: `fadeIn 1s ease-out ${originalIndex * 0.1}s backwards`,
                transformOrigin: "center",
              }}
            >
              <title>{seg.name}: {seg.percentage.toFixed(1)}%</title>
            </circle>
          );
        })}

        {/* Center label */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-foreground text-2xl font-bold"
        >
          {top.length}
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
