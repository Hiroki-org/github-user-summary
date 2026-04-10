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
                    language: "TypeScript",
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
});

    it("handles fallback parse when date is invalid format", async () => {
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
                    pushed_at: "2023/10/24 12:34:56", // Invalid ISO but parsable by new Date()
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
        // We just ensure it doesn't crash and falls back gracefully
    });
