import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cardDataFetcher", () => ({
    fetchCardData: vi.fn(),
}));

vi.mock("@/lib/cardRenderer", () => ({
    parseCardQueryParams: vi.fn(() => ({ format: "png", theme: "light", blocks: ["bio", "stats", "langs"], cols: 1, layout: {}, hide: new Set(), width: 600 })),
    renderCardResponse: vi.fn(async ({ cacheControl }) => new Response("ok", { headers: { "Cache-Control": cacheControl, "Content-Type": "image/png" } })),
    renderErrorCardResponse: vi.fn(async ({ status, cacheControl }) => new Response("error", { status, headers: { "Cache-Control": cacheControl, "Content-Type": "image/png" } })),
}));

describe("GET /api/card/[username] cache headers", () => {
    it("uses long cache header on success", async () => {
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        vi.mocked(fetchCardData).mockResolvedValueOnce({
            profile: { login: "alice", name: "Alice", avatarUrl: "", bio: "", followers: 1, following: 1, publicRepos: 1 },
            repos: [],
            totalStars: 0,
            languages: [],
            streak: { current: 0, longest: 0 },
            heatmap: { days: [], maxCount: 0 },
        });

        const { GET } = await import("./route");
        const req = new Request("http://localhost/api/card/alice");
        const response = await GET(req, { params: Promise.resolve({ username: "alice" }) });

        expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=1800, stale-while-revalidate=3600");
    });

    it("uses short cache header on not found", async () => {
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        vi.mocked(fetchCardData).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = new Request("http://localhost/api/card/ghost");
        const response = await GET(req, { params: Promise.resolve({ username: "ghost" }) });

        expect(response.status).toBe(404);
        expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=120");
    });

    it("uses short cache header on error", async () => {
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        vi.mocked(fetchCardData).mockRejectedValueOnce(new Error("API Error"));

        const { GET } = await import("./route");
        const req = new Request("http://localhost/api/card/erroruser");
        const response = await GET(req, { params: Promise.resolve({ username: "erroruser" }) });

        expect(response.status).toBe(503);
        expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=120");
    });
});

describe("GET /api/card/[username] error responses", () => {
    const runErrorTest = async (mockData: null | Error, username: string, expectedMessage: string, expectedStatus: number) => {
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const { renderErrorCardResponse } = await import("@/lib/cardRenderer");

        if (mockData instanceof Error) {
            vi.mocked(fetchCardData).mockRejectedValueOnce(mockData);
        } else {
            vi.mocked(fetchCardData).mockResolvedValueOnce(mockData);
        }

        const { GET } = await import("./route");
        const req = new Request(`http://localhost/api/card/${username}`);
        await GET(req, { params: Promise.resolve({ username }) });

        expect(renderErrorCardResponse).toHaveBeenCalledWith(expect.objectContaining({
            message: expectedMessage,
            status: expectedStatus,
            cacheControl: "public, s-maxage=60, stale-while-revalidate=120",
            fontUrl: "http://localhost/fonts/NotoSans-Regular.ttf"
        }));
    };

    it("returns 404 and correct message when user not found", async () => {
        await runErrorTest(null, "ghost", "User not found", 404);
    });

    it("returns 503 and correct message on API error", async () => {
        await runErrorTest(new Error("API Error"), "erroruser", "Temporarily unavailable", 503);
    });
});

describe("GET /api/card/[username] rate limiting", () => {
    it("should rate limit requests", async () => {
        const { GET } = await import("./route");
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const { renderErrorCardResponse } = await import("@/lib/cardRenderer");

        const req1 = new Request("http://localhost/api/card/testuser", {
            headers: {
                "x-forwarded-for": "127.0.0.1",
            },
        });

        // Mock fetchCardData to resolve successfully to avoid error rendering for successful requests
        vi.mocked(fetchCardData).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof fetchCardData>>);

        // Fill up the rate limit (50 requests)
        for (let i = 0; i < 50; i++) {
            await GET(req1, { params: Promise.resolve({ username: "testuser" }) });
        }

        // 51st request should be rate limited
        await GET(req1, { params: Promise.resolve({ username: "testuser" }) });

        expect(renderErrorCardResponse).toHaveBeenCalledWith(expect.objectContaining({
            message: "Rate limit exceeded",
            status: 429,
        }));
    });
});
