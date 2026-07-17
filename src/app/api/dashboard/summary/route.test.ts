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

  it("returns 500 if fetchUserSummary throws UserNotFoundError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "testuser", token: "fake-token" });
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new UserNotFoundError("testuser"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('User "testuser" not found');
  });

  it("returns 500 if fetchUserSummary throws RateLimitError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "testuser", token: "fake-token" });
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new RateLimitError(12345));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("rate limit exceeded");
  });

  it("returns 500 for generic errors", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({ username: "testuser", token: "fake-token" });
    vi.mocked(fetchUserSummary).mockRejectedValueOnce(new Error("Something went wrong"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Something went wrong");
  });

  it("returns 500 if getAuthenticatedUser throws an error", async () => {
    vi.mocked(getAuthenticatedUser).mockRejectedValueOnce(new Error("Auth Error"));

    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Auth Error");
  });

});
