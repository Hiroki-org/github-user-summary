// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ContributionGraph from "@/components/ContributionGraph";

describe("ContributionGraph", () => {
  it("returns null when calendar is empty", () => {
    const { container } = render(
      <ContributionGraph
        contributions={{
          totalContributions: 0,
          totalCommits: 0,
          totalPRs: 0,
          totalIssues: 0,
          totalReviews: 0,
          longestStreak: 0,
          currentStreak: 0,
          mostActiveDay: "",
          calendar: [],
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders correctly with calendar data", () => {
    render(
      <ContributionGraph
        contributions={{
          totalContributions: 3,
          totalCommits: 0,
          totalPRs: 0,
          totalIssues: 0,
          totalReviews: 0,
          longestStreak: 2,
          currentStreak: 0,
          mostActiveDay: "Monday",
          calendar: [
            { date: "2023-01-01", count: 1 },
            { date: "2023-01-02", count: 2 },
            { date: "2023-01-03", count: 0 },
          ],
        }}
      />
    );

    const svgElement = screen.getByRole("img", { name: "Contribution calendar" });
    expect(svgElement).toBeInTheDocument();

    // Check month and day labels
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();

    // Check title tooltips
    expect(screen.getByText("2023-01-01: 1 contribution")).toBeInTheDocument();
    expect(screen.getByText("2023-01-02: 2 contributions")).toBeInTheDocument();
    expect(screen.getByText("2023-01-03: 0 contributions")).toBeInTheDocument();

    // Check HeatmapLegend
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });
});
