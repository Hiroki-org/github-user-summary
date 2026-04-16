// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ContributionsCard from "../ContributionsCard";

describe("ContributionsCard", () => {
  it("returns null when all contributions are zero", () => {
    const { container } = render(
      <ContributionsCard
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

  it("renders stats correctly when data is provided", () => {
    render(
      <ContributionsCard
        contributions={{
          totalContributions: 10,
          totalCommits: 5,
          totalPRs: 3,
          totalIssues: 1,
          totalReviews: 1,
          longestStreak: 5,
          currentStreak: 2,
          mostActiveDay: "Monday",
          calendar: [],
        }}
      />
    );

    expect(screen.getByText("Contributions")).toBeInTheDocument();
  });
});
