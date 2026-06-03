import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import UserSummaryGrid from "./UserSummaryGrid";
import { UserSummary } from "@/lib/types";

vi.mock("@/components/SkillsCard", () => ({
  default: () => <div data-testid="mock-skills-card">Skills Card</div>,
}));

vi.mock("@/components/ContributionsCard", () => ({
  default: () => <div data-testid="mock-contributions-card">Contributions Card</div>,
}));

vi.mock("@/components/ReposCard", () => ({
  default: () => <div data-testid="mock-repos-card">Repos Card</div>,
}));

vi.mock("@/components/InterestsCard", () => ({
  default: () => <div data-testid="mock-interests-card">Interests Card</div>,
}));

vi.mock("@/components/ActivityCard", () => ({
  default: () => <div data-testid="mock-activity-card">Activity Card</div>,
}));

vi.mock("@/components/AnimatedWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-animated-wrapper">{children}</div>,
}));

describe("UserSummaryGrid", () => {
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
      mostActiveDay: "",
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

  it("renders all cards when full summary data is provided", () => {
    render(<UserSummaryGrid summary={mockSummary} />);

    expect(screen.getByTestId("mock-skills-card")).toBeInTheDocument();
    expect(screen.getByTestId("mock-contributions-card")).toBeInTheDocument();
    expect(screen.getByTestId("mock-repos-card")).toBeInTheDocument();
    expect(screen.getByTestId("mock-interests-card")).toBeInTheDocument();
    expect(screen.getByTestId("mock-activity-card")).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-animated-wrapper")).toHaveLength(5);
  });

  it("does not render SkillsCard and ReposCard when repositories data is null", () => {
    const summaryWithoutRepos = { ...mockSummary, repositories: null };
    render(<UserSummaryGrid summary={summaryWithoutRepos} />);

    expect(screen.queryByTestId("mock-skills-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-repos-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-contributions-card")).toBeInTheDocument();
  });

  it("does not render ContributionsCard when contributions data is null", () => {
    const summaryWithoutContributions = { ...mockSummary, contributions: null };
    render(<UserSummaryGrid summary={summaryWithoutContributions} />);

    expect(screen.queryByTestId("mock-contributions-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-skills-card")).toBeInTheDocument();
  });

  it("does not render InterestsCard when interests data is null", () => {
    const summaryWithoutInterests = { ...mockSummary, interests: null };
    render(<UserSummaryGrid summary={summaryWithoutInterests} />);

    expect(screen.queryByTestId("mock-interests-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-activity-card")).toBeInTheDocument();
  });

  it("does not render ActivityCard when activity data is null", () => {
    const summaryWithoutActivity = { ...mockSummary, activity: null };
    render(<UserSummaryGrid summary={summaryWithoutActivity} />);

    expect(screen.queryByTestId("mock-activity-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-interests-card")).toBeInTheDocument();
  });

  it("renders nothing when all relevant summary data is null", () => {
    const emptySummary: UserSummary = {
      profile: null,
      repositories: null,
      contributions: null,
      activity: null,
      interests: null,
      errors: [],
    };
    render(<UserSummaryGrid summary={emptySummary} />);

    expect(screen.queryByTestId("mock-skills-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-contributions-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-repos-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-interests-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-activity-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-animated-wrapper")).not.toBeInTheDocument();
  });
});
