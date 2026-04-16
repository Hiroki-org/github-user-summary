// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LanguageChart from "../LanguageChart";
import type { LanguageStats } from "@/lib/types";

describe("LanguageChart", () => {
  const mockLanguages: LanguageStats[] = [
    { name: "TypeScript", bytes: 1000, percentage: 50, color: "#3178c6" },
    { name: "JavaScript", bytes: 500, percentage: 25, color: "#f1e05a" },
    { name: "HTML", bytes: 300, percentage: 15, color: "#e34c26" },
    { name: "CSS", bytes: 200, percentage: 10, color: "#563d7c" },
  ];

  it("returns null when languages array is empty", () => {
    const { container } = render(<LanguageChart languages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the donut chart and legend", () => {
    render(<LanguageChart languages={mockLanguages} />);

    // Check if the SVG donut chart is rendered
    const svg = screen.getByRole("img", { hidden: true }); // Using hidden: true because it has aria-label
    expect(svg).toBeInTheDocument();

    // Check if languages from the legend are rendered
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("CSS")).toBeInTheDocument();
  });

  it("only displays the top 8 languages", () => {
    // Create 10 dummy languages
    const manyLanguages: LanguageStats[] = Array.from({ length: 10 }).map((_, i) => ({
      name: `Lang${i + 1}`,
      bytes: 100 - i,
      percentage: 10,
      color: "#000000",
    }));

    render(<LanguageChart languages={manyLanguages} />);

    // Lang1 through Lang8 should be present
    expect(screen.getByText("Lang1")).toBeInTheDocument();
    expect(screen.getByText("Lang8")).toBeInTheDocument();

    // Lang9 and Lang10 should NOT be present
    expect(screen.queryByText("Lang9")).not.toBeInTheDocument();
    expect(screen.queryByText("Lang10")).not.toBeInTheDocument();

    // The center label should say "8"
    // (LanguageChartDonut renders <text>{top.length}</text>)
    const centerNumber = screen.getByText("8", { selector: "text" });
    expect(centerNumber).toBeInTheDocument();
  });
});
