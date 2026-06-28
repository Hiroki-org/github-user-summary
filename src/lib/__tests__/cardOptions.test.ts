import { describe, it, expect } from "vitest";
import { parseCardQueryParams } from "../cardOptions";

describe("parseCardQueryParams", () => {
  it("should return default values when URLSearchParams is empty", () => {
    const searchParams = new URLSearchParams();
    const result = parseCardQueryParams(searchParams);

    expect(result).toEqual({
      format: "png",
      theme: "light",
      cols: 1,
      blocks: ["bio", "stats", "langs"],
      layout: {},
      hide: new Set(),
      width: 600,
    });
  });

  it("should parse valid format parameter", () => {
    const params1 = new URLSearchParams({ format: "svg" });
    expect(parseCardQueryParams(params1).format).toBe("svg");

    const params2 = new URLSearchParams({ format: "png" });
    expect(parseCardQueryParams(params2).format).toBe("png");

    const params3 = new URLSearchParams({ format: "invalid" });
    expect(parseCardQueryParams(params3).format).toBe("png");
  });

  it("should parse valid theme parameter", () => {
    const params1 = new URLSearchParams({ theme: "dark" });
    expect(parseCardQueryParams(params1).theme).toBe("dark");

    const params2 = new URLSearchParams({ theme: "light" });
    expect(parseCardQueryParams(params2).theme).toBe("light");

    const params3 = new URLSearchParams({ theme: "invalid" });
    expect(parseCardQueryParams(params3).theme).toBe("light");
  });

  it("should parse valid cols parameter", () => {
    const params1 = new URLSearchParams({ cols: "2" });
    expect(parseCardQueryParams(params1).cols).toBe(2);

    const params2 = new URLSearchParams({ cols: "1" });
    expect(parseCardQueryParams(params2).cols).toBe(1);

    const params3 = new URLSearchParams({ cols: "3" });
    expect(parseCardQueryParams(params3).cols).toBe(1);
  });

  it("should parse blocks parameter correctly", (): void => {
    // Valid blocks
    const params1 = new URLSearchParams({ blocks: "repos,heatmap,streak" });
    expect(parseCardQueryParams(params1).blocks).toEqual(["repos", "heatmap", "streak"]);

    // With spaces and mixed case
    const params2 = new URLSearchParams({ blocks: " Repos,  STREAK , Invalid " });
    expect(parseCardQueryParams(params2).blocks).toEqual(["repos", "streak"]);

    // All invalid blocks
    const params3 = new URLSearchParams({ blocks: "invalid1,invalid2" });
    expect(parseCardQueryParams(params3).blocks).toEqual(["bio", "stats", "langs"]);

    // Empty string
    const params4 = new URLSearchParams({ blocks: "" });
    expect(parseCardQueryParams(params4).blocks).toEqual(["bio", "stats", "langs"]);

    // Duplicates
    const params5 = new URLSearchParams({ blocks: "repos,repos,streak" });
    expect(parseCardQueryParams(params5).blocks).toEqual(["repos", "streak"]);
  });

  it("should parse layout parameter correctly", (): void => {
    // Valid layout
    const params1 = new URLSearchParams({ layout: "left:bio,right:stats,full:langs" });
    expect(parseCardQueryParams(params1).layout).toEqual({
      bio: "left",
      stats: "right",
      langs: "full",
    });

    // Invalid slots or blocks
    const params2 = new URLSearchParams({ layout: "invalidSlot:bio,left:invalidBlock,top:repos" });
    expect(parseCardQueryParams(params2).layout).toEqual({});

    // Spaces and mixed case
    const params3 = new URLSearchParams({ layout: " Left : Bio , RIGHT:stats " });
    expect(parseCardQueryParams(params3).layout).toEqual({
      bio: "left",
      stats: "right",
    });

    // Malformed pairs
    const params4 = new URLSearchParams({ layout: "left,bio:stats:full,right:" });
    expect(parseCardQueryParams(params4).layout).toEqual({});

    // Duplicate block assignments use the last valid slot.
    const params5 = new URLSearchParams({ layout: "left:bio,right:bio" });
    expect(parseCardQueryParams(params5).layout).toEqual({
      bio: "right",
    });
  });

  it("should parse hide parameter correctly", () => {
    const params1 = new URLSearchParams({ hide: "stars,commits" });
    expect(parseCardQueryParams(params1).hide).toEqual(new Set(["stars", "commits"]));

    const params2 = new URLSearchParams({ hide: " Stars , COMMITS " });
    expect(parseCardQueryParams(params2).hide).toEqual(new Set(["stars", "commits"]));

    const params3 = new URLSearchParams({ hide: "" });
    expect(parseCardQueryParams(params3).hide).toEqual(new Set());
  });

  it("should parse width parameter correctly", (): void => {
    // Valid width
    const params1 = new URLSearchParams({ width: "800" });
    expect(parseCardQueryParams(params1).width).toBe(800);

    // Boundary values
    const paramsMin = new URLSearchParams({ width: "320" });
    expect(parseCardQueryParams(paramsMin).width).toBe(320);

    const paramsMax = new URLSearchParams({ width: "1400" });
    expect(parseCardQueryParams(paramsMax).width).toBe(1400);

    // Too small
    const params2 = new URLSearchParams({ width: "319" });
    expect(parseCardQueryParams(params2).width).toBe(600);

    // Too large
    const params3 = new URLSearchParams({ width: "1401" });
    expect(parseCardQueryParams(params3).width).toBe(600);

    // Not a number
    const params4 = new URLSearchParams({ width: "invalid" });
    expect(parseCardQueryParams(params4).width).toBe(600);

    // Empty string
    const params5 = new URLSearchParams({ width: "" });
    expect(parseCardQueryParams(params5).width).toBe(600);
  });
});
