import { describe, expect, it } from "vitest";

import {
  cloneDefaultCardLayout,
  moveBlock,
  normalizeCardLayout,
  toggleBlockVisibility,
} from "../cardLayout";

describe("cardLayout utilities", () => {
  it("cloneDefaultCardLayout returns all default blocks", () => {
    const layout = cloneDefaultCardLayout();

    expect(layout.blocks.map((b) => b.id)).toEqual([
      "avatar",
      "bio",
      "stats",
      "topLanguages",
      "topRepos",
    ]);
    expect(layout.blocks.every((b) => b.visible)).toBe(true);
  });

  it("normalizeCardLayout fills missing blocks and removes invalid ones", () => {
    const normalized = normalizeCardLayout({
      blocks: [
        { id: "avatar", visible: false, column: "full" },
        { id: "unknown", visible: true, column: "left" },
      ],
    });

    expect(normalized.blocks.find((b) => b.id === "avatar")).toMatchObject({
      visible: false,
      column: "full",
    });
    expect(normalized.blocks.some((b) => (b as { id: string }).id === "unknown")).toBe(false);
    expect(normalized.blocks).toHaveLength(5);
  });

describe("toggleBlockVisibility", () => {
    it("toggles block visibility to false", () => {
      const layout = cloneDefaultCardLayout(); // 'bio' is visible by default
      const next = toggleBlockVisibility(layout, "bio");

      expect(next.blocks.find((b) => b.id === "bio")?.visible).toBe(false);
    });

    it("toggles block visibility to true", () => {
      const layout = cloneDefaultCardLayout();
      const firstToggle = toggleBlockVisibility(layout, "bio");
      const next = toggleBlockVisibility(firstToggle, "bio");

      expect(next.blocks.find((b) => b.id === "bio")?.visible).toBe(true);
    });

    it("does not affect other blocks", () => {
      const layout = cloneDefaultCardLayout();
      const next = toggleBlockVisibility(layout, "bio");

      expect(next.blocks.find((b) => b.id === "avatar")?.visible).toBe(true);
      expect(next.blocks.find((b) => b.id === "stats")?.visible).toBe(true);
      expect(next.blocks.find((b) => b.id === "topLanguages")?.visible).toBe(true);
      expect(next.blocks.find((b) => b.id === "topRepos")?.visible).toBe(true);
    });

    it("returns unmodified layout blocks if blockId is not found", () => {
      const layout = cloneDefaultCardLayout();
      // Use unknown block ID
      // We have to cast to unknown -> CardBlockId here because TS would complain
      const next = toggleBlockVisibility(layout, "nonExistent" as unknown as import("../types").CardBlockId);

      expect(next.blocks).toEqual(layout.blocks);
    });
  });

  it("moveBlock reorders within same column", () => {
    const layout = cloneDefaultCardLayout();
    const moved = moveBlock(layout, "stats", "left", 0);

    const left = moved.blocks.filter((b) => b.column === "left").map((b) => b.id);
    expect(left).toEqual(["stats", "avatar", "bio"]);
  });

  it("moveBlock moves between columns", () => {
    const layout = cloneDefaultCardLayout();
    const moved = moveBlock(layout, "topRepos", "full", 0);

    const full = moved.blocks.filter((b) => b.column === "full").map((b) => b.id);
    expect(full).toEqual(["topRepos"]);
  });
});
