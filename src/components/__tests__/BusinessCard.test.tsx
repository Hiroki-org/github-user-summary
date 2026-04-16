import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { CardLayout, UserSummary } from "@/lib/types";
import BusinessCard from "@/components/BusinessCard";

const summary: UserSummary = {
  profile: {
    login: "test-user",
    avatar_url: "https://example.com/avatar.png",
    name: "Test User",
    bio: "Testing business card rendering.",
    company: null,
    location: null,
    blog: null,
    twitter_username: null,
    created_at: "2020-01-01T00:00:00Z",
    followers: 10,
    following: 2,
    public_repos: 5,
    orgs: [],
    pinnedRepos: [],
  },
  repositories: {
    languages: [
      { name: "TypeScript", bytes: 1000, percentage: 70, color: "#3178c6" },
    ],
    topics: [
      {
        name: "this-is-a-very-long-topic-name-that-should-wrap-in-the-card",
        count: 1,
      },
    ],
    topRepos: [
      {
        name: "repo-one",
        description: null,
        url: "https://example.com/repo-one",
        stargazerCount: 123,
        forkCount: 20,
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      },
    ],
    totalCount: 1,
  },
  contributions: {
    totalCommits: 100,
    totalPRs: 20,
    totalIssues: 5,
    totalReviews: 30,
    totalContributions: 155,
    longestStreak: 10,
    currentStreak: 4,
    mostActiveDay: "Monday",
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

const minimalLayout: CardLayout = {
  blocks: [{ id: "topLanguages", visible: true, column: "right" }],
};

const profileHeaderLayout: CardLayout = {
  blocks: [{ id: "avatar", visible: true, column: "left" }],
};

describe("BusinessCard", () => {
  it("applies wrapping class to long profile name", () => {
    const longName = "Very Very Very Long Display Name That Should Wrap In Header";
    const longSummary: UserSummary = {
      ...summary,
      profile: {
        ...summary.profile!,
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
      ...summary,
      profile: {
        ...summary.profile!,
        login: longLogin,
      },
    };

    render(<BusinessCard summary={longSummary} layout={profileHeaderLayout} />);

    const loginEl = screen.getByText(`@${longLogin}`);
    expect(loginEl.className).toContain("break-all");
  });

  it("uses flexible height instead of fixed 630px height", () => {
    render(<BusinessCard summary={summary} layout={minimalLayout} />);

    const root = screen.getByTestId("business-card-root");
    const classes = root.className.split(/\s+/);
    expect(classes).toContain("min-h-[630px]");
    expect(classes).not.toContain("h-[630px]");
  });

  it("applies wrapping class to long topic badges", () => {
    render(
      <BusinessCard
        summary={summary}
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
