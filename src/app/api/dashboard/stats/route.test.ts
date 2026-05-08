import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/apiUtils";
import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";
import { GitHubApiError } from "@/lib/types";

vi.mock("@/lib/apiUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiUtils")>();
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
  };
});

vi.mock("@/lib/githubYearInReview", () => ({
    fetchCommitActivityHeatmap: vi.fn(),
}));

function createMockRequest(url: string): NextRequest {
    return new NextRequest(url);
}

describe("GET /api/dashboard/stats validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when not authorized", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats");
        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when year is invalid (not a number)", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is before 2008", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=2007");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 200 and fetches data when year is valid", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

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
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce(new Error("API Error"));

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("Internal Server Error");
    });

    it("returns specific status when fetchCommitActivityHeatmap throws a GitHubApiError", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce(new GitHubApiError("API Error", 403));

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe("API Error");
    });

    it("returns 500 when fetchCommitActivityHeatmap throws an unknown error", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce("String error");

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("Internal Server Error");
    });
});
