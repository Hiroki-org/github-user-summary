// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { estimateHeight, levelColor, createBlock } from "@/lib/cardElements";
import type { CardRenderOptions } from "@/lib/cardOptions";
import type { CardData } from "@/lib/cardDataFetcher";
import type { ThemePalette } from "@/lib/cardElements";

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

  describe("createBlock", () => {
    const mockTheme: ThemePalette = {
      bg: "#fff",
      panel: "#f8f9fa",
      text: "#000",
      subtext: "#666",
      border: "#ccc",
      success: "#0f0",
      accent: "#3b82f6",
    };

    const mockData: CardData = {
      profile: {
        login: "testuser",
        name: "Test User",
        avatarUrl: "https://example.com/avatar.png",
        bio: "Test bio here",
        followers: 10,
        following: 5,
        publicRepos: 20,
      },
      repos: [
        {
          name: "repo1",
          stars: 100,
          forks: 50,
          language: "TypeScript",
          url: "https://github.com/testuser/repo1",
          pushedAt: "2023-01-01T00:00:00Z",
        },
      ],
      totalStars: 500,
      languages: [
        { name: "TypeScript", count: 10, percentage: 80 },
        { name: "JavaScript", count: 2, percentage: 20 },
      ],
      streak: { current: 5, longest: 14 },
      heatmap: {
        days: [{ date: "2023-01-01", count: 5 }],
        maxCount: 10,
              },
          };

    const emptyHide = new Set<string>();

    it("renders bio block correctly", () => {
      const element = createBlock("bio", mockData, mockTheme, emptyHide);
      render(element);
      expect(screen.getByText("Test User")).toBeTruthy();
      expect(screen.getByText("@testuser")).toBeTruthy();
      expect(screen.getByText("Test bio here")).toBeTruthy();
      // The bio block does not have Followers in it.
    });

    it("renders stats block correctly", () => {
      const element = createBlock("stats", mockData, mockTheme, emptyHide);
      render(element);
      expect(screen.getByText("Stats")).toBeTruthy();
      expect(screen.getByText(/Stars:/)).toBeTruthy();
      expect(screen.getByText(/500/)).toBeTruthy();
    });

    it("renders langs block correctly", () => {
      const element = createBlock("langs", mockData, mockTheme, emptyHide);
      render(element);
      expect(screen.getByText("Top Languages")).toBeTruthy();
      expect(screen.getByText("TypeScript")).toBeTruthy();
      expect(screen.getByText(/80.0%/)).toBeTruthy();
      expect(screen.getByText("JavaScript")).toBeTruthy();
      expect(screen.getByText(/20.0%/)).toBeTruthy();
    });

    it("renders repos block correctly", () => {
      const element = createBlock("repos", mockData, mockTheme, emptyHide);
      render(element);
      expect(screen.getByText("Top Repositories")).toBeTruthy();
      expect(screen.getByText("repo1")).toBeTruthy();
      expect(screen.getByText(/★100/)).toBeTruthy();
    });

    it("renders streak block correctly", () => {
      const element = createBlock("streak", mockData, mockTheme, emptyHide);
      render(element);
      expect(screen.getByText("Streak")).toBeTruthy();
      expect(screen.getByText(/Current: 5 days/)).toBeTruthy();
      expect(screen.getByText(/Longest: 14 days/)).toBeTruthy();
    });

    it("renders heatmap block correctly", () => {
      const element = createBlock("heatmap", mockData, mockTheme, emptyHide);
      render(element);
      expect(screen.getByText("Heatmap")).toBeTruthy();
    });
  });
});
