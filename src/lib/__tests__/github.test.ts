import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Unit tests for github.ts
 *
 * github.ts includes `import "server-only"`, so it requires mocking during tests.
 * Simulate API responses using fetch mock,
 * and verify data transformation logic.
 *
 * Test targets:
 * - fetchUserProfile: Fetch profile, organization, and pinned repos
 * - fetchRepositories: Fetch repos, language stats, and topic aggregate
 * - fetchContributions: Fetch contribution stats and calculate streak
 * - fetchActivity: Fetch heatmap and event breakdown aggregate
 * - fetchStarredRepos: Estimate interests from starred repos
 * - fetchUserSummary: Fetch all sections in parallel + handle partial failures
 * - Error handling: 404, 403, 500
 */

// mock "server-only" beforehand
vi.mock("server-only", () => ({}));

// mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------- Helpers ----------

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

// ---------- Test Data ----------

const MOCK_USER = {
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

const MOCK_ORGS = [
  { login: "org1", avatar_url: "https://avatars.githubusercontent.com/o/1" },
  { login: "org2", avatar_url: "https://avatars.githubusercontent.com/o/2" },
];

const MOCK_PINNED_RESPONSE = {
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

const MOCK_REPOS_GRAPHQL = {
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

const MOCK_CONTRIBUTIONS = {
  data: {
    user: {
      contributionsCollection: {
        totalCommitContributions: 500,
        totalPullRequestContributions: 80,
        totalIssueContributions: 40,
        totalPullRequestReviewContributions: 60,
        contributionCalendar: {
          totalContributions: 680,
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

const MOCK_EVENTS = [
  { type: "PushEvent", created_at: "2024-01-15T10:30:00Z" },
  { type: "PushEvent", created_at: "2024-01-15T14:00:00Z" },
  { type: "PullRequestEvent", created_at: "2024-01-16T09:00:00Z" },
  { type: "IssuesEvent", created_at: "2024-01-17T11:00:00Z" },
];

const MOCK_STARRED_PAGE1 = [
  { topics: ["react", "typescript", "frontend"], language: "TypeScript" },
  { topics: ["react", "ui"], language: "TypeScript" },
  { topics: ["machine-learning", "python"], language: "Python" },
];

// ---------- fetchUserProfile ----------

describe("fetchUserProfile", () => {
  it("fetches and combines profile, organization, and pinned repos correctly", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_USER))                    // GET /users/testuser
      .mockResolvedValueOnce(jsonResponse(MOCK_ORGS))                    // GET /users/testuser/orgs
      .mockResolvedValueOnce(jsonResponse(MOCK_PINNED_RESPONSE));        // POST graphql

    const { fetchUserProfile } = await import("../github");
    const result = await fetchUserProfile("testuser", "fake-token");

    expect(result.login).toBe("testuser");
    expect(result.name).toBe("Test User");
    expect(result.bio).toBe("A software developer");
    expect(result.followers).toBe(100);
    expect(result.orgs).toHaveLength(2);
    expect(result.orgs[0].login).toBe("org1");
    expect(result.pinnedRepos).toHaveLength(1);
    expect(result.pinnedRepos[0].name).toBe("awesome-project");
    expect(result.pinnedRepos[0].stargazerCount).toBe(150);
  });

  it("returns empty pinned repos when token is missing", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_USER))
      .mockResolvedValueOnce(jsonResponse(MOCK_ORGS));

    const { fetchUserProfile } = await import("../github");
    const result = await fetchUserProfile("testuser");

    expect(result.login).toBe("testuser");
    expect(result.pinnedRepos).toEqual([]);
  });

  it("throws UserNotFoundError when user does not exist", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 404));

    const { fetchUserProfile } = await import("../github");
    const { UserNotFoundError } = await import("../types");

    await expect(fetchUserProfile("nonexistent", "fake-token")).rejects.toThrow(
      UserNotFoundError
    );
  });

  it("throws RateLimitError on rate limit", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(null, 403, { "X-RateLimit-Reset": "1700000000" })
    );

    const { fetchUserProfile } = await import("../github");
    const { RateLimitError } = await import("../types");

    await expect(fetchUserProfile("testuser", "fake-token")).rejects.toThrow(
      RateLimitError
    );
  });
});

