import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetch = vi.fn();

beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GITHUB_TOKEN;
});

function jsonResponse(data: unknown, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(),
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    } as unknown as Response;
}

describe("fetchCardData", () => {
    it("returns null for missing user", async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404))
            .mockResolvedValueOnce(jsonResponse([], 200));

        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const result = await fetchCardData("unknown-user");

        expect(result).toBeNull();
    });

    it("builds profile/language/heatmap summary", async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({
                login: "alice",
                name: "Alice",
                avatar_url: "https://example.com/a.png",
                bio: "hello",
                followers: 10,
                following: 4,
                public_repos: 12,
            }))
            .mockResolvedValueOnce(jsonResponse([
                {
                    name: "repo-1",
                    stargazers_count: 20,
                    forks_count: 2,
                    language: "TypeScript",
                    html_url: "https://github.com/alice/repo-1",
                    pushed_at: new Date().toISOString(),
                },
                {
                    name: "repo-2",
                    stargazers_count: 5,
                    forks_count: 1,
                    language: "JavaScript",
                    html_url: "https://github.com/alice/repo-2",
                    pushed_at: new Date().toISOString(),
                },
            ]));

        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const result = await fetchCardData("alice");

        expect(result).not.toBeNull();
        expect(result?.profile.login).toBe("alice");
        expect(result?.totalStars).toBe(25);
        expect(result?.languages[0].name).toBe("TypeScript");
        expect(result?.heatmap.days).toHaveLength(42);
    });

    it("adds Authorization header when GITHUB_TOKEN exists", async () => {
        process.env.GITHUB_TOKEN = "abc-token";

        mockFetch
            .mockResolvedValueOnce(jsonResponse({
                login: "alice",
                name: "Alice",
                avatar_url: "https://example.com/a.png",
                bio: "hello",
                followers: 10,
                following: 4,
                public_repos: 12,
            }))
            .mockResolvedValueOnce(jsonResponse([]));

        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        await fetchCardData("alice");

        const firstCall = mockFetch.mock.calls[0];
        expect(firstCall[1].headers.Authorization).toBe("Bearer abc-token");
    });

    it("throws GitHubApiError on timeout (AbortError)", async () => {
        const abortError = new Error("The operation was aborted");
        abortError.name = "AbortError";

        mockFetch.mockRejectedValueOnce(abortError);

        const { fetchCardData } = await import("@/lib/cardDataFetcher");

        await expect(fetchCardData("alice")).rejects.toMatchObject({
            name: "GitHubApiError",
            message: expect.stringContaining("time"),
            status: 504,
        });
    });

    it("handles fallback parse when date is invalid format", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2023-10-30T00:00:00Z"));

        try {
            mockFetch
                .mockResolvedValueOnce(jsonResponse({
                    login: "alice",
                    name: "Alice",
                    avatar_url: "https://example.com/a.png",
                    bio: "hello",
                    followers: 10,
                    following: 4,
                    public_repos: 12,
                }))
                .mockResolvedValueOnce(jsonResponse([
                    {
                        name: "repo-1",
                        stargazers_count: 20,
                        forks_count: 2,
                        language: "TypeScript",
                        html_url: "https://github.com/alice/repo-1",
                        pushed_at: "Tue, 24 Oct 2023 12:34:56 GMT",
                    },
                    {
                        name: "repo-2",
                        stargazers_count: 5,
                        forks_count: 1,
                        language: "TypeScript",
                        html_url: "https://github.com/alice/repo-2",
                        pushed_at: "invalid-date", // Unparsable
                    },
                ]));

            const { fetchCardData } = await import("@/lib/cardDataFetcher");
            const result = await fetchCardData("alice");

            expect(result).not.toBeNull();
            expect(result?.heatmap.days).toHaveLength(42);
            expect(result?.heatmap.days.find((day) => day.date === "2023-10-24")?.count).toBe(1);
            expect(result?.heatmap.maxCount).toBe(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("skips processing when pushedAt is falsy", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2023-10-30T00:00:00Z"));

        try {
            mockFetch
                .mockResolvedValueOnce(jsonResponse({
                    login: "alice",
                    name: "Alice",
                    avatar_url: "https://example.com/a.png",
                    bio: "hello",
                    followers: 10,
                    following: 4,
                    public_repos: 12,
                }))
                .mockResolvedValueOnce(jsonResponse([
                    {
                        name: "repo-1",
                        stargazers_count: 20,
                        forks_count: 2,
                        language: "TypeScript",
                        html_url: "https://github.com/alice/repo-1",
                        pushed_at: null, // Test falsy coverage
                    },
                    {
                        name: "repo-2",
                        stargazers_count: 5,
                        forks_count: 1,
                        language: "TypeScript",
                        html_url: "https://github.com/alice/repo-2",
                        pushed_at: "", // Test empty string coverage
                    },
                ]));

            const { fetchCardData } = await import("@/lib/cardDataFetcher");
            const result = await fetchCardData("alice");

            expect(result).not.toBeNull();
            expect(result?.heatmap.days).toHaveLength(42);
            // Neither should count towards heatmap
            expect(result?.heatmap.maxCount).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});

    it("handles totalLanguageRepos === 0", async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({
                login: "alice",
                name: "Alice",
                avatar_url: "https://example.com/a.png",
                bio: "hello",
                followers: 10,
                following: 4,
                public_repos: 12,
            }))
            .mockResolvedValueOnce(jsonResponse([
                {
                    name: "repo-1",
                    stargazers_count: 20,
                    forks_count: 2,
                    language: null, // No language
                    html_url: "https://github.com/alice/repo-1",
                    pushed_at: new Date().toISOString(),
                }
            ]));

        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const result = await fetchCardData("alice");

        expect(result).not.toBeNull();
        expect(result?.languages).toHaveLength(0);
    });

    it("throws non-abort errors from fetch", async () => {
        const error = new Error("Network error");
        mockFetch.mockRejectedValueOnce(error);

        const { fetchCardData } = await import("@/lib/cardDataFetcher");

        await expect(fetchCardData("alice")).rejects.toThrow("Network error");
    });

    it("throws GitHubApiError when response is not ok", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                headers: new Headers(),
                text: () => Promise.resolve("Internal Server Error"),
            } as unknown as Response)
            .mockResolvedValueOnce(jsonResponse([]));

        const { fetchCardData } = await import("@/lib/cardDataFetcher");

        await expect(fetchCardData("alice")).rejects.toMatchObject({
            name: "GitHubApiError",
            message: "Internal Server Error",
            status: 500,
        });
    });

    it("throws GitHubApiError with default message when response is not ok and text fails", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                headers: new Headers(),
                text: () => Promise.reject(new Error("Failed to read")),
            } as unknown as Response)
            .mockResolvedValueOnce(jsonResponse([]));

        const { fetchCardData } = await import("@/lib/cardDataFetcher");

        await expect(fetchCardData("alice")).rejects.toMatchObject({
            name: "GitHubApiError",
            message: "Unknown GitHub error",
            status: 500,
        });
    });
