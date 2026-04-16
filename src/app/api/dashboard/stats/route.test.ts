import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { type Session } from "next-auth";

const mockSession: Session = {
    user: { name: "Alice", email: "alice@example.com", image: "", login: "alice" },
    accessToken: "token",
    expires: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
};

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
    fetchCommitActivityHeatmap: vi.fn(),
}));

function createMockRequest(url: string): NextRequest {
    return new NextRequest(url);
}

describe("GET /api/dashboard/stats validation", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns 401 when not authorized", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats");
        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when no token is present", async () => {
        const { getServerSession } = await import("next-auth");
        const sessionWithoutToken = { ...mockSession, accessToken: undefined };
        vi.mocked(getServerSession).mockResolvedValueOnce(sessionWithoutToken as Session);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats");
        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when year is invalid (not a number)", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is before 2008", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/stats?year=2007");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is in the future", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear + 1}`);
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 200 and fetches data when year is valid and username is in session", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { fetchCommitActivityHeatmap } = await import("@/lib/githubYearInReview");
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

    it("returns 200 and falls back to current year when year is not provided", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { fetchCommitActivityHeatmap } = await import("@/lib/githubYearInReview");
        const mockHeatmap = [[1, 2], [3, 4]];
        vi.mocked(fetchCommitActivityHeatmap).mockResolvedValueOnce(mockHeatmap);

        const { GET } = await import("./route");
        const req = createMockRequest(`http://localhost/api/dashboard/stats`);
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        const currentYear = new Date().getUTCFullYear();
        expect(data.year).toBe(currentYear);
        expect(data.heatmap).toEqual(mockHeatmap);
        expect(fetchCommitActivityHeatmap).toHaveBeenCalledWith("alice", currentYear, "token");
    });

    it("returns 200 and fetches viewer login if session user login is missing", async () => {
        const { getServerSession } = await import("next-auth");
        const sessionWithoutLogin = { ...mockSession, user: { name: "Alice", email: "alice@example.com", image: "" } };
        vi.mocked(getServerSession).mockResolvedValueOnce(sessionWithoutLogin as Session);

        const { fetchViewerLogin } = await import("@/lib/githubViewer");
        vi.mocked(fetchViewerLogin).mockResolvedValueOnce("fetched-user");

        const { fetchCommitActivityHeatmap } = await import("@/lib/githubYearInReview");
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
        expect(fetchViewerLogin).toHaveBeenCalledWith("token");
        expect(fetchCommitActivityHeatmap).toHaveBeenCalledWith("fetched-user", currentYear, "token");
    });

    it("returns 500 when fetchCommitActivityHeatmap throws an Error", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { fetchCommitActivityHeatmap } = await import("@/lib/githubYearInReview");
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce(new Error("API Error"));

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("API Error");
    });

    it("returns 500 when fetchCommitActivityHeatmap throws an unknown error", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const { fetchCommitActivityHeatmap } = await import("@/lib/githubYearInReview");
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce("String error");

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/stats?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("Unknown error");
    });
});
