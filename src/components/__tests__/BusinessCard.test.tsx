// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";

import BusinessCard from "@/components/BusinessCard";
import type { CardLayout, UserSummary } from "@/lib/types";

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

const minimalLayout: CardLayout = {
  blocks: [{ id: "topLanguages", visible: true, column: "right" }],
};

const profileHeaderLayout: CardLayout = {
  blocks: [{ id: "avatar", visible: true, column: "left" }],
};

describe("BusinessCard", () => {
  it("returns null if profile is missing", () => {
    const { container } = render(
      <BusinessCard summary={{ ...mockSummary, profile: null }} />,
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
      />,
    );
    expect(screen.getAllByText("This is a test bio")[0]).toBeInTheDocument();
    expect(screen.getAllByText("@testcompany")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Test City")[0]).toBeInTheDocument();
    expect(screen.getAllByText("test.blog")[0]).toBeInTheDocument();
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
      />,
    );
    expect(screen.getAllByText("580")[0]).toBeInTheDocument();
    expect(screen.getAllByText("100")[0]).toBeInTheDocument();
    expect(screen.getAllByText("20")[0]).toBeInTheDocument();
    expect(screen.getAllByText("500")[0]).toBeInTheDocument();
    expect(screen.getAllByText("50")[0]).toBeInTheDocument();
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
      />,
    );
    expect(screen.getAllByText("Top Languages")[0]).toBeInTheDocument();
    expect(screen.getAllByText("TypeScript")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Top Topics")[0]).toBeInTheDocument();
    expect(screen.getAllByText("#react")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Interests")[0]).toBeInTheDocument();
    expect(screen.getAllByText("#frontend")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Recent Activity")[0]).toBeInTheDocument();
    expect(screen.getAllByText("PushEvent")[0]).toBeInTheDocument();
  });

  it("renders top repositories", () => {
    render(<BusinessCard summary={mockSummary} />);
    expect(screen.getAllByText("Top Repositories")[0]).toBeInTheDocument();
    expect(screen.getAllByText("pinned-repo")[0]).toBeInTheDocument();
  });

  it("respects layout configuration", () => {
    const layout: CardLayout = {
      blocks: [
        { id: "avatar", visible: true, column: "left" },
        { id: "stats", visible: true, column: "right" },
        { id: "bio", visible: false, column: "full" },
      ],
    };

    render(<BusinessCard summary={mockSummary} layout={layout} />);

    expect(screen.getByAltText("testuser")).toBeInTheDocument();
    expect(screen.getAllByText("580")[0]).toBeInTheDocument();
    expect(screen.queryByText("This is a test bio")).not.toBeInTheDocument();
  });

  it("applies wrapping class to long profile name", () => {
    const longName = "Very Very Very Long Display Name That Should Wrap In Header";
    const longSummary: UserSummary = {
      ...mockSummary,
      profile: {
        ...mockSummary.profile!,
        name: longName,
      },
    };

    render(<BusinessCard summary={longSummary} layout={profileHeaderLayout} />);

    const nameEl = screen.getByRole("heading", { name: longName });
    expect(nameEl.className).toContain("break-words");
  });

  it("applies wrapping class to long profile login", () => {
    const longLogin = "this-is-a-very-very-very-long-login-name";
    const longSummary: UserSummary = {
      ...mockSummary,
      profile: {
        ...mockSummary.profile!,
        login: longLogin,
      },
    };

    render(<BusinessCard summary={longSummary} layout={profileHeaderLayout} />);

    const loginEl = screen.getByText(`@${longLogin}`);
    expect(loginEl.className).toContain("break-all");
  });

  it("uses flexible height instead of fixed 630px height", () => {
    render(<BusinessCard summary={mockSummary} layout={minimalLayout} />);

    const root = screen.getByTestId("business-card-root");
    const classes = root.className.split(/\s+/);
    expect(classes).toContain("min-h-[630px]");
    expect(classes).not.toContain("h-[630px]");
  });

  it("applies wrapping class to long topic badges", () => {
    render(
      <BusinessCard
        summary={{
          ...mockSummary,
          repositories: {
            ...mockSummary.repositories!,
            topics: [
              {
                name: "this-is-a-very-long-topic-name-that-should-wrap-in-the-card",
                count: 1,
              },
            ],
          },
        }}
        layout={minimalLayout}
        options={{ showTopics: true }}
      />,
    );

    const badge = screen.getByText(
      "#this-is-a-very-long-topic-name-that-should-wrap-in-the-card",
    );
    expect(badge.className).toContain("break-all");
  });
});
