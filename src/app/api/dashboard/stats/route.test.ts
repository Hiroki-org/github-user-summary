import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getAuthAndYear } from "@/lib/apiUtils";
import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";

vi.mock("@/lib/apiUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiUtils")>();
  return {
    ...actual,
    getAuthAndYear: vi.fn(),
  };
});

vi.mock("@/lib/githubYearInReview", () => ({
    fetchCommitActivityHeatmap: vi.fn(),
}));

function createMockRequest(url: string): NextRequest {
    return new NextRequest(url);
}

describe("GET /api/dashboard/stats validation", () => {
    const mockGetAuthAndYear = vi.mocked(getAuthAndYear);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when not authorized", async () => {
        mockGetAuthAndYear.mockResolvedValueOnce({ errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) } as ReturnType<typeof getAuthAndYear> extends Promise<infer U> ? U : never);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats");
        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("Unauthorized");
    });


    it("returns 400 when year contains non-numeric characters (e.g. 2024abc)", async () => {
        mockGetAuthAndYear.mockResolvedValueOnce({ errorResponse: new Response(JSON.stringify({ error: "Invalid year" }), { status: 400 }) } as ReturnType<typeof getAuthAndYear> extends Promise<infer U> ? U : never);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=2024abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is invalid (not a number)", async () => {
        mockGetAuthAndYear.mockResolvedValueOnce({ errorResponse: new Response(JSON.stringify({ error: "Invalid year" }), { status: 400 }) } as ReturnType<typeof getAuthAndYear> extends Promise<infer U> ? U : never);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is before 2008", async () => {
        mockGetAuthAndYear.mockResolvedValueOnce({ errorResponse: new Response(JSON.stringify({ error: "Invalid year" }), { status: 400 }) } as ReturnType<typeof getAuthAndYear> extends Promise<infer U> ? U : never);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=2007");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 200 and fetches data when year is valid", async () => {
        mockGetAuthAndYear.mockResolvedValueOnce({ user: { username: "alice", token: "token" }, year: new Date().getUTCFullYear() } as ReturnType<typeof getAuthAndYear> extends Promise<infer U> ? U : never);

        const mockHeatmap = [[1, 2], [3, 4]];
        vi.mocked(fetchCommitActivityHeatmap).mockResolvedValueOnce(mockHeatmap);

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.year).toBe(currentYear);
        expect(data.heatmap).toEqual(mockHeatmap);
        expect(fetchCommitActivityHeatmap).toHaveBeenCalledWith("alice", currentYear, "token");
    });

    it("returns 500 when fetchCommitActivityHeatmap throws an Error", async () => {
        mockGetAuthAndYear.mockResolvedValueOnce({ user: { username: "alice", token: "token" }, year: new Date().getUTCFullYear() } as ReturnType<typeof getAuthAndYear> extends Promise<infer U> ? U : never);
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce(new Error("API Error"));

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("API Error");
    });
});
