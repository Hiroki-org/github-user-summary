// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LanguageChartDonut from "./LanguageChartDonut";
import "@testing-library/jest-dom";

describe("LanguageChartDonut", () => {
  const mockLanguages = [
    { name: "TypeScript", color: "#3178c6", percentage: 60, bytes: 600 },
    { name: "JavaScript", color: "#f1e05a", percentage: 30, bytes: 300 },
    { name: "HTML", color: "#e34c26", percentage: 10, bytes: 100 },
  ];

  it("renders the donut chart SVG", () => {
    render(<LanguageChartDonut top={mockLanguages} size={180} />);
    const svg = screen.getByRole("img", { name: /Language distribution/ });
    expect(svg).toBeInTheDocument();
  });

  it("renders the correct number of language segments", () => {
    const { container } = render(<LanguageChartDonut top={mockLanguages} size={180} />);
    // Add 1 for the background ring
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(mockLanguages.length + 1);
  });

  it("renders the center label correctly", () => {
    const { getByText } = render(<LanguageChartDonut top={mockLanguages} size={180} />);
    expect(getByText("3")).toBeInTheDocument();
    expect(getByText("languages")).toBeInTheDocument();
  });
});
