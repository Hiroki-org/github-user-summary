import { describe, it, expect } from "vitest";
import { mockFetch, jsonResponse, MOCK_EVENTS } from "./setup";

describe("fetchActivity", () => {
  it("ヒートマップが 7×24 で初期化される", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    expect(result.heatmap).toHaveLength(7);
    for (const row of result.heatmap) {
      expect(row).toHaveLength(24);
    }
  });

  it("イベントが正しい曜日×時間帯スロットに加算される", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    // 2024-01-15 = Monday (day=1), 10:30 → heatmap[1][10] += 1
    expect(result.heatmap[1][10]).toBeGreaterThanOrEqual(1);
    // 2024-01-15 = Monday (day=1), 14:00 → heatmap[1][14] += 1
    expect(result.heatmap[1][14]).toBeGreaterThanOrEqual(1);
  });

  it("イベント内訳がカウント順に並ぶ", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    // PushEvent: 2, PullRequestEvent: 1, IssuesEvent: 1
    expect(result.eventBreakdown[0].type).toBe("PushEvent");
    expect(result.eventBreakdown[0].count).toBe(2);
  });

  it("totalEvents がイベント総数と一致する", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    expect(result.totalEvents).toBe(MOCK_EVENTS.length);
  });

  it("空のイベント配列を正しく処理する", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    expect(result.totalEvents).toBe(0);
    expect(result.eventBreakdown).toEqual([]);
    // ヒートマップはすべてゼロ
    const totalHeatmap = result.heatmap.flat().reduce((a, b) => a + b, 0);
    expect(totalHeatmap).toBe(0);
  });
  describe("Error handling", () => {
    it("ユーザーが存在しない場合 UserNotFoundError をスローする", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(null, 404))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const { UserNotFoundError } = await import("../../types");

      await expect(fetchActivity("nonexistent", "fake-token")).rejects.toThrow(
        UserNotFoundError
      );
    });

    it("レート制限の場合 RateLimitError をスローする", async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse(null, 403, { "X-RateLimit-Reset": "1700000000" })
        )
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const { RateLimitError } = await import("../../types");

      await expect(fetchActivity("testuser", "fake-token")).rejects.toThrow(
        RateLimitError
      );
    });

    it("APIエラー(500)等の場合、それまでの結果を返す(早期終了)", async () => {
      // 1ページ目は成功、2ページ目で500エラー、3ページ目も成功(ただし無視される)
      mockFetch
        .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
        .mockResolvedValueOnce(jsonResponse(null, 500))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      // 1ページ目のイベント(3件)が取得できているはず
      expect(result.totalEvents).toBe(MOCK_EVENTS.length);
      expect(result.eventBreakdown[0].type).toBe("PushEvent");
    });
  });
});