// ---------- fetchRepositories ----------

describe("fetchRepositories", () => {
  it("aggregates language stats correctly from GraphQL response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL)); // POST graphql

    const { fetchRepositories } = await import("../github");
    const result = await fetchRepositories("testuser", "fake-token");

    // 2 repos excluding forks
    expect(result.totalCount).toBe(2);

    // Language stats: Python 8000bytes, TypeScript 5000bytes, JavaScript 2000bytes
    expect(result.languages.length).toBeGreaterThanOrEqual(2);
    expect(result.languages[0].name).toBe("Python");
    expect(result.languages[0].bytes).toBe(8000);
    expect(result.languages[1].name).toBe("TypeScript");
    expect(result.languages[1].bytes).toBe(5000);
  });

  it("aggregates topics correctly from GraphQL response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL));

    const { fetchRepositories } = await import("../github");
    const result = await fetchRepositories("testuser", "fake-token");

    const topicNames = result.topics.map((t) => t.name);
    expect(topicNames).toContain("react");
    expect(topicNames).toContain("nextjs");
    expect(topicNames).toContain("machine-learning");
  });

  it("calculates language percentages correctly", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL));

    const { fetchRepositories } = await import("../github");
    const result = await fetchRepositories("testuser", "fake-token");

    const totalBytes = result.languages.reduce((sum, l) => sum + l.bytes, 0);
    expect(totalBytes).toBe(15000); // 5000 + 2000 + 8000

    for (const lang of result.languages) {
      const expectedPct = Math.round((lang.bytes / totalBytes) * 1000) / 10;
      expect(lang.percentage).toBe(expectedPct);
    }
  });

  it("returns up to 5 topRepos ordered by stargazerCount", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL));

    const { fetchRepositories } = await import("../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.topRepos.length).toBeLessThanOrEqual(5);
    expect(result.topRepos[0].name).toBe("repo-a");
    expect(result.topRepos[0].stargazerCount).toBe(50);
  });

  it("falls back to REST when token is missing", async () => {
    const restRepos = [
      {
        name: "rest-repo",
        description: "A REST repo",
        html_url: "https://github.com/testuser/rest-repo",
        stargazers_count: 25,
        forks_count: 3,
        fork: false,
        language: "JavaScript",
        topics: ["web"],
      },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(restRepos));

    const { fetchRepositories } = await import("../github");
    const result = await fetchRepositories("testuser");

    expect(result.totalCount).toBe(1);
    expect(result.topRepos[0].name).toBe("rest-repo");
    expect(result.languages[0].name).toBe("JavaScript");
  });

  it("throws UserNotFoundError when user does not exist", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { user: null } })
    );

    const { fetchRepositories } = await import("../github");
    const { UserNotFoundError } = await import("../types");

    await expect(fetchRepositories("nonexistent", "fake-token")).rejects.toThrow(
      UserNotFoundError
    );
  });
});

// ---------- fetchContributions ----------

describe("fetchContributions", () => {
  it("returns correct number of commits, PRs, issues, and reviews", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../github");
    const result = await fetchContributions("testuser", "fake-token");

    expect(result.totalCommits).toBe(500);
    expect(result.totalPRs).toBe(80);
    expect(result.totalIssues).toBe(40);
    expect(result.totalReviews).toBe(60);
    expect(result.totalContributions).toBe(680);
  });

  it("calculates longest streak correctly", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../github");
    const result = await fetchContributions("testuser", "fake-token");

    // Calendar: 5, 3, 0, 7, 2, 0, 1
    // Streak: [5,3] = 2, [7,2] = 2, [1] = 1
    expect(result.longestStreak).toBe(2);
  });

  it("calculates current streak correctly", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../github");
    const result = await fetchContributions("testuser", "fake-token");

    // Last day (2024-01-07) = 1, so currentStreak = 1
    expect(result.currentStreak).toBe(1);
  });

  it("sorts calendar data by date", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../github");
    const result = await fetchContributions("testuser", "fake-token");

    for (let i = 1; i < result.calendar.length; i++) {
      expect(result.calendar[i].date >= result.calendar[i - 1].date).toBe(true);
    }
  });

  it("throws GitHubApiError when token is missing", async () => {
    const { fetchContributions } = await import("../github");
    const { GitHubApiError } = await import("../types");

    await expect(fetchContributions("testuser")).rejects.toThrow(
      GitHubApiError
    );
  });
});

