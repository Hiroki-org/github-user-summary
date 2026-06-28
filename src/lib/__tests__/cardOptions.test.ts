import { describe, it, expect } from "vitest";
import { resolveBlockLayout } from "../cardOptions";
import type { CardRenderOptions, CardBlockType } from "../cardOptions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid 1-column CardRenderOptions object, spread any
 * overrides on top.
 */
function oneCol(overrides: Partial<CardRenderOptions> = {}): CardRenderOptions {
  return {
    format: "png",
    theme: "light",
    cols: 1,
    blocks: [],
    layout: {},
    hide: new Set(),
    width: 600,
    ...overrides,
  };
}

/**
 * Build a minimal valid 2-column CardRenderOptions object, spread any
 * overrides on top.
 */
function twoCol(overrides: Partial<CardRenderOptions> = {}): CardRenderOptions {
  return {
    format: "png",
    theme: "light",
    cols: 2,
    blocks: [],
    layout: {},
    hide: new Set(),
    width: 800,
    ...overrides,
  };
}

// A handful of stable block values to use across tests.
const BLOCKS = {
  bio: "bio" as CardBlockType,
  stats: "stats" as CardBlockType,
  langs: "langs" as CardBlockType,
  repos: "repos" as CardBlockType,
  streak: "streak" as CardBlockType,
  heatmap: "heatmap" as CardBlockType,
};

const ALL_BLOCKS = Object.values(BLOCKS);

// ---------------------------------------------------------------------------
// 1-column layout
// ---------------------------------------------------------------------------

describe("resolveBlockLayout — 1-column layout", () => {
  it("returns empty full array when blocks list is empty", () => {
    const result = resolveBlockLayout(oneCol({ blocks: [] }));

    expect(result.full).toEqual([]);
    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
  });

  it("places every block in the full array", () => {
    const result = resolveBlockLayout(
      oneCol({ blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs] })
    );

    expect(result.full).toEqual([BLOCKS.bio, BLOCKS.stats, BLOCKS.langs]);
  });

  it("preserves the original block order in full", () => {
    const ordered: CardBlockType[] = [
      BLOCKS.streak,
      BLOCKS.bio,
      BLOCKS.langs,
    ];
    const result = resolveBlockLayout(oneCol({ blocks: ordered }));

    expect(result.full).toEqual(ordered);
  });

  it("keeps left and right empty regardless of blocks", () => {
    const result = resolveBlockLayout(oneCol({ blocks: ALL_BLOCKS }));

    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
  });

  it("places a single block in full", () => {
    const result = resolveBlockLayout(oneCol({ blocks: [BLOCKS.bio] }));

    expect(result.full).toEqual([BLOCKS.bio]);
    expect(result.left).toHaveLength(0);
    expect(result.right).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2-column layout — explicit slot assignments
// ---------------------------------------------------------------------------

describe("resolveBlockLayout — 2-column explicit slot assignment", () => {
  it("routes a block to the left slot when explicitly assigned", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio],
        layout: { [BLOCKS.bio]: "left" },
      })
    );

    expect(result.left).toContain(BLOCKS.bio);
    expect(result.right).not.toContain(BLOCKS.bio);
    expect(result.full).not.toContain(BLOCKS.bio);
  });

  it("routes a block to the right slot when explicitly assigned", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.stats],
        layout: { [BLOCKS.stats]: "right" },
      })
    );

    expect(result.right).toContain(BLOCKS.stats);
    expect(result.left).not.toContain(BLOCKS.stats);
    expect(result.full).not.toContain(BLOCKS.stats);
  });

  it("routes a block to full when explicitly assigned to full", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.langs],
        layout: { [BLOCKS.langs]: "full" },
      })
    );

    expect(result.full).toContain(BLOCKS.langs);
    expect(result.left).not.toContain(BLOCKS.langs);
    expect(result.right).not.toContain(BLOCKS.langs);
  });

  it("correctly splits multiple blocks across all three slots", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs],
        layout: {
          [BLOCKS.bio]: "left",
          [BLOCKS.stats]: "right",
          [BLOCKS.langs]: "full",
        },
      })
    );

    expect(result.left).toContain(BLOCKS.bio);
    expect(result.right).toContain(BLOCKS.stats);
    expect(result.full).toContain(BLOCKS.langs);
  });

  it("every block appears in exactly one slot", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs],
        layout: {
          [BLOCKS.bio]: "left",
          [BLOCKS.stats]: "right",
          [BLOCKS.langs]: "full",
        },
      })
    );

    const all = [...result.full, ...result.left, ...result.right];
    expect(all).toHaveLength(3);
    expect(new Set(all).size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 2-column layout — automatic distribution of unassigned blocks
// ---------------------------------------------------------------------------

describe("resolveBlockLayout — 2-column automatic distribution", () => {
  it("distributes a single unassigned block to left (shorter side)", () => {
    const result = resolveBlockLayout(
      twoCol({ blocks: [BLOCKS.bio], layout: {} })
    );

    // With no prior assignments, the first unassigned block goes to whichever
    // side is shorter (left when tied).
    const assignedToColumn = result.left.includes(BLOCKS.bio)
      ? "left"
      : result.right.includes(BLOCKS.bio)
      ? "right"
      : "full";

    expect(["left", "right"]).toContain(assignedToColumn);
    expect(result.full).not.toContain(BLOCKS.bio);
  });

  it("balances two unassigned blocks one per column", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats],
        layout: {},
      })
    );

    expect(result.left).toHaveLength(1);
    expect(result.right).toHaveLength(1);
    expect(result.full).toHaveLength(0);
  });

  it("balances four unassigned blocks two per column", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs, BLOCKS.repos],
        layout: {},
      })
    );

    expect(result.left).toHaveLength(2);
    expect(result.right).toHaveLength(2);
    expect(result.full).toHaveLength(0);
  });

  it("distributes three unassigned blocks so columns differ by at most 1", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs],
        layout: {},
      })
    );

    const diff = Math.abs(result.left.length - result.right.length);
    expect(diff).toBeLessThanOrEqual(1);
  });

  it("accounts for explicitly assigned blocks when balancing the remainder", () => {
    // bio and stats are pre-assigned to left; langs and repos are free.
    // The auto-distributor should prefer right to even things out.
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs, BLOCKS.repos],
        layout: {
          [BLOCKS.bio]: "left",
          [BLOCKS.stats]: "left",
        },
      })
    );

    // After explicit assignment: left has 2, right has 0.
    // Both free blocks should go to right to balance.
    expect(result.left).toContain(BLOCKS.bio);
    expect(result.left).toContain(BLOCKS.stats);
    expect(result.right).toContain(BLOCKS.langs);
    expect(result.right).toContain(BLOCKS.repos);
  });

  it("no block appears in more than one slot after distribution", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: ALL_BLOCKS,
        layout: {
          [BLOCKS.bio]: "left",
          [BLOCKS.streak]: "full",
        },
      })
    );

    const combined = [...result.full, ...result.left, ...result.right];
    expect(combined).toHaveLength(ALL_BLOCKS.length);
    expect(new Set(combined).size).toBe(ALL_BLOCKS.length);
  });
});

