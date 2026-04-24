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
