import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { getMostActiveDayFromCalendar, getMostActiveHour } from "@/lib/yearInReviewUtils";
import { fetchYearInReviewData, fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";
import { logger } from "@/lib/logger";
import { GitHubApiError, RateLimitError, UserNotFoundError } from "@/lib/types";

// "server-only" を事前にモック
vi.mock("server-only", () => ({}));

export const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

describe("githubYearInReview helpers", () => {
    it("returns the hour with the highest summed activity", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[1][10] = 2;
        heatmap[2][10] = 3;
        heatmap[4][18] = 4;

        expect(getMostActiveHour(heatmap)).toBe(10);
    });

    it("returns the most active weekday from a contribution calendar", () => {
        const calendar = [
            { date: "2025-01-06", count: 3 },
            { date: "2025-01-13", count: 2 },
            { date: "2025-01-07", count: 1 },
            { date: "2025-01-08", count: 1 },
        ];

        expect(getMostActiveDayFromCalendar(calendar)).toBe("Monday");
    });
});

describe("fetchYearInReviewData error paths", () => {
    it("throws GitHubApiError when token is not provided", async () => {
        await expect(fetchYearInReviewData("testuser", 2024)).rejects.toThrow(GitHubApiError);

        try {
            await fetchYearInReviewData("testuser", 2024);
        } catch (error) {
            expect(error).toBeInstanceOf(GitHubApiError);
            expect((error as GitHubApiError).message).toBe("Year in Review requires authentication token");
            expect((error as GitHubApiError).status).toBe(401);
        }
    });

    it("throws UserNotFoundError when query returns null user", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({ data: { user: null } }));
        });

        await expect(fetchYearInReviewData("nonexistent", 2024, "fake-token")).rejects.toThrow(UserNotFoundError);
    });

    it("throws RateLimitError when API returns 403", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse(null, 403, { "X-RateLimit-Reset": "1700000000" }));
        });

        await expect(fetchYearInReviewData("testuser", 2024, "fake-token")).rejects.toThrow(RateLimitError);
    });

    it("throws GitHubApiError when API returns other errors", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse(null, 500));
        });

        await expect(fetchYearInReviewData("testuser", 2024, "fake-token")).rejects.toThrow(GitHubApiError);
    });
});

