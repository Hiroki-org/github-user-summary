import { describe, it, expect } from "vitest";
import { estimateHeight, levelColor } from "../cardElements";
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

  describe("levelColor", () => {
    const mockTheme = {
      bg: "#fff",
      panel: "#f8f9fa",
      text: "#000",
      subtext: "#666",
      border: "#ccc",
      success: "#0f0",
      accent: "#3b82f6",
    };

    it("returns theme.border when count or maxCount is <= 0", () => {
      expect(levelColor(0, 10, mockTheme)).toBe("#ccc");
      expect(levelColor(-1, 10, mockTheme)).toBe("#ccc");
      expect(levelColor(5, 0, mockTheme)).toBe("#ccc");
      expect(levelColor(5, -1, mockTheme)).toBe("#ccc");
      expect(levelColor(0, 0, mockTheme)).toBe("#ccc");
    });

    it("returns correct color based on ratio", () => {
      // ratio < 0.25 (e.g. 2/10 = 0.2) -> #86efac
      expect(levelColor(2, 10, mockTheme)).toBe("#86efac");
      expect(levelColor(2.4, 10, mockTheme)).toBe("#86efac");

      // ratio < 0.5 (e.g. 4/10 = 0.4) -> #4ade80
      expect(levelColor(2.5, 10, mockTheme)).toBe("#4ade80");
      expect(levelColor(4, 10, mockTheme)).toBe("#4ade80");
      expect(levelColor(4.9, 10, mockTheme)).toBe("#4ade80");

      // ratio < 0.75 (e.g. 6/10 = 0.6) -> #22c55e
      expect(levelColor(5, 10, mockTheme)).toBe("#22c55e");
      expect(levelColor(6, 10, mockTheme)).toBe("#22c55e");
      expect(levelColor(7.4, 10, mockTheme)).toBe("#22c55e");

      // ratio >= 0.75 (e.g. 8/10 = 0.8) -> #15803d
      expect(levelColor(7.5, 10, mockTheme)).toBe("#15803d");
      expect(levelColor(8, 10, mockTheme)).toBe("#15803d");
      expect(levelColor(10, 10, mockTheme)).toBe("#15803d");
      expect(levelColor(15, 10, mockTheme)).toBe("#15803d"); // > 1
    });
  });
});
