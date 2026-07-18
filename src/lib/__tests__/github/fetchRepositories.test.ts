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

  it("GraphQL レスポンスで異常データの場合も安全に処理する", async () => {
    // topLanguagesの条件分岐を網羅するためのテスト
    const MOCK_REPOS_GRAPHQL_MANY_LANGUAGES = {
      data: {
        user: {
          repositories: {
            totalCount: 20,
            nodes: Array.from({ length: 15 }).map((_, i) => ({
              name: `repo-${i}`,
              description: "test",
              url: `https://github.com/testuser/repo-${i}`,
              stargazerCount: i,
              forkCount: 0,
              isFork: false,
              primaryLanguage: { name: `Lang${i}`, color: "#000" },
              languages: {
                edges: [
                  { size: i * 1000 + 100, node: { name: `Lang${i}`, color: "#000" } },
                ],
              },
              repositoryTopics: { nodes: [] },
            })),
          },
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL_MANY_LANGUAGES));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.languages.length).toBe(10);
    expect(result.languages[0].name).toBe("Lang14");
    expect(result.languages[9].name).toBe("Lang5");
  });

  it("GraphQL レスポンスで異常データ(トピックなし)の場合も安全に処理する", async () => {
    // トピックなしの条件分岐を網羅するためのテスト
    const MOCK_REPOS_GRAPHQL_NO_TOPIC = {
      data: {
        user: {
          repositories: {
            totalCount: 1,
            nodes: [
              {
                name: "repo-1",
                description: "test",
                url: "https://github.com/testuser/repo-1",
                stargazerCount: 1,
                forkCount: 0,
                isFork: false,
                primaryLanguage: { name: "Lang1", color: "#000" },
                languages: {
                  edges: [],
                },
                repositoryTopics: { nodes: [
                  { topic: null },
                  { topic: { name: "" } },
                  { topic: { name: "   " } }
                ] },
              },
            ],
          },
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL_NO_TOPIC));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.topics.length).toBe(0);
  });

  it("REST フォールバックでトピックなしの場合も安全に処理する", async () => {
    const restRepos = [
      {
        name: "rest-repo",
        description: "A REST repo",
        html_url: "https://github.com/testuser/rest-repo",
        stargazers_count: 25,
        forks_count: 3,
        fork: false,
        language: "JavaScript",
        topics: ["", "  ", "web"],
      },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(restRepos));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser");

    expect(result.topics.length).toBe(1);
    expect(result.topics[0].name).toBe("web");
  });

  it("GraphQL レスポンスでforkされたリポジトリが除外される", async () => {
    // forkされたリポジトリを除外する条件分岐を網羅するためのテスト
    const MOCK_REPOS_GRAPHQL_WITH_FORK = {
      data: {
        user: {
          repositories: {
            totalCount: 2,
            nodes: [
              {
                name: "repo-1",
                description: "test",
                url: "https://github.com/testuser/repo-1",
                stargazerCount: 1,
                forkCount: 0,
                isFork: false,
                primaryLanguage: { name: "Lang1", color: "#000" },
                languages: { edges: [] },
                repositoryTopics: { nodes: [] },
              },
              {
                name: "fork-repo",
                description: "test fork",
                url: "https://github.com/testuser/fork-repo",
                stargazerCount: 1,
                forkCount: 0,
                isFork: true,
                primaryLanguage: { name: "Lang1", color: "#000" },
                languages: { edges: [] },
                repositoryTopics: { nodes: [] },
              }
            ],
          },
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_REPOS_GRAPHQL_WITH_FORK));

    const { fetchRepositories } = await import("../../github");
    const result = await fetchRepositories("testuser", "fake-token");

    expect(result.topRepos.length).toBe(1);
    expect(result.topRepos[0].name).toBe("repo-1");
  });
});