describe("fetchYearInReviewData success paths", () => {
    it("successfully fetches and builds YearInReviewData using batch GraphQL query", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    // combined stats and repos query
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
                                    totalCommitContributions: 100,
                                    totalPullRequestContributions: 10,
                                    totalIssueContributions: 5,
                                    totalPullRequestReviewContributions: 2,
                                    contributionCalendar: {
                                        totalContributions: 117,
                                        weeks: [
                                            {
                                                contributionDays: [
                                                    { date: "2024-01-01", contributionCount: 5 }
                                                ]
                                            }
                                        ]
                                    },
                                    commitContributionsByRepository: [
                                        {
                                            repository: { owner: { login: "user1" }, name: "repo1" },
                                            contributions: { totalCount: 50 }
                                        },
                                        {
                                            repository: { owner: { login: "user2" }, name: "repo2" },
                                            contributions: { totalCount: 20 }
                                        }
                                    ],
                                    pullRequestContributionsByRepository: [],
                                    issueContributionsByRepository: []
                                }
                            }
                        }
                    }));
                }
                if (callCount === 2) {
                    // fetchCommitDatesForTopRepos batch query
                    return Promise.resolve(jsonResponse({
                        data: {
                            repo0: {
                                defaultBranchRef: {
                                    target: {
                                        history: {
                                            nodes: [
                                                { author: { date: "2024-05-01T10:00:00Z" } },
                                                { author: { date: "2024-05-02T11:00:00Z" } }
                                            ]
                                        }
                                    }
                                }
                            },
                            repo1: {
                                defaultBranchRef: {
                                    target: {
                                        history: {
                                            nodes: [
                                                { author: { date: "2024-06-01T14:00:00Z" } }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const data = await fetchYearInReviewData("testuser", 2024, "fake-token");
        expect(data.year).toBe(2024);
        expect(data.totalCommits).toBe(100);
        expect(data.topRepository?.name).toBe("user1/repo1");
    });

    it("handles zero repository candidates", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    // combined query
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
                                    totalCommitContributions: 0,
                                    totalPullRequestContributions: 0,
                                    totalIssueContributions: 0,
                                    totalPullRequestReviewContributions: 0,
                                    contributionCalendar: {
                                        totalContributions: 0,
                                        weeks: []
                                    },
                                    commitContributionsByRepository: [],
                                    pullRequestContributionsByRepository: [],
                                    issueContributionsByRepository: []
                                }
                            }
                        }
                    }));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const data = await fetchYearInReviewData("testuser", 2024, "fake-token");
        expect(data.totalCommits).toBe(0);
        expect(data.topRepository).toBeNull();
    });

    it("falls back to empty array if fetchCommitDatesForTopRepos batch query fails", async () => {
        let callCount = 0;
        const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    // combined query
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
                                    totalCommitContributions: 10,
                                    totalPullRequestContributions: 0,
                                    totalIssueContributions: 0,
                                    totalPullRequestReviewContributions: 0,
                                    contributionCalendar: {
                                        totalContributions: 10,
                                        weeks: []
                                    },
                                    commitContributionsByRepository: [
                                        {
                                            repository: { owner: { login: "user1" }, name: "repo1" },
                                            contributions: { totalCount: 10 }
                                        }
                                    ],
                                    pullRequestContributionsByRepository: [],
                                    issueContributionsByRepository: []
                                }
                            }
                        }
                    }));
                }
                if (callCount === 2) {
                    // Fail the batch query
                    return Promise.resolve(jsonResponse(null, 500));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        try {
            const data = await fetchYearInReviewData("testuser", 2024, "fake-token");
            expect(data.year).toBe(2024);
            expect(loggerSpy).toHaveBeenCalled();
        } finally {
            loggerSpy.mockRestore();
        }
    });
});

describe("fetchCommitActivityHeatmap", () => {
    it("successfully fetches and builds commit activity heatmap", async () => {
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                return Promise.resolve(jsonResponse({
                    data: {
                        user: {
                            id: "123",
                            contributionsCollection: {
                                commitContributionsByRepository: [
                                    {
                                        repository: { owner: { login: "user1" }, name: "repo1" },
                                        contributions: { totalCount: 50 }
                                    }
                                ],
                                pullRequestContributionsByRepository: [],
                                issueContributionsByRepository: []
                            }
                        }
                    }
                }));
            }
            if (urlStr.includes("/repos/user1/repo1/commits")) {
                return Promise.resolve(jsonResponse([
                    { commit: { author: { date: "2024-01-01T10:00:00Z" } } }
                ]));
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const heatmap = await fetchCommitActivityHeatmap("testuser", 2024, "fake-token");
        expect(heatmap.length).toBe(7);
        expect(heatmap[1][10]).toBe(1); // 2024-01-01 is Monday (index 1)
    });

    it("returns empty heatmap when no top repository found", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({
                data: {
                    user: {
                        id: "123",
                        contributionsCollection: {
                            commitContributionsByRepository: [],
                            pullRequestContributionsByRepository: [],
                            issueContributionsByRepository: []
                        }
                    }
                }
            }));
        });

        const heatmap = await fetchCommitActivityHeatmap("testuser", 2024, "fake-token");
        expect(heatmap.every(row => row.every(val => val === 0))).toBe(true);
    });

    it("throws UserNotFoundError when query returns null user", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({ data: { user: null } }));
        });

        await expect(fetchCommitActivityHeatmap("nonexistent", 2024, "fake-token")).rejects.toThrow(UserNotFoundError);
    });

    it("throws GitHubApiError when token is missing", async () => {
        await expect(fetchCommitActivityHeatmap("testuser", 2024)).rejects.toThrow(GitHubApiError);
    });

    it("returns empty heatmap when REST API fails", async () => {
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                return Promise.resolve(jsonResponse({
                    data: {
                        user: {
                            id: "123",
                            contributionsCollection: {
                                commitContributionsByRepository: [
                                    {
                                        repository: { owner: { login: "user1" }, name: "repo1" },
                                        contributions: { totalCount: 50 }
                                    }
                                ],
                                pullRequestContributionsByRepository: [],
                                issueContributionsByRepository: []
                            }
                        }
                    }
                }));
            }
            return Promise.resolve(jsonResponse(null, 500));
        });

        const heatmap = await fetchCommitActivityHeatmap("testuser", 2024, "fake-token");
        expect(heatmap.every(row => row.every(val => val === 0))).toBe(true);
    });
});

