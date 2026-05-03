import { vi, beforeEach, afterEach } from "vitest";

// "server-only" を事前にモック
vi.mock("server-only", () => ({}));

// fetch をグローバルモック
export const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------- ヘルパー ----------

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

// ---------- テストデータ ----------

export const MOCK_USER = {
  login: "testuser",
  avatar_url: "https://avatars.githubusercontent.com/u/12345",
  name: "Test User",
  bio: "A software developer",
  company: "TestCorp",
  location: "Tokyo, Japan",
  blog: "https://testuser.dev",
  twitter_username: "testuser",
  created_at: "2020-01-15T00:00:00Z",
  followers: 100,
  following: 50,
  public_repos: 30,
};

export const MOCK_ORGS = [
  { login: "org1", avatar_url: "https://avatars.githubusercontent.com/o/1" },
  { login: "org2", avatar_url: "https://avatars.githubusercontent.com/o/2" },
];

export const MOCK_PINNED_RESPONSE = {
  data: {
    user: {
      pinnedItems: {
        nodes: [
          {
            name: "awesome-project",
            description: "An awesome project",
            url: "https://github.com/testuser/awesome-project",
            stargazerCount: 150,
            primaryLanguage: { name: "TypeScript", color: "#3178c6" },
          },
        ],
      },
    },
  },
};

export const MOCK_REPOS_GRAPHQL = {
  data: {
    user: {
      repositories: {
        totalCount: 3,
        nodes: [
          {
            name: "repo-a",
            description: "First repo",
            url: "https://github.com/testuser/repo-a",
            stargazerCount: 50,
            forkCount: 10,
            isFork: false,
            primaryLanguage: { name: "TypeScript", color: "#3178c6" },
            languages: {
              edges: [
                { size: 5000, node: { name: "TypeScript", color: "#3178c6" } },
                { size: 2000, node: { name: "JavaScript", color: "#f1e05a" } },
              ],
            },
            repositoryTopics: {
              nodes: [{ topic: { name: "react" } }, { topic: { name: "nextjs" } }],
            },
          },
          {
            name: "repo-b",
            description: "Second repo",
            url: "https://github.com/testuser/repo-b",
            stargazerCount: 30,
            forkCount: 5,
            isFork: false,
            primaryLanguage: { name: "Python", color: "#3572A5" },
            languages: {
              edges: [{ size: 8000, node: { name: "Python", color: "#3572A5" } }],
            },
            repositoryTopics: {
              nodes: [{ topic: { name: "machine-learning" } }],
            },
          },
          {
            name: "forked-repo",
            description: "A fork",
            url: "https://github.com/testuser/forked-repo",
            stargazerCount: 0,
            forkCount: 0,
            isFork: true,
            primaryLanguage: null,
            languages: { edges: [] },
            repositoryTopics: { nodes: [] },
          },
        ],
      },
    },
  },
};

export const MOCK_CONTRIBUTIONS = {
  data: {
    user: {
      contributionsCollection: {
        totalCommitContributions: 500,
        totalPullRequestContributions: 80,
        totalIssueContributions: 40,
        totalPullRequestReviewContributions: 60,
        contributionCalendar: {
          totalContributions: 680, monthlyContributions: 0, weeklyContributions: 0,
          weeks: [
            {
              contributionDays: [
                { date: "2024-01-01", contributionCount: 5 },
                { date: "2024-01-02", contributionCount: 3 },
                { date: "2024-01-03", contributionCount: 0 },
                { date: "2024-01-04", contributionCount: 7 },
                { date: "2024-01-05", contributionCount: 2 },
                { date: "2024-01-06", contributionCount: 0 },
                { date: "2024-01-07", contributionCount: 1 },
              ],
            },
          ],
        },
      },
    },
  },
};

export const MOCK_EVENTS = [
  { type: "PushEvent", created_at: "2024-01-15T10:30:00Z" },
  { type: "PushEvent", created_at: "2024-01-15T14:00:00Z" },
  { type: "PullRequestEvent", created_at: "2024-01-16T09:00:00Z" },
  { type: "IssuesEvent", created_at: "2024-01-17T11:00:00Z" },
];

export const MOCK_STARRED_PAGE1 = [
  { topics: ["react", "typescript", "frontend"], language: "TypeScript" },
  { topics: ["react", "ui"], language: "TypeScript" },
  { topics: ["machine-learning", "python"], language: "Python" },
];
