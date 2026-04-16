// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HeatmapLegend from "./HeatmapLegend";
import "@testing-library/jest-dom";

describe("HeatmapLegend", () => {
  it("renders 'Less' and 'More' text labels", () => {
    render(<HeatmapLegend />);
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("renders exactly 5 heatmap blocks with correct background colors", () => {
    const { container } = render(<HeatmapLegend />);

    // Using simple query selection to count elements
    const blocks = container.querySelectorAll(".h-3.w-3.rounded-sm");
    expect(blocks).toHaveLength(5);

    // Testing specific colors
    expect(blocks[0]).toHaveStyle({ backgroundColor: "rgba(var(--card-border-rgb), 0.4)" });
    expect(blocks[1]).toHaveStyle({ backgroundColor: "rgba(var(--accent-rgb), 0.4)" });
    expect(blocks[2]).toHaveStyle({ backgroundColor: "rgba(var(--accent-rgb), 0.6000000000000001)" });
    expect(blocks[3]).toHaveStyle({ backgroundColor: "rgba(var(--accent-rgb), 0.8)" });
    expect(blocks[4]).toHaveStyle({ backgroundColor: "rgba(var(--accent-rgb), 1)" });
  });
});
