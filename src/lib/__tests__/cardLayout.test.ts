import { describe, expect, it } from "vitest";

import {
  cloneDefaultCardLayout,
  moveBlock,
  normalizeCardLayout,
  toggleBlockVisibility,
} from "../cardLayout";
import { DEFAULT_CARD_LAYOUT } from "../types";

describe("cardLayout utilities", () => {
  describe("cloneDefaultCardLayout", () => {
    it("returns a new object structurally equal to DEFAULT_CARD_LAYOUT", () => {
      const layout = cloneDefaultCardLayout();
      expect(layout).toEqual(DEFAULT_CARD_LAYOUT);
    });

    it("returns a deep copy, modifying the clone does not affect the default", () => {
      const layout = cloneDefaultCardLayout();

      // Ensure different array reference
      expect(layout.blocks).not.toBe(DEFAULT_CARD_LAYOUT.blocks);

      // Ensure different block references
      layout.blocks.forEach((block, index) => {
        expect(block).not.toBe(DEFAULT_CARD_LAYOUT.blocks[index]);
      });

      // Actually modify the clone to ensure default is unaffected
      layout.blocks[0].visible = !layout.blocks[0].visible;
      expect(DEFAULT_CARD_LAYOUT.blocks[0].visible).not.toBe(layout.blocks[0].visible);
    });
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

  it("moveBlock returns original layout when moving non-existent block", () => {
    const layout = cloneDefaultCardLayout();
    // @ts-expect-error Testing invalid block ID
    const moved = moveBlock(layout, "nonExistentBlock", "left", 0);

    expect(moved).toBe(layout);
  });

  it("moveBlock clamps targetIndex when negative", () => {
    const layout = cloneDefaultCardLayout();
    // Default left column is ["avatar", "bio", "stats", "topLanguages"]
    // Move "topLanguages" to -5 should put it at index 0
    const moved = moveBlock(layout, "topLanguages", "left", -5);

    const left = moved.blocks.filter((b) => b.column === "left").map((b) => b.id);
    expect(left).toEqual(["topLanguages", "avatar", "bio", "stats"]);
  });

  it("moveBlock clamps targetIndex when exceeding column length", () => {
    const layout = cloneDefaultCardLayout();
    const moved = moveBlock(layout, "avatar", "left", 100);

    const left = moved.blocks.filter((b) => b.column === "left").map((b) => b.id);
    expect(left).toEqual(["bio", "stats", "avatar"]);
  });
});
