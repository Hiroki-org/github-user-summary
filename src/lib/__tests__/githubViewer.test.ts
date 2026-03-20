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

  it.each([
    { description: "a newline character", token: "invalid\ntoken" },
    { description: "a space", token: "invalid token" },
  ])("should throw a GitHubApiError when the token contains $description", async ({ token }) => {
    await expect(fetchViewerLogin(token)).rejects.toMatchObject({ message: "Invalid token format", status: 400 });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should throw a GitHubApiError when the fetch response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    await expect(fetchViewerLogin("valid_token")).rejects.toMatchObject({ message: "Failed to resolve current GitHub user", status: 401 });
  });
});
