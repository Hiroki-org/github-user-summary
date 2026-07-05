import { describe, expect, it } from "vitest";
import { parseCardQueryParams, resolveBlockLayout, CardBlockType } from "../cardOptions";

describe("parseCardQueryParams", () => {
  it("parses empty search params with defaults", () => {
    const params = new URLSearchParams("");
    const result = parseCardQueryParams(params);
    expect(result).toEqual({
      format: "png",
      theme: "light",
      blocks: ["bio", "stats", "langs"],
      cols: 1,
      layout: {},
      hide: new Set(),
      width: 600,
    });
  });

  it("parses standard params correctly", () => {
    const params = new URLSearchParams(
      "format=svg&theme=dark&cols=2&blocks=repos,streak&layout=left:repos,right:streak&hide=stats,langs&width=800"
    );
    const result = parseCardQueryParams(params);
    expect(result.format).toBe("svg");
    expect(result.theme).toBe("dark");
    expect(result.cols).toBe(2);
    expect(result.blocks).toEqual(["repos", "streak"]);
    expect(result.layout).toEqual({ repos: "left", streak: "right" });
    expect(result.hide).toEqual(new Set(["stats", "langs"]));
    expect(result.width).toBe(800);
  });

  it("handles invalid format falling back to png", () => {
    const params = new URLSearchParams("format=jpg");
    const result = parseCardQueryParams(params);
    expect(result.format).toBe("png");
  });

  it("handles invalid theme falling back to light", () => {
    const params = new URLSearchParams("theme=blue");
    const result = parseCardQueryParams(params);
    expect(result.theme).toBe("light");
  });

  it("handles invalid cols falling back to 1", () => {
    const params = new URLSearchParams("cols=3");
    const result = parseCardQueryParams(params);
    expect(result.cols).toBe(1);
  });

  it("handles empty blocks falling back to default", () => {
    const params = new URLSearchParams("blocks=");
    const result = parseCardQueryParams(params);
    expect(result.blocks).toEqual(["bio", "stats", "langs"]);
  });

  it("filters out invalid blocks and deduplicates", () => {
    const params = new URLSearchParams("blocks=bio,invalid,repos,bio");
    const result = parseCardQueryParams(params);
    expect(result.blocks).toEqual(["bio", "repos"]);
  });

  it("falls back to default if all blocks are invalid", () => {
    const params = new URLSearchParams("blocks=invalid1,invalid2");
    const result = parseCardQueryParams(params);
    expect(result.blocks).toEqual(["bio", "stats", "langs"]);
  });

  it("handles invalid layouts correctly", () => {
    const params = new URLSearchParams("layout=top:bio,left:invalid,invalid:repos,left:bio");
    const result = parseCardQueryParams(params);
    expect(result.layout).toEqual({ bio: "left" });
  });

  it("handles invalid width falling back to 600", () => {
    const params = new URLSearchParams("width=invalid");
    const result = parseCardQueryParams(params);
    expect(result.width).toBe(600);
  });

  it("handles width out of bounds falling back to 600", () => {
    const params = new URLSearchParams("width=100");
    const result = parseCardQueryParams(params);
    expect(result.width).toBe(600);
  });

  it("handles width above maximum falling back to 600", () => {
    const params = new URLSearchParams("width=1500");
    const result = parseCardQueryParams(params);
    expect(result.width).toBe(600);
  });
});

describe("resolveBlockLayout", () => {
  it("resolves single column layout", () => {
    const options = {
      format: "png" as const,
      theme: "light" as const,
      blocks: ["bio", "stats", "langs"] as CardBlockType[],
      cols: 1 as const,
      layout: { bio: "left" as const, stats: "right" as const },
      hide: new Set<string>(),
      width: 600,
    };
    const result = resolveBlockLayout(options);
    expect(result).toEqual({
      full: ["bio", "stats", "langs"],
      left: [],
      right: [],
    });
  });

  it("resolves two column layout with explicit slots", () => {
    const options = {
      format: "png" as const,
      theme: "light" as const,
      blocks: ["bio", "stats", "langs", "repos"] as CardBlockType[],
      cols: 2 as const,
      layout: { bio: "full" as const, stats: "left" as const, langs: "right" as const },
      hide: new Set<string>(),
      width: 600,
    };
    const result = resolveBlockLayout(options);
    expect(result).toEqual({
      full: ["bio"],
      left: ["stats", "repos"], // repos goes left because left.length (1) <= right.length (1)
      right: ["langs"],
    });
  });

  it("distributes unassigned blocks evenly in two column layout", () => {
    const options = {
      format: "png" as const,
      theme: "light" as const,
      blocks: ["bio", "stats", "langs", "repos", "streak"] as CardBlockType[],
      cols: 2 as const,
      layout: {},
      hide: new Set<string>(),
      width: 600,
    };
    const result = resolveBlockLayout(options);
    expect(result).toEqual({
      full: [],
      left: ["bio", "langs", "streak"],
      right: ["stats", "repos"],
    });
  });

  it("does not apply hide filtering while resolving layout", () => {
    const options = {
      format: "png" as const,
      theme: "light" as const,
      blocks: ["bio", "stats", "langs"] as CardBlockType[],
      cols: 1 as const,
      layout: {},
      hide: new Set<string>(["stats"]),
      width: 600,
    };
    const result = resolveBlockLayout(options);
    expect(result.full).toEqual(["bio", "stats", "langs"]);
  });
});

describe("parseCardQueryParams layout edge cases", () => {
  it("ignores invalid layout slots and blocks without throwing", () => {
    // This will hit the missing coverage on line 85 of cardOptions.ts
    const params = new URLSearchParams("layout=bio:,:left");
    const result = parseCardQueryParams(params);
    expect(result.layout).toEqual({});
  });
});