// ---------- fetchActivity ----------

describe("fetchActivity", () => {
  it("initializes heatmap to 7x24", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_EVENTS));

    const { fetchActivity } = await import("../github");
    const result = await fetchActivity("testuser", "fake-token");

    expect(result.heatmap).toHaveLength(7);
    for (const row of result.heatmap) {
      expect(row).toHaveLength(24);
    }
  });

  it("adds event to correct day/hour slot", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_EVENTS));

    const { fetchActivity } = await import("../github");
    const result = await fetchActivity("testuser", "fake-token");

    // 2024-01-15 = Monday (day=1), 10:30 → heatmap[1][10] += 1
    expect(result.heatmap[1][10]).toBeGreaterThanOrEqual(1);
    // 2024-01-15 = Monday (day=1), 14:00 → heatmap[1][14] += 1
    expect(result.heatmap[1][14]).toBeGreaterThanOrEqual(1);
  });

  it("orders event breakdown by count", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_EVENTS));

    const { fetchActivity } = await import("../github");
    const result = await fetchActivity("testuser", "fake-token");

    // PushEvent: 2, PullRequestEvent: 1, IssuesEvent: 1
    expect(result.eventBreakdown[0].type).toBe("PushEvent");
    expect(result.eventBreakdown[0].count).toBe(2);
  });

  it("totalEvents matches total number of events", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_EVENTS));

    const { fetchActivity } = await import("../github");
    const result = await fetchActivity("testuser", "fake-token");

    expect(result.totalEvents).toBe(MOCK_EVENTS.length);
  });

  it("handles empty event array correctly", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../github");
    const result = await fetchActivity("testuser", "fake-token");

    expect(result.totalEvents).toBe(0);
    expect(result.eventBreakdown).toEqual([]);
    // heatmap is all zeros
    const totalHeatmap = result.heatmap.flat().reduce((a, b) => a + b, 0);
    expect(totalHeatmap).toBe(0);
  });
});

// ---------- fetchStarredRepos ----------

describe("fetchStarredRepos", () => {
  it("aggregates topics correctly from starred repos", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1));

    const { fetchStarredRepos } = await import("../github");
    const result = await fetchStarredRepos("testuser", "fake-token");

    const topicNames = result.topTopics.map((t) => t.name);
    expect(topicNames).toContain("react");
    expect(topicNames).toContain("typescript");

    // react is in 2 repos, so count = 2
    const reactTopic = result.topTopics.find((t) => t.name === "react");
    expect(reactTopic?.count).toBe(2);
  });

  it("aggregates languages correctly from starred repos", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1));

    const { fetchStarredRepos } = await import("../github");
    const result = await fetchStarredRepos("testuser", "fake-token");

    const langNames = result.topLanguages.map((l) => l.name);
    expect(langNames).toContain("TypeScript");
    expect(langNames).toContain("Python");

    // TypeScript is in 2 repos
    const tsLang = result.topLanguages.find((l) => l.name === "TypeScript");
    expect(tsLang?.count).toBe(2);
  });

  it("totalStarred matches number of repos", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1));

    const { fetchStarredRepos } = await import("../github");
    const result = await fetchStarredRepos("testuser", "fake-token");

    expect(result.totalStarred).toBe(3);
  });
});

// ---------- fetchUserSummary ----------

