/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import YearInReviewCarousel from "./YearInReviewCarousel";
import type { YearInReviewData } from "@/lib/types";

const mockData: YearInReviewData = {
  year: 2023,
  totalContributions: 1000,
  totalCommits: 500,
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

describe("YearInReviewCarousel", () => {
  it("renders the initial slide and navigation controls", () => {
    render(<YearInReviewCarousel data={mockData} />);

    // Initial slide
    expect(screen.getByText("Your Year at a Glance")).toBeDefined();
    expect(screen.getByText("A compact view of your coding momentum and contribution profile.")).toBeDefined();

    // Navigation controls
    expect(screen.getByRole("button", { name: "Prev" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Next" })).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Go to slide/ })).toHaveLength(3);
  });

  it("navigates to the next slide when 'Next' is clicked", () => {
    render(<YearInReviewCarousel data={mockData} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextButton);

    // Second slide
    expect(screen.getByText("Where You Focused")).toBeDefined();
    expect(screen.getByText("Most of your impact landed in johndoe/cool-project.")).toBeDefined();
  });

  it("navigates to the previous slide when 'Prev' is clicked", () => {
    render(<YearInReviewCarousel data={mockData} />);

    const prevButton = screen.getByRole("button", { name: "Prev" });
    fireEvent.click(prevButton);

    // Last slide (because it wraps around)
    expect(screen.getByText("Your Working Rhythm")).toBeDefined();
    expect(screen.getByText("Most active on Monday around 14:00 UTC.")).toBeDefined();
  });

  it("wraps around to the first slide when 'Next' is clicked on the last slide", () => {
    render(<YearInReviewCarousel data={mockData} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextButton); // to 2nd slide
    fireEvent.click(nextButton); // to 3rd slide
    fireEvent.click(nextButton); // back to 1st slide

    expect(screen.getByText("Your Year at a Glance")).toBeDefined();
  });

  it("navigates to a specific slide when dot indicators are clicked", () => {
    render(<YearInReviewCarousel data={mockData} />);

    const slide2Dot = screen.getByRole("button", { name: "Go to slide 2" });
    fireEvent.click(slide2Dot);

    expect(screen.getByText("Where You Focused")).toBeDefined();
  });

  it("renders correctly without a topRepository", () => {
    const dataWithoutTopRepo = {
      ...mockData,
      topRepository: null,
    };

    render(<YearInReviewCarousel data={dataWithoutTopRepo} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextButton);

    // Second slide should have different text
    expect(screen.getByText("Where You Focused")).toBeDefined();
    expect(screen.getByText("No standout repository this year, but the momentum is still visible.")).toBeDefined();
  });

  it("does not render null when mostActiveDay is missing", () => {
    render(<YearInReviewCarousel data={{ ...mockData, mostActiveDay: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Prev" }));

    expect(screen.getByText("No contribution rhythm to summarize yet.")).toBeDefined();
    expect(screen.getByText("Most active day: No contributions yet")).toBeDefined();
    expect(screen.queryByText(/null/)).toBeNull();
  });
});
