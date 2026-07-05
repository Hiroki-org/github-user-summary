/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import YearInReviewSlide from "./YearInReviewSlide";
import type { YearInReviewData } from "@/lib/types";

const mockData: YearInReviewData = {
  year: 2023,
  totalContributions: 12345,
  totalCommits: 5000,
  totalPRs: 50,
  totalIssues: 20,
  totalReviews: 30,
  mostActiveDay: "Monday",
  mostActiveHour: 14,
  topRepository: {
    name: "johndoe/cool-project",
    contributions: 300,
  },
  contributionCalendar: [],
};

describe("YearInReviewSlide", () => {
  it("renders correctly with complete data and caption", () => {
    render(<YearInReviewSlide title="Your Year at a Glance" caption="A compact view" data={mockData} />);

    // Basic fields
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("Your Year at a Glance")).toBeInTheDocument();
    expect(screen.getByText("A compact view")).toBeInTheDocument();

    // Data formatting (toLocaleString) - Use dynamic value to avoid locale dependency
    expect(screen.getByText(mockData.totalContributions.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(mockData.totalCommits.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(mockData.totalPRs.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(mockData.totalIssues.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(mockData.totalReviews.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();

    // Active day and top repo - Use RegExp for top repo to avoid JSX whitespace trim issues
    expect(screen.getByText("Most active day: Monday")).toBeInTheDocument();
    expect(screen.getByText(/Top repo: johndoe\/cool-project\s*\(300\)/)).toBeInTheDocument();
  });

  it("renders correctly without caption", () => {
    render(<YearInReviewSlide title="Title without caption" data={mockData} />);

    expect(screen.getByText("Title without caption")).toBeInTheDocument();
    expect(screen.queryByText("A compact view")).not.toBeInTheDocument();
  });

  it("renders correctly without topRepository", () => {
    const dataWithoutTopRepo = {
      ...mockData,
      topRepository: null,
    };
    render(<YearInReviewSlide title="Title" data={dataWithoutTopRepo} />);

    expect(screen.getByText("Most active day: Monday")).toBeInTheDocument();
    expect(screen.queryByText(/Top repo:/)).not.toBeInTheDocument();
  });

  it("does not render the most active day badge when mostActiveDay is null", () => {
    render(<YearInReviewSlide title="Title" data={{ ...mockData, mostActiveDay: null }} />);

    expect(screen.queryByText(/Most active day:/)).not.toBeInTheDocument();
  });
});
