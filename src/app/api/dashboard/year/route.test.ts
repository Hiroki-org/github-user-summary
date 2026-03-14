import { describe, expect, it, vi } from "vitest";
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

describe("GET /api/dashboard/year", () => {
    it("returns 401 if unauthorized", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2023");

        const response = await GET(req);
        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 if year is invalid", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=invalid");

        const response = await GET(req);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data).toEqual({ error: "Invalid year" });
    });

    it("returns 400 if year is before the supported range", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2007");

        const response = await GET(req);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Invalid year" });
    });

    it("returns 200 for the earliest supported year", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        const mockData = { totalContributions: 10 };
        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce(mockData as unknown as Awaited<ReturnType<typeof fetchYearInReviewData>>);

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2008");

        const response = await GET(req);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(mockData);
    });

    it("returns 200 for the current year", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        const mockData = { totalContributions: 42 };
        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce(mockData as unknown as Awaited<ReturnType<typeof fetchYearInReviewData>>);

        const currentYear = new Date().getUTCFullYear();
        const { GET } = await import("./route");
        const req = new NextRequest(`http://localhost/api/dashboard/year?year=${currentYear}`);

        const response = await GET(req);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(mockData);
    });

    it("returns 400 if year is in the future", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const futureYear = new Date().getUTCFullYear() + 1;
        const { GET } = await import("./route");
        const req = new NextRequest(`http://localhost/api/dashboard/year?year=${futureYear}`);

        const response = await GET(req);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Invalid year" });
    });

    it("handles error path when fetching data fails", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        vi.mocked(fetchYearInReviewData).mockRejectedValueOnce(new Error("API Error"));

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2023");

        const response = await GET(req);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data).toEqual({ error: "API Error" });
    });

    it("handles non-Error failures when fetching data fails", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        vi.mocked(fetchYearInReviewData).mockRejectedValueOnce("String error");

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2023");

        const response = await GET(req);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "Unknown error" });
    });

    it("returns 200 and data on success", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");
        const mockData = { totalContributions: 1000 };
        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce(mockData as unknown as Awaited<ReturnType<typeof fetchYearInReviewData>>);

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2023");

        const response = await GET(req);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual(mockData);
    });

    it("uses fetchViewerLogin when session user login is missing", async () => {
        const { getServerSession } = await import("next-auth");
        const { fetchViewerLogin } = await import("@/lib/githubViewer");
        const { fetchYearInReviewData } = await import("@/lib/githubYearInReview");

        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { name: "Test User" },
            accessToken: "testtoken",
            expires: "9999-12-31T23:59:59.999Z",
        });

        vi.mocked(fetchViewerLogin).mockResolvedValueOnce("viewerlogin");
        const mockData = { totalContributions: 7 };
        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce(mockData as unknown as Awaited<ReturnType<typeof fetchYearInReviewData>>);

        const { GET } = await import("./route");
        const req = new NextRequest("http://localhost/api/dashboard/year?year=2023");
        const response = await GET(req);

        expect(fetchViewerLogin).toHaveBeenCalledWith("testtoken");
        expect(fetchYearInReviewData).toHaveBeenCalledWith("viewerlogin", 2023, "testtoken");
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(mockData);
    });
});
