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

  it("REST フォールバック時に topic がない場合でも正しく動作する", async () => {
    const restRepos = [
      {
        name: "rest-repo-no-topic",
        description: "A REST repo with no topics",
        html_url: "https://github.com/testuser/rest-repo-no-topic",
        stargazers_count: 25,
        forks_count: 3,
        fork: false,
        language: "JavaScript",
      },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(restRepos));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser");

    expect(result.totalCount).toBe(1);
    expect(result.topics.length).toBe(0);
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

  it("GraphQL レスポンスで repo.topics が undefined の場合でも正しく動作する", async () => {
    const customResponse = {
      data: {
        user: {
          repositories: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                name: "repo-no-topics",
                description: null,
                url: "https://github.com/test/no-topics",
                stargazerCount: 10,
                forkCount: 1,
                isFork: false,
                languages: { edges: [] },
                repositoryTopics: { nodes: [] },
              },
            ],
          },
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(customResponse));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.totalCount).toBe(1);
    expect(result.topics.length).toBe(0);
  });

  it("GraphQL レスポンスで fork リポジトリは除外される", async () => {
    const customResponse = {
      data: {
        user: {
          repositories: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                name: "repo-fork",
                description: null,
                url: "https://github.com/test/repo-fork",
                stargazerCount: 10,
                forkCount: 1,
                isFork: true, // Should be excluded
                languages: { edges: [] },
                repositoryTopics: { nodes: [] },
              },
              {
                name: "repo-not-fork",
                description: null,
                url: "https://github.com/test/repo-not-fork",
                stargazerCount: 10,
                forkCount: 1,
                isFork: false,
                languages: { edges: [] },
                repositoryTopics: { nodes: [] },
              },
            ],
          },
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(customResponse));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.totalCount).toBe(1);
    expect(result.topRepos[0].name).toBe("repo-not-fork");
  });

});
