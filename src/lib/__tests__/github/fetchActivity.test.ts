import { describe, it, expect } from "vitest";
import { mockFetch, jsonResponse, MOCK_EVENTS } from "./setup";

describe("fetchActivity", () => {
  it("Sakamoto algorithm calculates weekday correctly for leap year month >= 3", async () => {
    // 2024-03-01 is Friday (5) and it is a leap year.
    // 2025-05-18 is Sunday (0) and it is not a leap year.
    const edgeEvents = [
      { type: "PushEvent", created_at: "2024-03-01T10:30:00Z" },
      { type: "PushEvent", created_at: "2025-05-18T10:30:00Z" }
    ];
    mockFetch
      .mockResolvedValueOnce(jsonResponse(edgeEvents))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    // 2024-03-01 (Friday = 5)
    expect(result.heatmap[5][10]).toBeGreaterThanOrEqual(1);
    // 2025-05-18 (Sunday = 0)
    expect(result.heatmap[0][10]).toBeGreaterThanOrEqual(1);
  });

  it("Sakamoto algorithm calculates weekday correctly for leap year month >= 3", async () => {
    // 2024-03-01 is Friday (5) and it is a leap year.
    // 2025-05-18 is Sunday (0) and it is not a leap year.
    const edgeEvents = [
      { type: "PushEvent", created_at: "2024-03-01T10:30:00Z" },
      { type: "PushEvent", created_at: "2025-05-18T10:30:00Z" }
    ];
    mockFetch
      .mockResolvedValueOnce(jsonResponse(edgeEvents))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    // 2024-03-01 (Friday = 5)
    expect(result.heatmap[5][10]).toBeGreaterThanOrEqual(1);
    // 2025-05-18 (Sunday = 0)
    expect(result.heatmap[0][10]).toBeGreaterThanOrEqual(1);
  });

  it("Sakamoto algorithm calculates weekday correctly for month < 3", async () => {
    // 2024-02-29 is Thursday (4)
    // 2023-01-01 is Sunday (0)
    const edgeEvents = [
      { type: "PushEvent", created_at: "2024-02-29T10:30:00Z" },
      { type: "PushEvent", created_at: "2023-01-01T10:30:00Z" }
    ];
    mockFetch
      .mockResolvedValueOnce(jsonResponse(edgeEvents))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    // 2024-02-29 (Thursday = 4)
    expect(result.heatmap[4][10]).toBeGreaterThanOrEqual(1);
    // 2023-01-01 (Sunday = 0)
    expect(result.heatmap[0][10]).toBeGreaterThanOrEqual(1);
  });

  it("Sakamoto algorithm calculates weekday correctly for month >= 3 and leap years", async () => {
    // 2024-03-01 is Friday (5)
    // 2023-05-18 is Thursday (4)
    const edgeEvents = [
      { type: "PushEvent", created_at: "2024-03-01T10:30:00Z" },
      { type: "PushEvent", created_at: "2023-05-18T10:30:00Z" }
    ];
    mockFetch
      .mockResolvedValueOnce(jsonResponse(edgeEvents))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { fetchActivity } = await import("../../github");
    const result = await fetchActivity("testuser", "fake-token");

    // 2024-03-01 (Friday = 5)
    expect(result.heatmap[5][10]).toBe(1);
    // 2023-05-18 (Thursday = 4)
    expect(result.heatmap[4][10]).toBe(1);
  });

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

    it("1ページ目で500エラーの場合、空の結果を返す(早期終了)", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(null, 500))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      expect(result.totalEvents).toBe(0);
      expect(result.eventBreakdown.length).toBe(0);
    });

    it("1ページ目で例外がスローされた場合(エラーインスタンス以外)、breakして処理を継続する", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Unexpected error"))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      expect(result.totalEvents).toBe(0);
      expect(result.eventBreakdown.length).toBe(0);
    });

    it("100件未満のイベントがある場合、breakする", async () => {
      // Provide 99 events. So the mock fetch won't be called the second time.
      const events = Array.from({ length: 99 }, () => ({ type: "PushEvent", created_at: "2024-01-15T10:30:00Z" }));
      mockFetch
        .mockResolvedValueOnce(jsonResponse(events))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      expect(result.totalEvents).toBe(99);
      // Since events.length < 100, we break. Next promises aren't awaited.
    });
  });

    it("100件以上のイベントがある場合、次のページも取得する", async () => {
      const hundredEvents = Array.from({ length: 100 }, () => ({ type: "PushEvent", created_at: "2024-01-15T10:30:00Z" }));
      mockFetch
        .mockResolvedValueOnce(jsonResponse(hundredEvents))
        .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      expect(result.totalEvents).toBe(100 + MOCK_EVENTS.length);
    });

    it("エラーが UserNotFoundError や RateLimitError 以外の場合、ループを抜ける", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Generic error"))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));
      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");
      expect(result.totalEvents).toBe(0);
    });
});
