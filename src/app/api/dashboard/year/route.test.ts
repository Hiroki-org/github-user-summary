import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/apiUtils";
import { fetchYearInReviewData } from "@/lib/githubYearInReview";

import type { YearInReviewData } from "@/lib/types";

vi.mock("@/lib/apiUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiUtils")>();
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
  };
});

vi.mock("@/lib/githubYearInReview", () => ({
    fetchYearInReviewData: vi.fn(),
}));

function createMockRequest(url: string): NextRequest {
    return new NextRequest(url);
}

describe("GET /api/dashboard/year validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when not authorized", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year");
        const response = await GET(req);

        expect(response.status).toBe(401);
    });


    it("returns 400 when year contains non-numeric characters (e.g. 2024abc)", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year?year=2024abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is invalid (not a number)", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year?year=abc");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is before 2008", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        const { GET } = await import("./route");
        const req = createMockRequest("http://localhost/api/dashboard/year?year=2007");
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 400 when year is in the future", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/year?year=${currentYear + 1}`);
        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe("Invalid year");
    });

    it("returns 200 and fetches data when year is valid", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce({ data: "ok", mostActiveDay: null } as unknown as YearInReviewData);

        const { GET } = await import("./route");
        const currentYear = new Date().getUTCFullYear();
        const req = createMockRequest(`http://localhost/api/dashboard/year?year=${currentYear}`);
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ data: "ok", mostActiveDay: null });
        expect(fetchYearInReviewData).toHaveBeenCalledWith("alice", currentYear, "token");
    });

    it("returns 200 and falls back to current year when year is not provided", async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "alice", token: "token" });

        vi.mocked(fetchYearInReviewData).mockResolvedValueOnce({ data: "ok", mostActiveDay: null } as unknown as YearInReviewData);

        const { GET } = await import("./route");
        const req = createMockRequest(`http://localhost/api/dashboard/year`);
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ data: "ok", mostActiveDay: null });

        const currentYear = new Date().getUTCFullYear();
        expect(fetchYearInReviewData).toHaveBeenCalledWith("alice", currentYear, "token");
    });
});
