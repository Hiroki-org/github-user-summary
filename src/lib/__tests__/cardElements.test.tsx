import { describe, it, expect } from "vitest";
import { estimateHeight } from "../cardElements";
import type { CardRenderOptions } from "../cardOptions";

describe("cardElements utility functions", () => {
  describe("estimateHeight", () => {
    const defaultOptions = {
      format: "png",
      theme: "light",
      blocks: [],
      hide: new Set<string>(),
      width: 600,
    } as unknown as CardRenderOptions;

    it("calculates height for 1 column layout", () => {
      const options = { ...defaultOptions, cols: 1 as const };

      // Test minimum bounds
      expect(estimateHeight(options, { full: [], left: [], right: [] })).toBe(300);

      // Test standard calculation (130 base + 3 * 95 rowHeight) = 415
      expect(estimateHeight(options, {
        full: ["bio", "stats", "langs"],
        left: [],
        right: []
      })).toBe(415);

      // Test maximum bounds (900)
      const manyBlocks = new Array(20).fill("bio");
      expect(estimateHeight(options, {
        full: manyBlocks,
        left: [],
        right: []
      })).toBe(900);
    });

    it("calculates height for 2 column layout", () => {
      const options = { ...defaultOptions, cols: 2 as const };

      // Test minimum bounds
      expect(estimateHeight(options, { full: [], left: [], right: [] })).toBe(320);

      // Test standard calculation with left longer
      // base(130) + (full(1) + max(left(2), right(1)) * 95) = 130 + 3 * 95 = 415
      expect(estimateHeight(options, {
        full: ["bio"],
        left: ["stats", "langs"],
        right: ["repos"]
      })).toBe(415);

      // Test standard calculation with right longer
      // base(130) + (full(0) + max(left(1), right(3)) * 95) = 130 + 3 * 95 = 415
      expect(estimateHeight(options, {
        full: [],
        left: ["stats"],
        right: ["repos", "langs", "streak"]
      })).toBe(415);

      // Test maximum bounds (900)
      const manyBlocks = new Array(20).fill("bio");
      expect(estimateHeight(options, {
        full: [],
        left: manyBlocks,
        right: []
      })).toBe(900);
    });
  });
});
