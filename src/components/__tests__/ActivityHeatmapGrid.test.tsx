// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import ActivityHeatmapGrid from "../ActivityHeatmapGrid";

describe("ActivityHeatmapGrid", () => {
  const createMockHeatmap = () => {
    const heatmap = Array(7)
      .fill(null)
      .map(() => Array(24).fill(0));

    // Set some specific values to test intensity classes
    heatmap[0][0] = 0; // Sun 0:00 - bg-card-border/40
    heatmap[1][1] = 2; // Mon 1:00 - bg-accent/30
    heatmap[2][2] = 5; // Tue 2:00 - bg-accent/50
    heatmap[3][3] = 9; // Wed 3:00 - bg-accent/70
    heatmap[4][4] = 10; // Thu 4:00 - bg-accent

    return heatmap;
  };

  it("renders the 24 hour labels", () => {
    render(<ActivityHeatmapGrid heatmap={createMockHeatmap()} />);

    for (let i = 0; i < 24; i++) {
      // Use getAllByText because "0" might appear in titles, so we look for exactly matching text
      const elements = screen.getAllByText(i.toString(), { exact: true });
      expect(elements.length).toBeGreaterThan(0);
    }
  });

  it("renders the 7 weekday labels", () => {
    render(<ActivityHeatmapGrid heatmap={createMockHeatmap()} />);

    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const label of weekdayLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders the correct title format and intensity classes", () => {
    const { container } = render(<ActivityHeatmapGrid heatmap={createMockHeatmap()} />);

    const value0 = container.querySelector('[title="Sun 0:00 - 0 commits"]');
    expect(value0).toBeInTheDocument();
    expect(value0).toHaveClass("bg-card-border/40");

    const value2 = container.querySelector('[title="Mon 1:00 - 2 commits"]');
    expect(value2).toBeInTheDocument();
    expect(value2).toHaveClass("bg-accent/30");

    const value5 = container.querySelector('[title="Tue 2:00 - 5 commits"]');
    expect(value5).toBeInTheDocument();
    expect(value5).toHaveClass("bg-accent/50");

    const value9 = container.querySelector('[title="Wed 3:00 - 9 commits"]');
    expect(value9).toBeInTheDocument();
    expect(value9).toHaveClass("bg-accent/70");

    const value10 = container.querySelector('[title="Thu 4:00 - 10 commits"]');
    expect(value10).toBeInTheDocument();
    expect(value10).toHaveClass("bg-accent");
  });

  it("renders a 7x24 grid of heatmap items", () => {
    const { container } = render(<ActivityHeatmapGrid heatmap={createMockHeatmap()} />);

    // There are 7 days, each with 24 hours, so there should be 7 * 24 = 168 title attributes
    const items = container.querySelectorAll('[title$="commits"]');
    expect(items.length).toBe(168);
  });
});
