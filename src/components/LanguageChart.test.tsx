// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LanguageChart from "./LanguageChart";
import "@testing-library/jest-dom";

describe("LanguageChart", () => {
  const mockLanguages = [
    { name: "TypeScript", color: "#3178c6", percentage: 60, bytes: 600 },
    { name: "JavaScript", color: "#f1e05a", percentage: 40, bytes: 400 },
  ];

  it("renders null if languages array is empty", () => {
    const { container } = render(<LanguageChart languages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Donut and Legend when languages are provided", () => {
    render(<LanguageChart languages={mockLanguages} />);
    expect(screen.getByRole("img", { name: /Language distribution/ })).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("slices languages to top 8", () => {
    const manyLanguages = Array.from({ length: 10 }, (_, i) => ({
      name: `Lang${i}`,
      color: "#000",
      percentage: 10,
      bytes: 100,
    }));

    render(<LanguageChart languages={manyLanguages} />);

    // Check center label for "8" languages
    expect(screen.getByText("8")).toBeInTheDocument();

    // Check legend for first 8 languages
    expect(screen.getByText("Lang0")).toBeInTheDocument();
    expect(screen.getByText("Lang7")).toBeInTheDocument();

    // Check that 9th and 10th languages are not in legend
    expect(screen.queryByText("Lang8")).not.toBeInTheDocument();
    expect(screen.queryByText("Lang9")).not.toBeInTheDocument();
  });
});