describe("fetchUserSummary", () => {
  /**
   * fetchUserSummary executes 5 functions in parallel using Promise.allSettled,
   * so fetch call order is non-deterministic. Return mock based on URL.
   */
  function setupUrlBasedMock() {
    // GraphQL call counter (returns different data in order: pinned -> repos -> contributions)
    let graphqlCallCount = 0;

    mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

      // GraphQL endpoint
      if (urlStr.includes("/graphql")) {
        graphqlCallCount++;
        const body = options?.body ? JSON.parse(options.body as string) : {};
        const query = body.query || "";

        if (query.includes("pinnedItems")) {
          return Promise.resolve(jsonResponse(MOCK_PINNED_RESPONSE));
        }
        if (query.includes("repositories")) {
          return Promise.resolve(jsonResponse(MOCK_REPOS_GRAPHQL));
        }
        if (query.includes("contributionsCollection")) {
          return Promise.resolve(jsonResponse(MOCK_CONTRIBUTIONS));
        }
        // fallback for unknown GraphQL
        return Promise.resolve(jsonResponse({ data: {} }));
      }

      // REST endpoints
      if (urlStr.includes("/users/") && urlStr.includes("/orgs")) {
        return Promise.resolve(jsonResponse(MOCK_ORGS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/events/public")) {
        return Promise.resolve(jsonResponse(MOCK_EVENTS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/starred")) {
        return Promise.resolve(jsonResponse(MOCK_STARRED_PAGE1));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/repos")) {
        return Promise.resolve(jsonResponse([])); // REST repos fallback (not used with token)
      }
      if (urlStr.match(/\/users\/[^/]+$/)) {
        return Promise.resolve(jsonResponse(MOCK_USER));
      }

      return Promise.resolve(jsonResponse({ error: "Unknown endpoint" }, 404));
    });
  }

  it("returns complete UserSummary when all sections succeed", async () => {
    setupUrlBasedMock();

    const { fetchUserSummary } = await import("../github");
    const result = await fetchUserSummary("testuser", "fake-token");

    expect(result.profile).not.toBeNull();
    expect(result.profile?.login).toBe("testuser");
    expect(result.repositories).not.toBeNull();
    expect(result.contributions).not.toBeNull();
    expect(result.activity).not.toBeNull();
    expect(result.interests).not.toBeNull();
    expect(result.errors).toHaveLength(0);
  });

  it("returns other sections with error info when some sections fail", async () => {
    // Set mock based on URL and return 500 for repos GraphQL
    mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

      if (urlStr.includes("/graphql")) {
        const body = options?.body ? JSON.parse(options.body as string) : {};
        const query = body.query || "";

        if (query.includes("pinnedItems")) {
          return Promise.resolve(jsonResponse(MOCK_PINNED_RESPONSE));
        }
        if (query.includes("repositories")) {
          return Promise.resolve(jsonResponse({ error: "Server Error" }, 500));
        }
        if (query.includes("contributionsCollection")) {
          return Promise.resolve(jsonResponse(MOCK_CONTRIBUTIONS));
        }
      }

      if (urlStr.includes("/users/") && urlStr.includes("/orgs")) {
        return Promise.resolve(jsonResponse(MOCK_ORGS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/events/public")) {
        return Promise.resolve(jsonResponse(MOCK_EVENTS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/starred")) {
        return Promise.resolve(jsonResponse(MOCK_STARRED_PAGE1));
      }
      if (urlStr.match(/\/users\/[^/]+$/)) {
        return Promise.resolve(jsonResponse(MOCK_USER));
      }

      return Promise.resolve(jsonResponse({ error: "Unknown" }, 404));
    });

    const { fetchUserSummary } = await import("../github");
    const result = await fetchUserSummary("testuser", "fake-token");

    expect(result.profile).not.toBeNull();
    expect(result.activity).not.toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.section === "repositories")).toBe(true);
  });

  it("re-throws UserNotFoundError when profile is 404", async () => {
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

      // profile REST → 404
      if (urlStr.match(/\/users\/[^/]+$/) && !urlStr.includes("/orgs")) {
        return Promise.resolve(jsonResponse(null, 404));
      }

      // Fail other endpoints too (no problem since it throws if profile fails)
      return Promise.resolve(jsonResponse([], 200));
    });

    const { fetchUserSummary } = await import("../github");
    const { UserNotFoundError } = await import("../types");

    await expect(fetchUserSummary("nonexistent", "fake-token")).rejects.toThrow(
      UserNotFoundError
    );
  });
});
