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

  it("moveBlock returns original layout if blockId is not found", () => {
    const layout = cloneDefaultCardLayout();
    // Use an invalid blockId, casted to avoid type error
    const moved = moveBlock(layout, "invalid-block-id" as any, "left", 0);

    expect(moved).toBe(layout); // Should return the exact same reference
  });

  it("moveBlock clamps negative targetIndex to 0", () => {
    const layout = cloneDefaultCardLayout();
    const moved = moveBlock(layout, "stats", "left", -5);

    const left = moved.blocks.filter((b) => b.column === "left").map((b) => b.id);
    expect(left).toEqual(["stats", "avatar", "bio"]);
  });

  it("moveBlock clamps targetIndex greater than column length to column length", () => {
    const layout = cloneDefaultCardLayout();
    const moved = moveBlock(layout, "avatar", "right", 100);

    const right = moved.blocks.filter((b) => b.column === "right").map((b) => b.id);
    // avatar was at index 0 (left column) in default layout, moves to end of right column
    expect(right).toEqual(["topLanguages", "topRepos", "avatar"]);
  });

  it("moveBlock does not mutate original layout", () => {
    const layout = cloneDefaultCardLayout();
    const layoutCopy = cloneDefaultCardLayout();

    moveBlock(layout, "avatar", "right", 0);

    // Verify original layout structure wasn't changed
    expect(layout.blocks).toEqual(layoutCopy.blocks);
  });
});
