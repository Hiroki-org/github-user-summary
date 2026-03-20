import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchViewerLogin } from "../githubViewer";
import { GitHubApiError } from "@/lib/types";

describe("fetchViewerLogin", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully fetch viewer login with a valid token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ login: "testuser" }),
    } as Response);

    const login = await fetchViewerLogin("valid_token-123.PAT");
    expect(login).toBe("testuser");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/user", expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: "Bearer valid_token-123.PAT",
      }),
    }));
  });

  it("should throw a GitHubApiError and not call fetch when the token contains invalid characters (e.g. newline)", async () => {
    await expect(fetchViewerLogin("invalid\ntoken")).rejects.toThrow(GitHubApiError);
    await expect(fetchViewerLogin("invalid\ntoken")).rejects.toThrow("Invalid token format");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should throw a GitHubApiError and not call fetch when the token contains spaces", async () => {
    await expect(fetchViewerLogin("invalid token")).rejects.toThrow(GitHubApiError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should throw a GitHubApiError when the fetch response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    await expect(fetchViewerLogin("valid_token")).rejects.toThrow(GitHubApiError);
    await expect(fetchViewerLogin("valid_token")).rejects.toThrow("Failed to resolve current GitHub user");
  });
});
