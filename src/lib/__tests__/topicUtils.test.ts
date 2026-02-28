import { describe, it, expect } from "vitest";
import { getTopicSizeClass } from "../topicUtils";

/**
 * Unit tests for getTopicSizeClass
 *
 * Test targets:
 * - ratio >= 0.8 → "text-base font-semibold"
 * - 0.5 <= ratio < 0.8 → "text-sm font-medium"
 * - ratio < 0.5 → "text-xs"
 * - maxCount <= 0 edge cases
 * - Boundary value tests
 */

describe("getTopicSizeClass", () => {
  // ---------- maxCount edge cases ----------
  it("returns 'text-xs' when maxCount is 0", () => {
    expect(getTopicSizeClass(0, 0)).toBe("text-xs");
  });

  it("returns 'text-xs' when maxCount is negative", () => {
    expect(getTopicSizeClass(5, -1)).toBe("text-xs");
  });

  // ---------- Large size (ratio >= 0.8) ----------
  it("returns 'text-base font-semibold' when ratio = 1.0 (count == maxCount)", () => {
    expect(getTopicSizeClass(10, 10)).toBe("text-base font-semibold");
  });

  it("returns 'text-base font-semibold' when ratio = 0.8 (exact boundary)", () => {
    expect(getTopicSizeClass(8, 10)).toBe("text-base font-semibold");
  });

  it("returns 'text-base font-semibold' when ratio > 0.8", () => {
    expect(getTopicSizeClass(9, 10)).toBe("text-base font-semibold");
  });

  // ---------- Medium size (0.5 <= ratio < 0.8) ----------
  it("returns 'text-sm font-medium' when ratio = 0.5 (exact boundary)", () => {
    expect(getTopicSizeClass(5, 10)).toBe("text-sm font-medium");
  });

  it("returns 'text-sm font-medium' when ratio = 0.79", () => {
    expect(getTopicSizeClass(79, 100)).toBe("text-sm font-medium");
  });

  it("returns 'text-sm font-medium' when ratio = 0.6", () => {
    expect(getTopicSizeClass(6, 10)).toBe("text-sm font-medium");
  });

  // ---------- Small size (ratio < 0.5) ----------
  it("returns 'text-xs' when ratio = 0.49", () => {
    expect(getTopicSizeClass(49, 100)).toBe("text-xs");
  });

  it("returns 'text-xs' when ratio = 0.1", () => {
    expect(getTopicSizeClass(1, 10)).toBe("text-xs");
  });

  it("returns 'text-xs' when count = 0 and maxCount > 0", () => {
    expect(getTopicSizeClass(0, 10)).toBe("text-xs");
  });

  // ---------- Practical scenarios ----------
  it("returns correct size class for different topic frequencies", () => {
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
});