describe("fetchYearInReviewData safety checks", () => {
    it("handles missing collection fields gracefully", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({
                data: {
                    user: {
                        id: "123",
                        contributionsCollection: {
                            totalCommitContributions: 10,
                            totalPullRequestContributions: 0,
                            totalIssueContributions: 0,
                            totalPullRequestReviewContributions: 0,
                            contributionCalendar: {
                                totalContributions: 10,
                                weeks: []
                            }
                            // commitContributionsByRepository and others are missing
                        }
                    }
                }
            }));
        });

        const data = await fetchYearInReviewData("testuser", 2024, "fake-token");
        expect(data.totalCommits).toBe(10);
        expect(data.topRepository).toBeNull();
    });
});

describe("fetchYearInReviewData additional coverage", () => {
    it("throws 500 GitHubApiError for non-Error thrown objects", async () => {
        mockFetch.mockImplementation(() => {
            throw "String error";
        });

        await expect(fetchYearInReviewData("testuser", 2024, "fake-token")).rejects.toThrow(GitHubApiError);
        try {
            await fetchYearInReviewData("testuser", 2024, "fake-token");
        } catch (error) {
            expect(error).toBeInstanceOf(GitHubApiError);
            expect((error as GitHubApiError).status).toBe(500);
            expect((error as GitHubApiError).message).toBe("Failed to fetch year in review data");
        }
    });

    it("throws 500 GitHubApiError for unknown errors", async () => {
        mockFetch.mockImplementation(() => {
            throw new Error("Unexpected crash");
        });

        await expect(fetchYearInReviewData("testuser", 2024, "fake-token")).rejects.toThrow(GitHubApiError);
        try {
            await fetchYearInReviewData("testuser", 2024, "fake-token");
        } catch (error) {
            expect(error).toBeInstanceOf(GitHubApiError);
            expect((error as GitHubApiError).status).toBe(500);
            expect((error as GitHubApiError).message).toBe("Unexpected crash");
        }
    });

    it("handles partial repository data in mergeTopRepository", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({
                data: {
                    user: {
                        id: "123",
                        contributionsCollection: {
                            totalCommitContributions: 100,
                            totalPullRequestContributions: 0,
                            totalIssueContributions: 0,
                            totalPullRequestReviewContributions: 0,
                            contributionCalendar: { totalContributions: 100, weeks: [] },
                            commitContributionsByRepository: [
                                { repository: { owner: { login: "user1" }, name: "repo1" }, contributions: { totalCount: 50 } }
                            ],
                            // pullRequestContributionsByRepository and issueContributionsByRepository missing
                        }
                    }
                }
            }));
        });

        const data = await fetchYearInReviewData("testuser", 2024, "fake-token");
        expect(data.topRepository?.name).toBe("user1/repo1");
    });
});

describe("fetchCommitActivityHeatmap additional coverage", () => {
    it("throws error when GraphQL query fails", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse(null, 500));
        });

        await expect(fetchCommitActivityHeatmap("testuser", 2024, "fake-token")).rejects.toThrow(GitHubApiError);
    });

    it("handles missing repository fields in fetchCommitActivityHeatmap", async () => {
        mockFetch.mockImplementation((url) => {
             const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                return Promise.resolve(jsonResponse({
                    data: {
                        user: {
                            id: "123",
                            contributionsCollection: {
                                commitContributionsByRepository: [
                                    { repository: { owner: { login: "user1" }, name: "repo1" }, contributions: { totalCount: 50 } }
                                ]
                                // other fields missing
                            }
                        }
                    }
                }));
            }
            if (urlStr.includes("/repos/user1/repo1/commits")) {
                return Promise.resolve(jsonResponse([
                    { commit: { author: { date: "2024-01-01T10:00:00Z" } } }
                ]));
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const heatmap = await fetchCommitActivityHeatmap("testuser", 2024, "fake-token");
        expect(heatmap[1][10]).toBe(1);
    });
});