// ---------------------------------------------------------------------------
// 2-column layout — mixed explicit + unassigned
// ---------------------------------------------------------------------------

describe("resolveBlockLayout — 2-column mixed explicit and unassigned", () => {
  it("keeps explicitly assigned blocks in the correct slot", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs, BLOCKS.streak],
        layout: {
          [BLOCKS.bio]: "right",
          [BLOCKS.streak]: "full",
        },
      })
    );

    expect(result.right).toContain(BLOCKS.bio);
    expect(result.full).toContain(BLOCKS.streak);
  });

  it("distributes only the unassigned blocks, not the assigned ones", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats, BLOCKS.langs],
        layout: { [BLOCKS.bio]: "left" },
      })
    );

    // bio is fixed; stats and langs are free.
    expect(result.left).toContain(BLOCKS.bio);

    const freeBlocks = [BLOCKS.stats, BLOCKS.langs];
    for (const block of freeBlocks) {
      const inLeft = result.left.includes(block);
      const inRight = result.right.includes(block);
      const inFull = result.full.includes(block);
      // Each free block must be in exactly one slot.
      expect([inLeft, inRight, inFull].filter(Boolean)).toHaveLength(1);
    }
  });

  it("all input blocks are present in the output", () => {
    const blocks: CardBlockType[] = [
      BLOCKS.bio,
      BLOCKS.stats,
      BLOCKS.langs,
      BLOCKS.repos,
      BLOCKS.streak,
    ];
    const result = resolveBlockLayout(
      twoCol({
        blocks,
        layout: {
          [BLOCKS.bio]: "left",
          [BLOCKS.streak]: "right",
        },
      })
    );

    const combined = [...result.full, ...result.left, ...result.right];
    for (const block of blocks) {
      expect(combined).toContain(block);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("resolveBlockLayout — edge cases", () => {
  it("handles an empty blocks array in 2-column mode", () => {
    const result = resolveBlockLayout(twoCol({ blocks: [], layout: {} }));

    expect(result.full).toEqual([]);
    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
  });

  it("handles a blocks array with one entry in 2-column mode", () => {
    const result = resolveBlockLayout(
      twoCol({ blocks: [BLOCKS.bio], layout: {} })
    );

    const combined = [...result.full, ...result.left, ...result.right];
    expect(combined).toContain(BLOCKS.bio);
    expect(combined).toHaveLength(1);
  });

  it("handles all blocks explicitly assigned to full in 2-column mode", () => {
    const result = resolveBlockLayout(
      twoCol({
        blocks: [BLOCKS.bio, BLOCKS.stats],
        layout: {
          [BLOCKS.bio]: "full",
          [BLOCKS.stats]: "full",
        },
      })
    );

    expect(result.full).toContain(BLOCKS.bio);
    expect(result.full).toContain(BLOCKS.stats);
    expect(result.left).toHaveLength(0);
    expect(result.right).toHaveLength(0);
  });

  it("output arrays are plain arrays, not null or undefined", () => {
    const result = resolveBlockLayout(oneCol({ blocks: [] }));

    expect(Array.isArray(result.full)).toBe(true);
    expect(Array.isArray(result.left)).toBe(true);
    expect(Array.isArray(result.right)).toBe(true);
  });
});
