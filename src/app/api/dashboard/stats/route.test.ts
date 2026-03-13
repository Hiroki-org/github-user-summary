import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getServerSession } from "next-auth";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";

// Mock dependencies
vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("@/lib/githubViewer", () => ({
    fetchViewerLogin: vi.fn(),
}));

vi.mock("@/lib/githubYearInReview", () => ({
    fetchCommitActivityHeatmap: vi.fn(),
}));

describe("GET /api/dashboard/stats", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createRequest = (url: string) => new NextRequest(new URL(url));

    it("should return 401 if unauthorized (no session)", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createRequest("http://localhost/api/dashboard/stats");
        const res = await GET(req);

        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 if unauthorized (no token)", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Test User" },
            expires: "1",
        });

        const req = createRequest("http://localhost/api/dashboard/stats");
        const res = await GET(req);

        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: "Unauthorized" });
    });

    it("should return 400 for invalid year (too old)", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Test User" },
            accessToken: "mock-token",
            expires: "1",
        });

        const req = createRequest("http://localhost/api/dashboard/stats?year=2000");
        const res = await GET(req);

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid year" });
    });

    it("should return 400 for invalid year (future)", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Test User" },
            accessToken: "mock-token",
            expires: "1",
        });

        const futureYear = new Date().getUTCFullYear() + 1;
        const req = createRequest(`http://localhost/api/dashboard/stats?year=${futureYear}`);
        const res = await GET(req);

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid year" });
    });

    it("should handle error in catch block and return 500", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "mock-token",
            expires: "1",
        });

        const errorMessage = "Failed to fetch heatmap";
        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce(new Error(errorMessage));

        const req = createRequest("http://localhost/api/dashboard/stats");
        const res = await GET(req);

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: errorMessage });
    });

    it("should handle unknown error in catch block and return 500", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "mock-token",
            expires: "1",
        });

        vi.mocked(fetchCommitActivityHeatmap).mockRejectedValueOnce("String error, not an Error instance");

        const req = createRequest("http://localhost/api/dashboard/stats");
        const res = await GET(req);

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: "Unknown error" });
    });

    it("should return 200 and heatmap data on success", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "mock-token",
            expires: "1",
        });

        const mockHeatmap = { days: [], maxCount: 0 };
        vi.mocked(fetchCommitActivityHeatmap).mockResolvedValueOnce(mockHeatmap);

        const currentYear = new Date().getUTCFullYear();
        const req = createRequest("http://localhost/api/dashboard/stats");
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ year: currentYear, heatmap: mockHeatmap });
    });

    it("should use fetchViewerLogin when user.login is missing", async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Test User" }, // no login
            accessToken: "mock-token",
            expires: "1",
        });

        vi.mocked(fetchViewerLogin).mockResolvedValueOnce("fetcheduser");
        const mockHeatmap = { days: [], maxCount: 0 };
        vi.mocked(fetchCommitActivityHeatmap).mockResolvedValueOnce(mockHeatmap);

        const req = createRequest("http://localhost/api/dashboard/stats");
        const res = await GET(req);

        expect(fetchViewerLogin).toHaveBeenCalledWith("mock-token");
        expect(fetchCommitActivityHeatmap).toHaveBeenCalledWith("fetcheduser", expect.any(Number), "mock-token");
        expect(res.status).toBe(200);
    });
});