describe("graphql helper error paths", () => {
    it("throws GitHubApiError when data is missing and no errors returned", async () => {
        // We need to trigger the graphql helper. We can do this via fetchYearInReviewData.
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({ data: null }));
        });

        await expect(fetchYearInReviewData("testuser", 2024, "fake-token")).rejects.toThrow("No data returned from GitHub GraphQL");
    });

    it("throws GitHubApiError with status 422 when GraphQL returns errors", async () => {
        mockFetch.mockImplementation(() => {
            return Promise.resolve(jsonResponse({ errors: [{ message: "GraphQL error" }] }));
        });

        try {
            await fetchYearInReviewData("testuser", 2024, "fake-token");
        } catch (error) {
            expect(error).toBeInstanceOf(GitHubApiError);
            expect((error as GitHubApiError).status).toBe(422);
            expect((error as GitHubApiError).message).toBe("GraphQL error");
        }
    });
});

describe("githubYearInReview additional edge cases", () => {
    it("fetchCommitActivityHeatmap handles 403 Rate Limit", async () => {
        mockFetch.mockImplementation((url) => {
             const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                return Promise.resolve(jsonResponse({
                    data: {
                        user: {
                            id: "123",
                            contributionsCollection: {
                                commitContributionsByRepository: [
                                    { repository: { owner: { login: "u" }, name: "r" }, contributions: { totalCount: 1 } }
                                ]
                            }
                        }
                    }
                }));
            }
            if (urlStr.includes("/commits")) {
                return Promise.resolve(jsonResponse(null, 403, { "X-RateLimit-Reset": "1700000000" }));
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        await expect(fetchCommitActivityHeatmap("user", 2024, "token")).rejects.toThrow(RateLimitError);
    });

    it("fetchCommitActivityHeatmap filters out commits without dates", async () => {
        mockFetch.mockImplementation((url) => {
             const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                return Promise.resolve(jsonResponse({
                    data: {
                        user: {
                            id: "123",
                            contributionsCollection: {
                                commitContributionsByRepository: [
                                    { repository: { owner: { login: "u" }, name: "r" }, contributions: { totalCount: 1 } }
                                ]
                            }
                        }
                    }
                }));
            }
            if (urlStr.includes("/commits")) {
                return Promise.resolve(jsonResponse([
                    { commit: { author: null } },
                    { commit: { author: { date: null } } },
                    { commit: { author: { date: "2024-01-01T10:00:00Z" } } }
                ]));
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const heatmap = await fetchCommitActivityHeatmap("user", 2024, "token");
        expect(heatmap[1][10]).toBe(1);
    });

    it("fetchYearInReviewData filters out repositories with zero contributions", async () => {
        mockFetch.mockImplementation((url) => {
             const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                // If it's the second call (fetchCommitDatesForTopRepos), we expect repo0 but NOT repo1
                if (urlStr.includes("repo1: repository")) {
                     throw new Error("Should not fetch dates for repo with 0 contributions");
                }

                return Promise.resolve(jsonResponse({
                    data: {
                        user: {
                            id: "123",
                            contributionsCollection: {
                                totalCommitContributions: 1,
                                contributionCalendar: { totalContributions: 1, weeks: [] },
                                commitContributionsByRepository: [
                                    { repository: { owner: { login: "u" }, name: "active" }, contributions: { totalCount: 1 } },
                                    { repository: { owner: { login: "u" }, name: "inactive" }, contributions: { totalCount: 0 } }
                                ]
                            }
                        },
                        repo0: { defaultBranchRef: { target: { history: { nodes: [] } } } }
                    }
                }));
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const data = await fetchYearInReviewData("user", 2024, "token");
        expect(data.topRepository?.name).toBe("u/active");
    });

    it("fetchCommitDatesForTopRepos handles missing defaultBranchRef or history", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "u1",
                                contributionsCollection: {
                                    totalCommitContributions: 10,
                                    totalPullRequestContributions: 0,
                                    totalIssueContributions: 0,
                                    totalPullRequestReviewContributions: 0,
                                    contributionCalendar: {
                                        totalContributions: 10,
                                        weeks: []
                                    },
                                    commitContributionsByRepository: [
                                        { repository: { name: "repo", owner: { login: "u" } }, contributions: { totalCount: 10 } }
                                    ]
                                }
                            }
                        }
                    }));
                }
                return Promise.resolve(jsonResponse({
                    data: {
                        repo0: { defaultBranchRef: null }
                    }
                }));
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const data = await fetchYearInReviewData("user", 2024, "token");
        expect(data.year).toBe(2024);
    });

    it("fetchCommitDatesForTopRepos handles nodes without author or date", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "u1",
                                contributionsCollection: {
                                    totalCommitContributions: 10,
                                    totalPullRequestContributions: 0,
                                    totalIssueContributions: 0,
                                    totalPullRequestReviewContributions: 0,
                                    contributionCalendar: {
                                        totalContributions: 10,
                                        weeks: []
                                    },
                                    commitContributionsByRepository: [
                                        { repository: { name: "repo", owner: { login: "u" } }, contributions: { totalCount: 10 } }
                                    ]
                                }
                            }
                        }
                    }));
                }
                return Promise.resolve(jsonResponse({
                    data: {
                        repo0: { defaultBranchRef: { target: { history: { nodes: [{ author: null }, { author: { date: null } }, { author: { date: "2024-01-01T12:00:00Z" } }] } } } }
                    }
                }));
            }
            return Promise.resolve(jsonResponse([], 200));
        });
        const data = await fetchYearInReviewData("user", 2024, "token");
        expect(data.year).toBe(2024);
    });

    it("fetchCommitDatesForTopRepos handles undefined nodes in history", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "u1",
                                contributionsCollection: {
                                    totalCommitContributions: 10,
                                    totalPullRequestContributions: 0,
                                    totalIssueContributions: 0,
                                    totalPullRequestReviewContributions: 0,
                                    contributionCalendar: {
                                        totalContributions: 10,
                                        weeks: []
                                    },
                                    commitContributionsByRepository: [
                                        { repository: { name: "repo", owner: { login: "u" } }, contributions: { totalCount: 10 } }
                                    ]
                                }
                            }
                        }
                    }));
                }
                return Promise.resolve(jsonResponse({
                    data: {
                        repo0: { defaultBranchRef: { target: { history: { nodes: [undefined, { author: { date: "2024-01-01T12:00:00Z" } }] } } } }
                    }
                }));
            }
            return Promise.resolve(jsonResponse([], 200));
        });
        const data = await fetchYearInReviewData("user", 2024, "token");
        expect(data.year).toBe(2024);
    });

    it("fetchCommitDatesForTopRepos handles null nodes in history", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "u1",
                                contributionsCollection: {
                                    totalCommitContributions: 10,
                                    totalPullRequestContributions: 0,
                                    totalIssueContributions: 0,
                                    totalPullRequestReviewContributions: 0,
                                    contributionCalendar: {
                                        totalContributions: 10,
                                        weeks: []
                                    },
                                    commitContributionsByRepository: [
                                        { repository: { name: "repo", owner: { login: "u" } }, contributions: { totalCount: 10 } }
                                    ]
                                }
                            }
                        }
                    }));
                }
                return Promise.resolve(jsonResponse({
                    data: {
                        repo0: { defaultBranchRef: { target: { history: { nodes: [null, { author: { date: "2024-01-01T12:00:00Z" } }] } } } }
                    }
                }));
            }
            return Promise.resolve(jsonResponse([], 200));
        });
        const data = await fetchYearInReviewData("user", 2024, "token");
        expect(data.year).toBe(2024);
    });
});
