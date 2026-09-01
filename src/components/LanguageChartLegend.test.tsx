// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LanguageChartLegend from "./LanguageChartLegend";
import "@testing-library/jest-dom";

describe("LanguageChartLegend", () => {
  const mockLanguages = [
    { name: "TypeScript", color: "#3178c6", percentage: 60.5, bytes: 605 },
    { name: "JavaScript", color: "#f1e05a", percentage: 39.5, bytes: 395 },
  ];

  it("renders the language names", () => {
    render(<LanguageChartLegend top={mockLanguages} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("renders the correct formatted percentage", () => {
    render(<LanguageChartLegend top={mockLanguages} />);
    expect(screen.getByText("60.5%")).toBeInTheDocument();
    expect(screen.getByText("39.5%")).toBeInTheDocument();
  });

  it("renders without crashing with an empty array", () => {
    const { container } = render(<LanguageChartLegend top={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
