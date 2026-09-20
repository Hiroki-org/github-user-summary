import { describe, it, expect } from "vitest";
import { mockFetch, jsonResponse, MOCK_USER, MOCK_ORGS, MOCK_PINNED_RESPONSE } from "./setup";

describe("fetchUserProfile", () => {
  it("プロフィール・組織・ピン留めを正しく取得して結合する", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_USER))                    // GET /users/testuser
      .mockResolvedValueOnce(jsonResponse(MOCK_ORGS))                    // GET /users/testuser/orgs
      .mockResolvedValueOnce(jsonResponse(MOCK_PINNED_RESPONSE));        // POST graphql

    const { fetchUserProfile } = await import("../../github");
    const result = await fetchUserProfile("testuser", "fake-token");

    expect(result.login).toBe("testuser");
    expect(result.name).toBe("Test User");
    expect(result.bio).toBe("A software developer");
    expect(result.followers).toBe(100);
    expect(result.orgs).toHaveLength(2);
    expect(result.orgs[0].login).toBe("org1");
    expect(result.pinnedRepos).toHaveLength(1);
    expect(result.pinnedRepos[0].name).toBe("awesome-project");
    expect(result.pinnedRepos[0].stargazerCount).toBe(150);
  });

  it("token なしの場合ピン留めリポジトリを空で返す", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_USER))
      .mockResolvedValueOnce(jsonResponse(MOCK_ORGS));

    const { fetchUserProfile } = await import("../../github");
    const result = await fetchUserProfile("testuser");

    expect(result.login).toBe("testuser");
    expect(result.pinnedRepos).toEqual([]);
  });

  it("ユーザーが存在しない場合 UserNotFoundError をスローする", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 404));

    const { fetchUserProfile } = await import("../../github");
    const { UserNotFoundError } = await import("../../types");

    await expect(fetchUserProfile("nonexistent", "fake-token")).rejects.toThrow(
      UserNotFoundError
    );
  });

  it("レート制限の場合 RateLimitError をスローする", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(null, 403, { "X-RateLimit-Reset": "1700000000" })
    );

    const { fetchUserProfile } = await import("../../github");
    const { RateLimitError } = await import("../../types");

    await expect(fetchUserProfile("testuser", "fake-token")).rejects.toThrow(
      RateLimitError
    );
  });
});
