import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
    authOptions: {},
}));

vi.mock("@/lib/githubViewer", () => ({
    fetchViewerLogin: vi.fn(),
}));

vi.mock("@/lib/githubYearInReview", () => ({
    fetchYearInReviewData: vi.fn(),
}));

function createMockRequest(url: string): NextRequest {
    const parsedUrl = new URL(url);
    return {
        nextUrl: {
            searchParams: parsedUrl.searchParams,
        },
    } as unknown as NextRequest;
}

describe("GET /api/dashboard/year validation", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns 401 when not authorized", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year");
        const response = await GET(req);

        expect(response.status).toBe(401);
    });

    it("returns 400 when year is invalid (not a number)", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Alice", email: "alice@example.com", image: "", login: "alice" },
            accessToken: "token",
        });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year?year=abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is before 2008", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Alice", email: "alice@example.com", image: "", login: "alice" },
            accessToken: "token",
        });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year?year=2007");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is in the future", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Alice", email: "alice@example.com", image: "", login: "alice" },
            accessToken: "token",
        });

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/year?year=${currentYear + 1}`);
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 200 and fetches data when year is valid", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Alice", email: "alice@example.com", image: "", login: "alice" },
            accessToken: "token",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        // @ts-expect-error Mocking partial response
        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce({ data: "ok" });

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/year?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ data: "ok" });
        expect(fetchYearInReviewData).toHaveBeenCalledWith("alice", currentYear, "token");
    });

    it("returns 200 and falls back to current year when year is not provided", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Alice", email: "alice@example.com", image: "", login: "alice" },
            accessToken: "token",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        // @ts-expect-error Mocking partial response
        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce({ data: "ok" });

        const { GET } = await import("./route");
        const req = createMockRequest(`http://localhost/api/dashboard/year`);
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ data: "ok" });

        const currentYear = new Date().getUTCFullYear();
        expect(fetchYearInReviewData).toHaveBeenCalledWith("alice", currentYear, "token");
    });
});
