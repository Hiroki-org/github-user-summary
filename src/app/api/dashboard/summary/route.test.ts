import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

import type { Session } from "next-auth";

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
    fetchUserSummary: vi.fn(),
}));

vi.mock("@/lib/githubViewer", () => ({
    fetchViewerLogin: vi.fn(),
}));

describe("GET /api/dashboard/summary", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns 401 if unauthorized", async () => {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns summary if session contains user login", async () => {
        const { getServerSession } = await import("next-auth");
        const { fetchUserSummary } = await import("@/lib/github");

        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "testuser" },
            accessToken: "token123",
        } as unknown as Session);

        vi.mocked(fetchUserSummary).mockResolvedValueOnce({
            text: "This is a summary",
        } as unknown as import('@/lib/types').UserSummary);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
            username: "testuser",
            summary: { text: "This is a summary" },
        });
        expect(fetchUserSummary).toHaveBeenCalledWith("testuser", "token123");
    });

    it("returns summary using fetchViewerLogin if session user login is missing", async () => {
        const { getServerSession } = await import("next-auth");
        const { fetchUserSummary } = await import("@/lib/github");
        const { fetchViewerLogin } = await import("@/lib/githubViewer");

        vi.mocked(getServerSession).mockResolvedValueOnce({
            accessToken: "token123",
        } as unknown as Session);

        vi.mocked(fetchViewerLogin).mockResolvedValueOnce("viewerlogin");

        vi.mocked(fetchUserSummary).mockResolvedValueOnce({
            text: "Viewer summary",
        } as unknown as import('@/lib/types').UserSummary);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
            username: "viewerlogin",
            summary: { text: "Viewer summary" },
        });
        expect(fetchViewerLogin).toHaveBeenCalledWith("token123");
        expect(fetchUserSummary).toHaveBeenCalledWith("viewerlogin", "token123");
    });

    it("returns 500 if fetchUserSummary throws an Error", async () => {
        const { getServerSession } = await import("next-auth");
        const { fetchUserSummary } = await import("@/lib/github");

        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "erroruser" },
            accessToken: "token123",
        } as unknown as Session);

        vi.mocked(fetchUserSummary).mockRejectedValueOnce(new Error("API Error"));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: "API Error" });
    });

    it("returns 500 if fetchUserSummary throws a non-Error", async () => {
        const { getServerSession } = await import("next-auth");
        const { fetchUserSummary } = await import("@/lib/github");

        vi.mocked(getServerSession).mockResolvedValueOnce({
            user: { login: "erroruser" },
            accessToken: "token123",
        } as unknown as Session);

        vi.mocked(fetchUserSummary).mockRejectedValueOnce("String error");

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: "Unknown error" });
    });
});
