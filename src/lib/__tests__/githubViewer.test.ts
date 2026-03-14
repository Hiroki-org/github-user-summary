import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { GitHubApiError } from "@/lib/types";

const mockFetch = vi.fn();

describe("fetchViewerLogin", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return login on successful fetch", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ login: "testuser" }),
    });

    const login = await fetchViewerLogin("test-token");
    expect(login).toBe("testuser");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer test-token",
        "User-Agent": "github-user-summary",
      },
      cache: "no-store",
    });
  });

  it("should throw GitHubApiError when fetch is not ok", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Bad credentials" }),
    });

    const request = fetchViewerLogin("invalid-token");

    await expect(request).rejects.toBeInstanceOf(GitHubApiError);
    await expect(request).rejects.toHaveProperty("status", 401);
    await expect(request).rejects.toHaveProperty("message", "Failed to resolve current GitHub user");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
