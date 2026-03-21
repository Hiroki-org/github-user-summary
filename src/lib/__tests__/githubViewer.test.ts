import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { GitHubApiError } from "@/lib/types";

describe("fetchViewerLogin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should successfully fetch viewer login with a valid token", async () => {
    const validToken = "valid_token-123.PAT";
    const mockResponse = { login: "testuser" };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    vi.stubGlobal("fetch", fetchMock);

    const login = await fetchViewerLogin(validToken);
    expect(login).toBe("testuser");
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${validToken}`,
        "User-Agent": "github-user-summary",
      },
      cache: "no-store",
    });
  });

  it.each([
    { description: "a newline character", token: "invalid\ntoken" },
    { description: "a space", token: "invalid token" },
    { description: "special characters", token: "token!@#" },
  ])("should throw a GitHubApiError when the token contains $description", async ({ token }) => {
    await expect(fetchViewerLogin(token)).rejects.toThrowError(new GitHubApiError("Invalid token format", 400));
  });

  it("should throw a GitHubApiError when the fetch response is not ok", async () => {
    const validToken = "valid_token";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchViewerLogin(validToken)).rejects.toThrowError(new GitHubApiError("Failed to resolve current GitHub user", 401));
  });
});
