// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import BusinessCard from "../BusinessCard";
import type { UserSummary } from "@/lib/types";

const mockSummary: UserSummary = {
  profile: {
    login: "testuser",
    avatar_url: "https://example.com/avatar.jpg",
    name: "Test User",
    bio: "This is a test bio",
    company: "@testcompany",
    location: "Test City",
    blog: "https://test.blog",
    twitter_username: "testtwitter",
    created_at: "2020-01-01T00:00:00Z",
    followers: 100,
    following: 50,
    public_repos: 20,
    orgs: [],
    pinnedRepos: [
      {
        name: "pinned-repo",
        description: "A pinned repo",
        url: "https://github.com/testuser/pinned-repo",
        stargazerCount: 10,
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      },
    ],
  },
  repositories: {
    languages: [
      { name: "TypeScript", bytes: 1000, percentage: 50, color: "#3178c6" },
      { name: "JavaScript", bytes: 1000, percentage: 50, color: "#f1e05a" },
    ],
    topics: [
      { name: "react", count: 5 },
      { name: "testing", count: 3 },
    ],
    topRepos: [
      {
        name: "top-repo",
        description: "A top repo",
        url: "https://github.com/testuser/top-repo",
        stargazerCount: 50,
        forkCount: 5,
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      },
    ],
    totalCount: 20,
  },
  contributions: {
    totalCommits: 500,
    totalPRs: 50,
    totalIssues: 20,
    totalReviews: 10,
    totalContributions: 580,
    longestStreak: 15,
    currentStreak: 5,
    mostActiveDay: "Wednesday",
    calendar: [],
  },
  interests: {
    topTopics: [
      { name: "frontend", count: 10 },
      { name: "backend", count: 5 },
    ],
    topLanguages: [],
    totalStarred: 100,
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
};

describe("BusinessCard", () => {
  it("returns null if profile is missing", () => {
    const { container } = render(
      <BusinessCard summary={{ ...mockSummary, profile: null }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders avatar block correctly", () => {
    render(<BusinessCard summary={mockSummary} />);
    expect(screen.getByAltText("testuser")).toBeInTheDocument();
    expect(screen.getAllByText("Test User")[0]).toBeInTheDocument();
    expect(screen.getAllByText("@testuser")[0]).toBeInTheDocument();
  });

  it("renders bio block and details based on options", () => {
    render(
      <BusinessCard
        summary={mockSummary}
        options={{
          showCompany: true,
          showLocation: true,
          showWebsite: true,
          showTwitter: true,
          showJoinedDate: true,
        }}
      />
    );
    expect(screen.getAllByText("This is a test bio")[0]).toBeInTheDocument();
    expect(screen.getAllByText("@testcompany")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Test City")[0]).toBeInTheDocument();
    expect(screen.getAllByText("test.blog")[0]).toBeInTheDocument(); // https:// replaced
    expect(screen.getAllByText("@testtwitter")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Joined Jan 2020/)[0]).toBeInTheDocument();
  });

  it("renders stats block correctly based on options", () => {
    render(
      <BusinessCard
        summary={mockSummary}
        options={{
          showContributionBreakdown: true,
          showStreaks: true,
        }}
      />
    );
    // Main stats
    expect(screen.getAllByText("580")[0]).toBeInTheDocument(); // totalContributions
    expect(screen.getAllByText("100")[0]).toBeInTheDocument(); // followers
    expect(screen.getAllByText("20")[0]).toBeInTheDocument(); // public_repos

    // Breakdowns
    expect(screen.getAllByText("500")[0]).toBeInTheDocument(); // totalCommits
    expect(screen.getAllByText("50")[0]).toBeInTheDocument(); // totalPRs

    // Streaks
    expect(screen.getAllByText("15 days")[0]).toBeInTheDocument();
    expect(screen.getAllByText("5 days")[0]).toBeInTheDocument();
  });

  it("renders top languages, topics, and activity based on options", () => {
    render(
      <BusinessCard
        summary={mockSummary}
        options={{
          showTopics: true,
          showInterests: true,
          showActivityBreakdown: true,
        }}
      />
    );
    // Languages
    expect(screen.getAllByText("Top Languages")[0]).toBeInTheDocument();
    expect(screen.getAllByText("TypeScript")[0]).toBeInTheDocument();

    // Topics
    expect(screen.getAllByText("Top Topics")[0]).toBeInTheDocument();
    expect(screen.getAllByText("#react")[0]).toBeInTheDocument();

    // Interests
    expect(screen.getAllByText("Interests")[0]).toBeInTheDocument();
    expect(screen.getAllByText("#frontend")[0]).toBeInTheDocument();

    // Activity
    expect(screen.getAllByText("Recent Activity")[0]).toBeInTheDocument();
    expect(screen.getAllByText("PushEvent")[0]).toBeInTheDocument();
  });

  it("renders top repositories", () => {
    render(<BusinessCard summary={mockSummary} />);
    expect(screen.getAllByText("Top Repositories")[0]).toBeInTheDocument();
    expect(screen.getAllByText("pinned-repo")[0]).toBeInTheDocument();
  });

  it("respects layout configuration", () => {
    // Override default layout to only show avatar and stats
    const layout = {
      blocks: [
        { id: "avatar" as const, visible: true, column: "left" as const },
        { id: "stats" as const, visible: true, column: "right" as const },
        { id: "bio" as const, visible: false, column: "full" as const },
      ],
    };

    render(<BusinessCard summary={mockSummary} layout={layout} />);

    // Visible blocks
    expect(screen.getByAltText("testuser")).toBeInTheDocument();
    expect(screen.getAllByText("580")[0]).toBeInTheDocument();

    // Hidden blocks
    expect(screen.queryByText("This is a test bio")).not.toBeInTheDocument();
  });
});
