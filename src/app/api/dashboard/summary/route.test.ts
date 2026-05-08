import { describe, expect, it, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { fetchUserSummary } from "@/lib/github";

import type { UserSummary } from "@/lib/types";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  fetchUserSummary: vi.fn(),
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
    expect(fetchUserSummary).toHaveBeenCalledWith("testuser", "fake-token");
  });


});
