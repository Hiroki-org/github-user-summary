import { describe, it, expect } from "vitest";
import { getTopicSizeClass } from "../topicUtils";

/**
 * getTopicSizeClass のユニットテスト
 *
 * テスト対象:
 * - ratio >= 0.8 → "text-base font-semibold"
 * - 0.5 <= ratio < 0.8 → "text-sm font-medium"
 * - ratio < 0.5 → "text-xs"
 * - maxCount <= 0 のエッジケース
 * - 境界値テスト
 */

describe("getTopicSizeClass", () => {
  // ---------- maxCount のエッジケース ----------
  it("maxCount が 0 の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(0, 0)).toBe("text-xs");
  });

  it("maxCount が負の値の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(5, -1)).toBe("text-xs");
  });

  // ---------- 大サイズ (ratio >= 0.8) ----------
  it("ratio = 1.0 (count == maxCount) の場合 'text-base font-semibold' を返す", () => {
    expect(getTopicSizeClass(10, 10)).toBe("text-base font-semibold");
  });

  it("ratio = 0.8 (ちょうど境界) の場合 'text-base font-semibold' を返す", () => {
    expect(getTopicSizeClass(8, 10)).toBe("text-base font-semibold");
  });

  it("ratio > 0.8 の場合 'text-base font-semibold' を返す", () => {
    expect(getTopicSizeClass(9, 10)).toBe("text-base font-semibold");
  });

  // ---------- 中サイズ (0.5 <= ratio < 0.8) ----------
  it("ratio = 0.5 (ちょうど境界) の場合 'text-sm font-medium' を返す", () => {
    expect(getTopicSizeClass(5, 10)).toBe("text-sm font-medium");
  });

  it("ratio = 0.79 の場合 'text-sm font-medium' を返す", () => {
    expect(getTopicSizeClass(79, 100)).toBe("text-sm font-medium");
  });

  it("ratio = 0.6 の場合 'text-sm font-medium' を返す", () => {
    expect(getTopicSizeClass(6, 10)).toBe("text-sm font-medium");
  });

  // ---------- 小サイズ (ratio < 0.5) ----------
  it("ratio = 0.49 の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(49, 100)).toBe("text-xs");
  });

  it("ratio = 0.1 の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(1, 10)).toBe("text-xs");
  });

  it("count = 0 で maxCount > 0 の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(0, 10)).toBe("text-xs");
  });

  // ---------- 実用的なシナリオ ----------
  it("トピック頻度の違いで正しいサイズクラスが返される", () => {
    const maxCount = 20;
    const topics = [
      { name: "react", count: 20 },      // ratio 1.0 → text-base font-semibold
      { name: "typescript", count: 16 },  // ratio 0.8 → text-base font-semibold
      { name: "nextjs", count: 12 },      // ratio 0.6 → text-sm font-medium
      { name: "testing", count: 5 },      // ratio 0.25 → text-xs
    ];

    expect(getTopicSizeClass(topics[0].count, maxCount)).toBe("text-base font-semibold");
    expect(getTopicSizeClass(topics[1].count, maxCount)).toBe("text-base font-semibold");
    expect(getTopicSizeClass(topics[2].count, maxCount)).toBe("text-sm font-medium");
    expect(getTopicSizeClass(topics[3].count, maxCount)).toBe("text-xs");
  });

  // ---------- 異常値・エッジケース (count < 0, count > maxCount, NaN, Infinity) ----------
  it("count が負の値の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(-5, 10)).toBe("text-xs");
  });

  it("count が maxCount を超える場合 'text-base font-semibold' を返す", () => {
    expect(getTopicSizeClass(15, 10)).toBe("text-base font-semibold");
  });

  // NaN/Infinity は実装側で明示ガードしていないため、
  // 現在の比較ロジックに基づく暗黙的な挙動をここで固定する。
  it("count が NaN の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(NaN, 10)).toBe("text-xs");
  });

  it("maxCount が NaN の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(5, NaN)).toBe("text-xs");
  });

  it("count が Infinity の場合 'text-base font-semibold' を返す", () => {
    expect(getTopicSizeClass(Infinity, 10)).toBe("text-base font-semibold");
  });

  it("maxCount が Infinity の場合 'text-xs' を返す", () => {
    expect(getTopicSizeClass(5, Infinity)).toBe("text-xs");
  });
});
