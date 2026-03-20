import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { GitHubApiError } from "@/lib/types";

describe("fetchViewerLogin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should throw a GitHubApiError if the token format is invalid", async () => {
    const invalidToken = "invalid\ntoken";

    await expect(fetchViewerLogin(invalidToken)).rejects.toThrow(GitHubApiError);
    await expect(fetchViewerLogin(invalidToken)).rejects.toThrow("Invalid token format");
  });

  it("should correctly fetch the viewer login with a valid token", async () => {
    const validToken = "gho_valid_token_123";
    const mockResponse = { login: "testuser" };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchViewerLogin(validToken);

    expect(result).toBe("testuser");
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${validToken}`,
        "User-Agent": "github-user-summary",
      },
      cache: "no-store",
    });
  });

  it("should throw a GitHubApiError if fetch fails", async () => {
    const validToken = "gho_valid_token_123";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchViewerLogin(validToken)).rejects.toThrow(GitHubApiError);
    await expect(fetchViewerLogin(validToken)).rejects.toThrow("Failed to resolve current GitHub user");
  });
});
