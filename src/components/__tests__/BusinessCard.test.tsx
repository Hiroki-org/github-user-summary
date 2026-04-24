/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import BusinessCard from "../BusinessCard";
import type { UserSummary } from "@/lib/types";

// Helper function to generate mock summary
const createMockSummary = (overrides?: Partial<UserSummary>): UserSummary => ({
  profile: {
    login: "testuser",
    avatar_url: "https://example.com/avatar.jpg",
    name: "Test User",
    bio: "This is a test bio",
    company: "Test Company",
    location: "Test Location",
    blog: "https://test.com",
    twitter_username: "testuser_twitter",
    created_at: "2020-01-01T00:00:00Z",
    followers: 100,
    following: 50,
    public_repos: 10,
    orgs: [],
    pinnedRepos: [],
  },
  repositories: {
    languages: [
      { name: "TypeScript", bytes: 1000, percentage: 60, color: "#2b7489" },
      { name: "JavaScript", bytes: 600, percentage: 40, color: "#f1e05a" },
    ],
    topics: [
      { name: "react", count: 5 },
      { name: "nextjs", count: 3 },
    ],
    topRepos: [
      {
        name: "repo1",
        description: "Test repo 1",
        url: "https://github.com/repo1",
        stargazerCount: 50,
        forkCount: 10,
        primaryLanguage: { name: "TypeScript", color: "#2b7489" },
      },
    ],
    totalCount: 10,
  },
  contributions: {
    totalCommits: 500,
    totalPRs: 50,
    totalIssues: 20,
    totalReviews: 30,
    totalContributions: 600,
    longestStreak: 10,
    currentStreak: 5,
    mostActiveDay: "2023-01-01",
    calendar: [],
  },
  interests: {
    topTopics: [
      { name: "typescript", count: 10 },
      { name: "react", count: 8 },
    ],
    topLanguages: [],
    totalStarred: 50,
  },
  activity: {
    heatmap: [],
    eventBreakdown: [
      { type: "PushEvent", count: 100 },
      { type: "PullRequestEvent", count: 20 },
    ],
    totalEvents: 120,
  },
  errors: [],
  ...overrides,
});

describe("BusinessCard", () => {
  it("renders null if profile is missing", () => {
    const summary = createMockSummary({ profile: null });
    const { container } = render(<BusinessCard summary={summary} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders standard business card layout", () => {
    const summary = createMockSummary();
    render(<BusinessCard summary={summary} />);

    // Check avatar block (full block by default)
    expect(screen.getByAltText("testuser")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("renders bio when showBio is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showBio: true }}
      />
    );
    expect(screen.getByText("This is a test bio")).toBeInTheDocument();
  });

  it("renders company, location, website, twitter, and joined date when options are true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{
          showCompany: true,
          showLocation: true,
          showWebsite: true,
          showTwitter: true,
          showJoinedDate: true,
        }}
      />
    );

    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Test Location")).toBeInTheDocument();
    expect(screen.getByText("test.com")).toBeInTheDocument();
    expect(screen.getByText("@testuser_twitter")).toBeInTheDocument();
    expect(screen.getByText(/Joined Jan 2020/)).toBeInTheDocument();
  });

  it("renders stats when showStats is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showStats: true }}
        layout={{ blocks: [{ id: "stats", visible: true, column: "full" }] }}
      />
    );

    // Stats
    expect(screen.getByText("600")).toBeInTheDocument(); // Contributions
    expect(screen.getByText("100")).toBeInTheDocument(); // Followers
    expect(screen.getByText("10")).toBeInTheDocument(); // Repositories
  });

  it("renders contribution breakdown when showContributionBreakdown is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showContributionBreakdown: true }}
        layout={{ blocks: [{ id: "stats", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Commits")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Pull Requests")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders streaks when showStreaks is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showStreaks: true }}
        layout={{ blocks: [{ id: "stats", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Longest Streak")).toBeInTheDocument();
    expect(screen.getByText("10 days")).toBeInTheDocument();
    expect(screen.getByText("Current Streak")).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("renders top languages when block is visible", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        layout={{ blocks: [{ id: "topLanguages", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Top Languages")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("renders topics when showTopics is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showTopics: true }}
        layout={{ blocks: [{ id: "topLanguages", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Top Topics")).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("#nextjs")).toBeInTheDocument();
  });

  it("renders interests when showInterests is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showInterests: true }}
        layout={{ blocks: [{ id: "topLanguages", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Interests")).toBeInTheDocument();
    expect(screen.getByText("#typescript")).toBeInTheDocument();
  });

  it("renders activity breakdown when showActivityBreakdown is true", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showActivityBreakdown: true }}
        layout={{ blocks: [{ id: "topLanguages", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("PushEvent")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders top repos when block is visible", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        layout={{ blocks: [{ id: "topRepos", visible: true, column: "full" }] }}
      />
    );

    expect(screen.getByText("Top Repositories")).toBeInTheDocument();
    expect(screen.getByText("repo1")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders bio block properly when block is specifically configured", () => {
    const summary = createMockSummary();
    render(
      <BusinessCard
        summary={summary}
        options={{ showBio: true }}
        layout={{ blocks: [{ id: "bio", visible: true, column: "full" }] }}
      />
    );

    // Test for bio block explicitly
    expect(screen.getByText("This is a test bio")).toBeInTheDocument();
  });
});
