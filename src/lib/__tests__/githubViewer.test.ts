<<<<<<< HEAD
import { describe, it, expect, vi, afterEach } from "vitest";
=======
import { describe, expect, it, vi, afterEach } from "vitest";
>>>>>>> fix-githubviewer-token-validation-7865754078279387833
import { fetchViewerLogin } from "@/lib/githubViewer";
import { GitHubApiError } from "@/lib/types";

describe("fetchViewerLogin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

<<<<<<< HEAD
  it("should successfully fetch viewer login with a valid token", async () => {
    const validToken = "valid_token-123.PAT";
=======
  it("should throw a GitHubApiError if the token format is invalid", async () => {
    const invalidToken = "invalid\ntoken";

    await expect(fetchViewerLogin(invalidToken)).rejects.toThrowError(new GitHubApiError("Invalid token format", 400));
  });

  it("should correctly fetch the viewer login with a valid token", async () => {
    const validToken = "gho_valid_token_123";
>>>>>>> fix-githubviewer-token-validation-7865754078279387833
    const mockResponse = { login: "testuser" };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    vi.stubGlobal("fetch", fetchMock);

<<<<<<< HEAD
    const login = await fetchViewerLogin(validToken);
    expect(login).toBe("testuser");
=======
    const result = await fetchViewerLogin(validToken);

    expect(result).toBe("testuser");
>>>>>>> fix-githubviewer-token-validation-7865754078279387833
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${validToken}`,
        "User-Agent": "github-user-summary",
      },
      cache: "no-store",
    });
  });

<<<<<<< HEAD
  it.each([
    { description: "a newline character", token: "invalid\ntoken" },
    { description: "a space", token: "invalid token" },
    { description: "special characters", token: "token!@#" },
  ])("should throw a GitHubApiError when the token contains $description", async ({ token }) => {
    await expect(fetchViewerLogin(token)).rejects.toThrowError(new GitHubApiError("Invalid token format", 400));
  });

  it("should throw a GitHubApiError when the fetch response is not ok", async () => {
    const validToken = "valid_token";
=======
  it("should throw a GitHubApiError if fetch fails", async () => {
    const validToken = "gho_valid_token_123";

>>>>>>> fix-githubviewer-token-validation-7865754078279387833
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchViewerLogin(validToken)).rejects.toThrowError(new GitHubApiError("Failed to resolve current GitHub user", 401));
  });
});
