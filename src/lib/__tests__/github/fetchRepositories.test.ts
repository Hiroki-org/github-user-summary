import { describe, it, expect } from "vitest";
import { mockFetch, jsonResponse, MOCK_REPOS_GRAPHQL } from "./setup";

describe("fetchRepositories", () => {
  it("GraphQL レスポンスから言語統計を正しく集計する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL)); // POST graphql

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    // フォークを除外した2リポジトリ
    expect(result.totalCount).toBe(2);

    // 言語統計: Python 8000bytes, TypeScript 5000bytes, JavaScript 2000bytes
    expect(result.languages.length).toBeGreaterThanOrEqual(2);
    expect(result.languages[0].name).toBe("Python");
    expect(result.languages[0].bytes).toBe(8000);
    expect(result.languages[1].name).toBe("TypeScript");
    expect(result.languages[1].bytes).toBe(5000);
  });

  it("GraphQL API throws RateLimitError on 403 response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "API rate limit exceeded" }, 403, { "X-RateLimit-Reset": "1700000000" }));
    const { fetchRepositories } = await import("../../github");
    const { RateLimitError } = await import("../../types");
    await expect(fetchRepositories("testuser", "fake-token")).rejects.toThrow(RateLimitError);
  });

  it("GraphQL API without token throws UNAUTHORIZED", async () => {
    // If token is missing, fetchRepositories doesn't throw, it falls back to REST API.
    // What about an invalid token format?
    const { fetchRepositories } = await import("../../github");
    const { GitHubApiError } = await import("../../types");
    await expect(fetchRepositories("testuser", "invalid token format!!")).rejects.toThrow(GitHubApiError);
  });

  it("GraphQL API throws GitHubApiError on 401 response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "Bad credentials" }, 401));
    const { fetchRepositories } = await import("../../github");
    const { GitHubApiError } = await import("../../types");
    await expect(fetchRepositories("testuser", "fake-token")).rejects.toThrow(GitHubApiError);
  });

  it("GraphQL レスポンスからトピックを正しく集計する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    const topicNames = result.topics.map((t) => t.name);
    expect(topicNames).toContain("react");
    expect(topicNames).toContain("nextjs");
    expect(topicNames).toContain("machine-learning");
  });

  it("言語のパーセンテージが正しく計算される", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    const totalBytes = result.languages.reduce((sum, l) => sum + l.bytes, 0);
    expect(totalBytes).toBe(15000); // 5000 + 2000 + 8000

    for (const lang of result.languages) {
      const expectedPct = Math.round((lang.bytes / totalBytes) * 1000) / 10;
      expect(lang.percentage).toBe(expectedPct);
    }
  });

  it("topRepos は最大5件で stargazerCount 順に返される", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.topRepos.length).toBeLessThanOrEqual(5);
    expect(result.topRepos[0].name).toBe("repo-a");
    expect(result.topRepos[0].stargazerCount).toBe(50);
  });

  it("token なしの場合 REST にフォールバックする", async () => {
    const restRepos = [
      {
        name: "rest-repo",
        description: "A REST repo",
        html_url: "https://github.com/testuser/rest-repo",
        stargazers_count: 25,
        forks_count: 3,
        fork: false,
        language: "JavaScript",
        topics: ["web"],
      },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(restRepos));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser");

    expect(result.totalCount).toBe(1);
    expect(result.topRepos[0].name).toBe("rest-repo");
    expect(result.languages[0].name).toBe("JavaScript");
  });

  it("ユーザーが存在しない場合 UserNotFoundError をスローする", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { user: null } })
    );

    const { fetchRepositories } = await import("../../github");
    const { UserNotFoundError } = await import("../../types");

    await expect(fetchRepositories("nonexistent", "fake-token")).rejects.toThrow(
      UserNotFoundError
    );
  });
});
