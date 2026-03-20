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
    it("returns 404 and correct message when user not found", async () => {
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const { renderErrorCardResponse } = await import("@/lib/cardRenderer");
        vi.mocked(fetchCardData).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = new Request("http://localhost/api/card/ghost");
        await GET(req, { params: Promise.resolve({ username: "ghost" }) });

        expect(renderErrorCardResponse).toHaveBeenCalledWith(expect.objectContaining({
            message: "User not found",
            status: 404,
            cacheControl: "public, s-maxage=60, stale-while-revalidate=120",
            fontUrl: "http://localhost/fonts/NotoSans-Regular.ttf"
        }));
    });

    it("returns 503 and correct message on API error", async () => {
        const { fetchCardData } = await import("@/lib/cardDataFetcher");
        const { renderErrorCardResponse } = await import("@/lib/cardRenderer");
        vi.mocked(fetchCardData).mockRejectedValueOnce(new Error("API Error"));

        const { GET } = await import("./route");
        const req = new Request("http://localhost/api/card/erroruser");
        await GET(req, { params: Promise.resolve({ username: "erroruser" }) });

        expect(renderErrorCardResponse).toHaveBeenCalledWith(expect.objectContaining({
            message: "Temporarily unavailable",
            status: 503,
            cacheControl: "public, s-maxage=60, stale-while-revalidate=120",
            fontUrl: "http://localhost/fonts/NotoSans-Regular.ttf"
        }));
    });
});
