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

  describe("normalizeCardLayout", () => {
    it("fills missing blocks and removes invalid ones", () => {
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
      expect(normalized.blocks).toHaveLength(DEFAULT_CARD_LAYOUT.blocks.length);
    });

    it.each([
      null,
      undefined,
      {},
      "string",
      123,
      { blocks: null },
      { blocks: {} },
      { blocks: "string" },
    ])("returns cloned default layout for invalid input: %j", (input) => {
      const result = normalizeCardLayout(input);
      expect(result).toEqual(DEFAULT_CARD_LAYOUT);
      expect(result.blocks).not.toBe(DEFAULT_CARD_LAYOUT.blocks); // check clone
    });

    it("ignores non-object items in blocks array", () => {
      const normalized = normalizeCardLayout({
        blocks: [
          null,
          "string",
          123,
          { id: "avatar", visible: false, column: "full" },
        ],
      });

      expect(normalized.blocks.find((b) => b.id === "avatar")).toMatchObject({
        visible: false,
        column: "full",
      });
      expect(normalized.blocks).toHaveLength(DEFAULT_CARD_LAYOUT.blocks.length);
    });

    it("ignores duplicate block IDs, using the first one encountered", () => {
      const normalized = normalizeCardLayout({
        blocks: [
          { id: "avatar", visible: false, column: "full" },
          { id: "avatar", visible: true, column: "left" },
        ],
      });

      expect(normalized.blocks.find((b) => b.id === "avatar")).toMatchObject({
        visible: false,
        column: "full",
      });
      expect(normalized.blocks.filter((b) => b.id === "avatar")).toHaveLength(1);
    });

    it("falls back to default column and visible if provided are invalid", () => {
      // Find a block in defaults to check fallbacks
      const defaultAvatar = DEFAULT_CARD_LAYOUT.blocks.find((b) => b.id === "avatar");
      expect(defaultAvatar).toBeDefined();

      const normalized = normalizeCardLayout({
        blocks: [
          { id: "avatar", visible: "not-a-boolean", column: "invalid-column" },
        ],
      });

      const avatar = normalized.blocks.find((b) => b.id === "avatar");
      expect(avatar).toMatchObject({
        visible: defaultAvatar?.visible,
        column: defaultAvatar?.column,
      });
    });
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
    // In DEFAULT_CARD_LAYOUT, "topRepos" is in "right" column.
    // There are several blocks in "full" column: profile, contributions, heatmap, interests, skills
    const moved = moveBlock(layout, "topRepos", "full", 0);

    const full = moved.blocks.filter((b) => b.column === "full").map((b) => b.id);
    expect(full).toContain("topRepos");
    expect(full[0]).toBe("topRepos");
  });

  it("moveBlock returns original layout when moving non-existent block", () => {
    const layout = cloneDefaultCardLayout();
    // @ts-expect-error Testing invalid block ID
    const moved = moveBlock(layout, "nonExistentBlock", "left", 0);

    expect(moved).toBe(layout);
  });

  it("moveBlock clamps targetIndex when negative", () => {
    const layout = cloneDefaultCardLayout();
    // Default left column is ["avatar", "bio", "stats"]
    const moved = moveBlock(layout, "stats", "left", -5);

    const left = moved.blocks.filter((b) => b.column === "left").map((b) => b.id);
    expect(left).toEqual(["stats", "avatar", "bio"]);
  });

  it("moveBlock clamps targetIndex when exceeding column length", () => {
    const layout = cloneDefaultCardLayout();
    const moved = moveBlock(layout, "avatar", "left", 100);

    const left = moved.blocks.filter((b) => b.column === "left").map((b) => b.id);
    expect(left).toEqual(["bio", "stats", "avatar"]);
  });
});
