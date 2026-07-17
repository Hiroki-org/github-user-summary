import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UserSummaryGrid from "../UserSummaryGrid";
import { UserSummary } from "@/lib/types";

// Mock the child components
vi.mock("@/components/SkillsCard", () => ({
  default: () => <div data-testid="skills-card">SkillsCard</div>,
}));

vi.mock("@/components/ContributionsCard", () => ({
  default: () => <div data-testid="contributions-card">ContributionsCard</div>,
}));

vi.mock("@/components/ReposCard", () => ({
  default: () => <div data-testid="repos-card">ReposCard</div>,
}));

vi.mock("@/components/InterestsCard", () => ({
  default: () => <div data-testid="interests-card">InterestsCard</div>,
}));

vi.mock("@/components/ActivityCard", () => ({
  default: () => <div data-testid="activity-card">ActivityCard</div>,
}));

// AnimatedWrapper is used to add a delay, mock it to just render children
vi.mock("@/components/AnimatedWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animated-wrapper">{children}</div>
  ),
}));

const mockSummary: UserSummary = {
  profile: null,
  repositories: {
    languages: [],
    topics: [],
    topRepos: [],
    totalCount: 0,
  },
  contributions: {
    totalCommits: 0,
    totalPRs: 0,
    totalIssues: 0,
    totalReviews: 0,
    totalContributions: 0,
    monthlyContributions: 0,
    weeklyContributions: 0,
    longestStreak: 0,
    currentStreak: 0,
    mostActiveDay: null,
    calendar: [],
  },
  activity: {
    heatmap: [],
    eventBreakdown: [],
    totalEvents: 0,
  },
  interests: {
    topTopics: [],
    topLanguages: [],
    totalStarred: 0,
  },
  errors: [],
};

describe("UserSummaryGrid", () => {
  it("renders all cards when all data is available", () => {
    render(<UserSummaryGrid summary={mockSummary} />);

    expect(screen.getByTestId("skills-card")).toBeInTheDocument();
    expect(screen.getByTestId("contributions-card")).toBeInTheDocument();
    expect(screen.getByTestId("repos-card")).toBeInTheDocument();
    expect(screen.getByTestId("interests-card")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
  });

  it("does not render SkillsCard or ReposCard if repositories data is missing", () => {
    const summaryWithoutRepos = { ...mockSummary, repositories: null };
    render(<UserSummaryGrid summary={summaryWithoutRepos} />);

    expect(screen.queryByTestId("skills-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("repos-card")).not.toBeInTheDocument();

    // Others should still render
    expect(screen.getByTestId("contributions-card")).toBeInTheDocument();
    expect(screen.getByTestId("interests-card")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
  });

  it("does not render ContributionsCard if contributions data is missing", () => {
    const summaryWithoutContributions = { ...mockSummary, contributions: null };
    render(<UserSummaryGrid summary={summaryWithoutContributions} />);

    expect(screen.queryByTestId("contributions-card")).not.toBeInTheDocument();

    // Others should still render
    expect(screen.getByTestId("skills-card")).toBeInTheDocument();
    expect(screen.getByTestId("repos-card")).toBeInTheDocument();
    expect(screen.getByTestId("interests-card")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
  });

  it("does not render InterestsCard if interests data is missing", () => {
    const summaryWithoutInterests = { ...mockSummary, interests: null };
    render(<UserSummaryGrid summary={summaryWithoutInterests} />);

    expect(screen.queryByTestId("interests-card")).not.toBeInTheDocument();

    // Others should still render
    expect(screen.getByTestId("skills-card")).toBeInTheDocument();
    expect(screen.getByTestId("contributions-card")).toBeInTheDocument();
    expect(screen.getByTestId("repos-card")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
  });

  it("does not render ActivityCard if activity data is missing", () => {
    const summaryWithoutActivity = { ...mockSummary, activity: null };
    render(<UserSummaryGrid summary={summaryWithoutActivity} />);

    expect(screen.queryByTestId("activity-card")).not.toBeInTheDocument();

    // Others should still render
    expect(screen.getByTestId("skills-card")).toBeInTheDocument();
    expect(screen.getByTestId("contributions-card")).toBeInTheDocument();
    expect(screen.getByTestId("repos-card")).toBeInTheDocument();
    expect(screen.getByTestId("interests-card")).toBeInTheDocument();
  });

  it("renders nothing inside the grid if all data is missing", () => {
    const emptySummary: UserSummary = {
      profile: null,
      repositories: null,
      contributions: null,
      activity: null,
      interests: null,
      errors: [],
    };

    render(<UserSummaryGrid summary={emptySummary} />);

    expect(screen.queryByTestId("skills-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contributions-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("repos-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("interests-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("activity-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("animated-wrapper")).not.toBeInTheDocument();
  });
});
