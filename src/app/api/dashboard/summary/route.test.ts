import { describe, expect, it, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { fetchUserSummary } from "@/lib/github";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { RateLimitError, UserNotFoundError, GitHubApiError } from "@/lib/types";

import type { UserSummary } from "@/lib/types";

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
    vi.clearAllMocks();
  });

  it("returns 401 if no session exists", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 if no access token exists", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { login: "testuser" } });

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 200 and summary if session has login", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { login: "testuser" },
    };
    const mockSummary = { profile: { login: "testuser" } };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchUserSummary).mockResolvedValueOnce(mockSummary as unknown as UserSummary);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.username).toBe("testuser");
    expect(data.summary).toEqual(mockSummary);
    expect(fetchViewerLogin).not.toHaveBeenCalled();
    expect(fetchUserSummary).toHaveBeenCalledWith("testuser", "fake-token");
  });

  it("returns 200 and fetches login if missing from session", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { name: "Test User" }, // login missing
    };
    const mockSummary = { profile: { login: "testuser" } };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchViewerLogin).mockResolvedValueOnce("testuser");
    vi.mocked(fetchUserSummary).mockResolvedValueOnce(mockSummary as unknown as UserSummary);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.username).toBe("testuser");
    expect(data.summary).toEqual(mockSummary);
    expect(fetchViewerLogin).toHaveBeenCalledWith("fake-token");
    expect(fetchUserSummary).toHaveBeenCalledWith("testuser", "fake-token");
  });

  it("returns 500 if fetchViewerLogin fails with generic error", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { name: "Test User" }, // login missing
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchViewerLogin).mockRejectedValueOnce(new Error("Viewer login failed"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });

  it("returns specific status if fetchViewerLogin fails with GitHubApiError", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { name: "Test User" }, // login missing
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchViewerLogin).mockRejectedValueOnce(new GitHubApiError("Viewer login failed", 401));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Viewer login failed");
  });

  it("returns 500 if fetchUserSummary fails", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { login: "testuser" },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new Error("Summary fetch failed"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });

  it("returns 500 with 'Internal Server Error' if error is not an Error instance", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { login: "testuser" },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchUserSummary).mockRejectedValueOnce("Something went wrong");

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });

  it("returns 404 if fetchUserSummary fails with UserNotFoundError", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { login: "testuser" },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new UserNotFoundError("testuser"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User "testuser" not found');
  });

  it("returns 429 if fetchUserSummary fails with RateLimitError", async () => {
    const mockSession = {
      accessToken: "fake-token",
      user: { login: "testuser" },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);
    const mockRateLimitError = new RateLimitError(1234567890);
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(mockRateLimitError);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe(mockRateLimitError.message);
  });
});
