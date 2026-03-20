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

  it("toggleBlockVisibility flips only the target block", () => {
    const layout = cloneDefaultCardLayout();
    const next = toggleBlockVisibility(layout, "bio");

    expect(next.blocks.find((b) => b.id === "bio")?.visible).toBe(false);
    expect(next.blocks.find((b) => b.id === "avatar")?.visible).toBe(true);
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
