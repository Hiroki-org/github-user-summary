import { describe, expect, it, vi, beforeEach } from "vitest";
import { getAuthenticatedUser } from "@/lib/apiUtils";
import { fetchUserSummary } from "@/lib/github";
import { UserNotFoundError, RateLimitError } from "@/lib/types";

import type { UserSummary } from "@/lib/types";

vi.mock("@/lib/apiUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiUtils")>();
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
  };
});

vi.mock("@/lib/github", () => ({
  fetchUserSummary: vi.fn(),
}));


describe("GET /api/dashboard/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 200 and summary if authenticated", async () => {
    const mockUser = {
      token: "fake-token",
      username: "testuser",
    };
    const mockSummary = { profile: { login: "testuser" } };

    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(mockUser);
    vi.mocked(fetchUserSummary).mockResolvedValueOnce(mockSummary as unknown as UserSummary);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.username).toBe("testuser");
    expect(data.summary).toEqual(mockSummary);
    expect(fetchUserSummary).toHaveBeenCalledWith("testuser", "fake-token");
  });

  it("returns 500 if fetchUserSummary fails with generic error", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "testuser", token: "fake-token" });
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new Error("Summary fetch failed"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });

  it("returns 404 if fetchUserSummary fails with UserNotFoundError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "testuser", token: "fake-token" });
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new UserNotFoundError("testuser"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User "testuser" not found');
  });

  it("returns 429 if fetchUserSummary fails with RateLimitError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "testuser", token: "fake-token" });
    const mockRateLimitError = new RateLimitError(Math.floor(Date.now() / 1000) + 3600);
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(mockRateLimitError);

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe(mockRateLimitError.message);
  });
});
