import { describe, it, expect } from "vitest";
import { mockFetch, jsonResponse, MOCK_CONTRIBUTIONS } from "./setup";

describe("fetchContributions", () => {
  it("コミット・PR・Issue・レビュー数を正しく返す", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../../github");
    const result = await fetchContributions("testuser", "fake-token");

    expect(result.totalCommits).toBe(500);
    expect(result.totalPRs).toBe(80);
    expect(result.totalIssues).toBe(40);
    expect(result.totalReviews).toBe(60);
    expect(result.totalContributions).toBe(680);
  });

  it("最長ストリークを正しく計算する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../../github");
    const result = await fetchContributions("testuser", "fake-token");

    // Calendar: 5, 3, 0, 7, 2, 0, 1
    // ストリーク: [5,3] = 2, [7,2] = 2, [1] = 1
    expect(result.longestStreak).toBe(2);
  });

  it("現在のストリークを正しく計算する", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../../github");
    const result = await fetchContributions("testuser", "fake-token");

    // 最後の日 (2024-01-07) = 1 なので currentStreak = 1
    expect(result.currentStreak).toBe(1);
  });

  it("カレンダーデータが日付順にソートされている", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_CONTRIBUTIONS));

    const { fetchContributions } = await import("../../github");
    const result = await fetchContributions("testuser", "fake-token");

    for (let i = 1; i < result.calendar.length; i++) {
      expect(result.calendar[i].date >= result.calendar[i - 1].date).toBe(true);
    }
  });

  it("token なしの場合 GitHubApiError をスローする", async () => {
    const { fetchContributions } = await import("../../github");
    const { GitHubApiError } = await import("../../types");

    await expect(fetchContributions("testuser")).rejects.toThrow(
      GitHubApiError
    );
  });
});
