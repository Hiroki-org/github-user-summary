export default function HeatmapLegend() {
  return (
    <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className="h-3 w-3 rounded-sm"
          style={{
            backgroundColor:
              level === 0
                ? "rgba(var(--card-border-rgb), 0.4)"
                : `rgba(var(--accent-rgb), ${0.2 + level * 0.2})`,
          }}
        />
      ))}
      <span>More</span>
    </div>
  );
}
