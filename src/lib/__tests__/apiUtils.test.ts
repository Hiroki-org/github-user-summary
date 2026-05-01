import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthenticatedUser, handleErrorResponse, handleRateLimit } from "../apiUtils";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchViewerLogin } from "../githubViewer";
import { RateLimitError } from "../types";

vi.mock("next/server", () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({ body, init }))
    }
}));

vi.mock("next-auth", () => ({
    getServerSession: vi.fn()
}));

vi.mock("../githubViewer", () => ({
    fetchViewerLogin: vi.fn()
}));

describe("apiUtils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAuthenticatedUser", () => {
        it("returns null if no session", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce(null);
            const user = await getAuthenticatedUser();
            expect(user).toBeNull();
        });

        it("returns null if no token", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: "test" }, expires: "1" });
            const user = await getAuthenticatedUser();
            expect(user).toBeNull();
        });

        it("returns username from session if present", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({
                user: { login: "testuser" },
                accessToken: "token123",
                expires: "1"
            } as unknown as import("next-auth").Session);
            const user = await getAuthenticatedUser();
            expect(user).toEqual({ username: "testuser", token: "token123" });
        });

        it("fetches username if not in session", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({
                accessToken: "token123",
                expires: "1"
            } as unknown as import("next-auth").Session);
            vi.mocked(fetchViewerLogin).mockResolvedValueOnce("fetcheduser");
            const user = await getAuthenticatedUser();
            expect(user).toEqual({ username: "fetcheduser", token: "token123" });
            expect(fetchViewerLogin).toHaveBeenCalledWith("token123");
        });
    });

    describe("handleErrorResponse", () => {
        it("returns error message if Error object", () => {
            const error = new Error("Test error message");
            const res = handleErrorResponse(error);
            expect(NextResponse.json).toHaveBeenCalledWith({ error: "Test error message" }, { status: 500 });
        });

        it("returns Unknown error for non-Error object", () => {
            const res = handleErrorResponse("Just a string");
            expect(NextResponse.json).toHaveBeenCalledWith({ error: "Unknown error" }, { status: 500 });
        });
    });

    describe("handleRateLimit", () => {
        it("throws RateLimitError using parsed header", () => {
            const res = {
                headers: {
                    get: vi.fn().mockReturnValue("1700000000")
                }
            } as unknown as Response;

            expect(() => handleRateLimit(res)).toThrow(RateLimitError);
            expect(() => handleRateLimit(res)).toThrow("GitHub API rate limit exceeded");
        });

        it("throws RateLimitError with fallback date if header is missing", () => {
            const res = {
                headers: {
                    get: vi.fn().mockReturnValue(null)
                }
            } as unknown as Response;

            expect(() => handleRateLimit(res)).toThrow(RateLimitError);
        });

        it("throws RateLimitError with fallback date if header is invalid", () => {
            const res = {
                headers: {
                    get: vi.fn().mockReturnValue("invalid")
                }
            } as unknown as Response;

            expect(() => handleRateLimit(res)).toThrow(RateLimitError);
        });
    });
});
