import { describe, it, expect } from "vitest";
import { mockFetch, jsonResponse, MOCK_STARRED_PAGE1 } from "./setup";

describe("fetchStarredRepos", () => {
  it("スター済みリポジトリのトピックを正しく集計する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1)).mockResolvedValueOnce(jsonResponse([]));

    const { fetchStarredRepos } = await import("../../github");
    const result = await fetchStarredRepos("testuser", "fake-token");

    const topicNames = result.topTopics.map((t) => t.name);
    expect(topicNames).toContain("react");
    expect(topicNames).toContain("typescript");

    // react は2つのリポジトリに含まれるので count = 2
    const reactTopic = result.topTopics.find((t) => t.name === "react");
    expect(reactTopic?.count).toBe(2);
  });

  it("スター済みリポジトリの言語を正しく集計する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1)).mockResolvedValueOnce(jsonResponse([]));

    const { fetchStarredRepos } = await import("../../github");
    const result = await fetchStarredRepos("testuser", "fake-token");

    const langNames = result.topLanguages.map((l) => l.name);
    expect(langNames).toContain("TypeScript");
    expect(langNames).toContain("Python");

    // TypeScript は2リポジトリ
    const tsLang = result.topLanguages.find((l) => l.name === "TypeScript");
    expect(tsLang?.count).toBe(2);
  });

  it("totalStarred がリポジトリ数と一致する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1)).mockResolvedValueOnce(jsonResponse([]));

    const { fetchStarredRepos } = await import("../../github");
    const result = await fetchStarredRepos("testuser", "fake-token");

    expect(result.totalStarred).toBe(3);
  });
});
