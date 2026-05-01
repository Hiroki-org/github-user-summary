// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ActivityHeatmap from "./ActivityHeatmap";
import "@testing-library/jest-dom";

// Mock HeatmapLegend as it has its own tests
vi.mock("./HeatmapLegend", () => ({
  default: () => <div data-testid="heatmap-legend-mock">HeatmapLegend</div>,
}));

describe("ActivityHeatmap", () => {
  const createEmptyHeatmap = () => Array.from({ length: 7 }, () => Array(24).fill(0));

  it("returns null when totalEvents is 0", () => {
    const { container } = render(<ActivityHeatmap heatmap={createEmptyHeatmap()} totalEvents={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders heatmap SVG and HeatmapLegend when totalEvents > 0", () => {
    const heatmap = createEmptyHeatmap();
    heatmap[0][0] = 1;
    render(<ActivityHeatmap heatmap={heatmap} totalEvents={1} />);
    expect(screen.getByRole("img", { name: "Activity heatmap" })).toBeInTheDocument();
    expect(screen.getByTestId("heatmap-legend-mock")).toBeInTheDocument();
  });

  it("renders correct hour labels", () => {
    const heatmap = createEmptyHeatmap();
    heatmap[0][0] = 1;
    render(<ActivityHeatmap heatmap={heatmap} totalEvents={1} />);

    const expectedHours = ["00", "03", "06", "09", "12", "15", "18", "21"];
    expectedHours.forEach((hour) => {
      expect(screen.getByText(hour)).toBeInTheDocument();
    });
  });

  it("renders correct day labels", () => {
    const heatmap = createEmptyHeatmap();
    heatmap[0][0] = 1;
    render(<ActivityHeatmap heatmap={heatmap} totalEvents={1} />);

    const expectedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    expectedDays.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it("calculates max value and applies correct background colors", () => {
    const heatmap = createEmptyHeatmap();
    // Set some counts to test different levels
    heatmap[0][0] = 0;   // Level 0
    heatmap[0][1] = 10;  // Level 1
    heatmap[0][2] = 20;  // Level 2
    heatmap[0][3] = 30;  // Level 3
    heatmap[0][4] = 40;  // Level 4 (Max)

    render(<ActivityHeatmap heatmap={heatmap} totalEvents={100} />);

    // We can't easily select by React component structure, but we can query standard DOM elements
    // The first row should have 24 rects. Let's find rects by their titles.
    const title0 = screen.getByText("Sun 0:00 — 0 events");
    const rect0 = title0.parentElement;
    expect(rect0).toHaveAttribute("fill", "rgba(var(--card-border-rgb), 0.4)");

    const title1 = screen.getByText("Sun 1:00 — 10 events");
    const rect1 = title1.parentElement;
    expect(rect1).toHaveAttribute("fill", "rgba(var(--accent-rgb), 0.4)");

    const title2 = screen.getByText("Sun 2:00 — 20 events");
    const rect2 = title2.parentElement;
    expect(rect2).toHaveAttribute("fill", "rgba(var(--accent-rgb), 0.6)");

    const title3 = screen.getByText("Sun 3:00 — 30 events");
    const rect3 = title3.parentElement;
    expect(rect3).toHaveAttribute("fill", "rgba(var(--accent-rgb), 0.8)");

    const title4 = screen.getByText("Sun 4:00 — 40 events");
    const rect4 = title4.parentElement;
    expect(rect4).toHaveAttribute("fill", "rgba(var(--accent-rgb), 1)");
  });

  it("applies proper pluralization in event titles", () => {
    const heatmap = createEmptyHeatmap();
    heatmap[0][0] = 0;
    heatmap[0][1] = 1;
    heatmap[0][2] = 2;

    render(<ActivityHeatmap heatmap={heatmap} totalEvents={3} />);

    expect(screen.getByText("Sun 0:00 — 0 events")).toBeInTheDocument();
    expect(screen.getByText("Sun 1:00 — 1 event")).toBeInTheDocument();
    expect(screen.getByText("Sun 2:00 — 2 events")).toBeInTheDocument();
  });
});
