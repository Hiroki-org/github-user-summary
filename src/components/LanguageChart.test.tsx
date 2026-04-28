// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LanguageChart from "./LanguageChart";
import "@testing-library/jest-dom";
import type { LanguageStats } from "@/lib/types";

describe("LanguageChart", () => {
  const mockLanguages: LanguageStats[] = [
    { name: "TypeScript", color: "#3178c6", percentage: 50, bytes: 1000 },
    { name: "JavaScript", color: "#f1e05a", percentage: 25, bytes: 500 },
    { name: "HTML", color: "#e34c26", percentage: 15, bytes: 300 },
    { name: "CSS", color: "#563d7c", percentage: 10, bytes: 200 },
  ];

  it("renders null if languages array is empty", () => {
    const { container } = render(<LanguageChart languages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Donut and Legend when languages are provided", () => {
    render(<LanguageChart languages={mockLanguages} />);
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("CSS")).toBeInTheDocument();
  });

  it("slices languages to top 8", () => {
    const manyLanguages: LanguageStats[] = Array.from({ length: 10 }, (_, i) => ({
      name: `Lang${i + 1}`,
      color: "#000",
      percentage: 10,
      bytes: 100,
    }));

    render(<LanguageChart languages={manyLanguages} />);

    // Check center label for "8" languages (rendered in a text element)
    const centerNumber = screen.getByText("8", { selector: "text" });
    expect(centerNumber).toBeInTheDocument();

    // Check legend for first and 8th language
    expect(screen.getByText("Lang1")).toBeInTheDocument();
    expect(screen.getByText("Lang8")).toBeInTheDocument();

    // Check that 9th and 10th languages are not in legend
    expect(screen.queryByText("Lang9")).not.toBeInTheDocument();
    expect(screen.queryByText("Lang10")).not.toBeInTheDocument();
  });

  it("passes custom size prop to the donut chart", () => {
    const customSize = 250;
    render(<LanguageChart languages={mockLanguages} size={customSize} />);

    const svg = screen.getByRole("img", { hidden: true });
    // LanguageChartDonut renders SVG with width and height equal to size prop
    expect(svg).toHaveAttribute("width", String(customSize));
    expect(svg).toHaveAttribute("height", String(customSize));
  });
});
