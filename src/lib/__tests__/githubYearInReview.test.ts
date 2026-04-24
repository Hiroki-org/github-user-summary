import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { getMostActiveDayFromCalendar, getMostActiveHour } from "@/lib/yearInReviewUtils";
import { fetchYearInReviewData } from "@/lib/githubYearInReview";
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

    it("throws UserNotFoundError when statsResponse.user is null", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({ data: { user: null } })); // statsPromise
                }
                if (callCount === 2) {
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
                                    commitContributionsByRepository: []
                                }
                            }
                        }
                    })); // reposResponse
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        await expect(fetchYearInReviewData("nonexistent", 2024, "fake-token")).rejects.toThrow(UserNotFoundError);
    });

    it("throws UserNotFoundError when reposResponse.user is null", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({ data: { user: { id: "MDQ6VXNlcjEyMzQ1", contributionsCollection: {} } } }));
                }
                if (callCount === 2) {
                    return Promise.resolve(jsonResponse({ data: { user: null } }));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        await expect(fetchYearInReviewData("nonexistent", 2024, "fake-token")).rejects.toThrow(UserNotFoundError);
    });

    it("throws RateLimitError when API returns 403", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                // Let statsPromise succeed so it doesn't cause unhandled rejection
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({ data: { user: { id: "MDQ6VXNlcjEyMzQ1", contributionsCollection: {} } } }));
                }
                // Let reposResponse fail
                if (callCount === 2) {
                    return Promise.resolve(jsonResponse(null, 403, { "X-RateLimit-Reset": "1700000000" }));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        await expect(fetchYearInReviewData("testuser", 2024, "fake-token")).rejects.toThrow(RateLimitError);
    });

    it("throws GitHubApiError when API returns other errors", async () => {
        let callCount = 0;
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(jsonResponse({ data: { user: { id: "MDQ6VXNlcjEyMzQ1", contributionsCollection: {} } } }));
                }
                if (callCount === 2) {
                    return Promise.resolve(jsonResponse(null, 500));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
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
                    // statsPromise
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
                                    }
                                }
                            }
                        }
                    }));
                }
                if (callCount === 2) {
                    // reposResponse
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
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
                if (callCount === 3) {
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
                    // statsPromise
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
                                    }
                                }
                            }
                        }
                    }));
                }
                if (callCount === 2) {
                    // reposResponse - return empty repositories
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
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
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockImplementation((url: string | URL | Request) => {
            const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
            if (urlStr.includes("/graphql")) {
                callCount++;
                if (callCount === 1) {
                    // statsPromise
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
                                    }
                                }
                            }
                        }
                    }));
                }
                if (callCount === 2) {
                    // reposResponse
                    return Promise.resolve(jsonResponse({
                        data: {
                            user: {
                                id: "MDQ6VXNlcjEyMzQ1",
                                contributionsCollection: {
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
                if (callCount === 3) {
                    // Fail the batch query
                    return Promise.resolve(jsonResponse(null, 500));
                }
            }
            return Promise.resolve(jsonResponse([], 200));
        });

        const data = await fetchYearInReviewData("testuser", 2024, "fake-token");
        expect(data.year).toBe(2024);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
