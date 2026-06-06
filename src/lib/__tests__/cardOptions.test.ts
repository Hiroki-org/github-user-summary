import { describe, it, expect } from "vitest";
import { parseCardQueryParams, resolveBlockLayout, DEFAULT_BLOCKS } from "../cardOptions";

describe("parseCardQueryParams", () => {
  it("should parse default values when no params are provided", () => {
    const params = new URLSearchParams();
    const result = parseCardQueryParams(params);

    expect(result.format).toBe("png");
    expect(result.theme).toBe("light");
    expect(result.cols).toBe(1);
    expect(result.blocks).toEqual(DEFAULT_BLOCKS);
    expect(result.layout).toEqual({});
    expect(result.hide.size).toBe(0);
    expect(result.width).toBe(600);
  });

  it("should parse format correctly", () => {
    let params = new URLSearchParams("format=svg");
    expect(parseCardQueryParams(params).format).toBe("svg");

    params = new URLSearchParams("format=invalid");
    expect(parseCardQueryParams(params).format).toBe("png");
  });

  it("should parse theme correctly", () => {
    let params = new URLSearchParams("theme=dark");
    expect(parseCardQueryParams(params).theme).toBe("dark");

    params = new URLSearchParams("theme=invalid");
    expect(parseCardQueryParams(params).theme).toBe("light");
  });

  it("should parse cols correctly", () => {
    let params = new URLSearchParams("cols=2");
    expect(parseCardQueryParams(params).cols).toBe(2);

    params = new URLSearchParams("cols=invalid");
    expect(parseCardQueryParams(params).cols).toBe(1);

    params = new URLSearchParams("cols=3");
    expect(parseCardQueryParams(params).cols).toBe(1);
  });

  it("should parse width correctly", () => {
    let params = new URLSearchParams("width=800");
    expect(parseCardQueryParams(params).width).toBe(800);

    params = new URLSearchParams("width=invalid");
    expect(parseCardQueryParams(params).width).toBe(600);

    params = new URLSearchParams("width=300"); // less than 320
    expect(parseCardQueryParams(params).width).toBe(600);

    params = new URLSearchParams("width=1500"); // greater than 1400
    expect(parseCardQueryParams(params).width).toBe(600);
  });

  it("should parse blocks correctly", () => {
    let params = new URLSearchParams("blocks=repos,streak");
    expect(parseCardQueryParams(params).blocks).toEqual(["repos", "streak"]);

    params = new URLSearchParams("blocks=repos,invalid,streak");
    expect(parseCardQueryParams(params).blocks).toEqual(["repos", "streak"]);

    params = new URLSearchParams("blocks=invalid");
    expect(parseCardQueryParams(params).blocks).toEqual(DEFAULT_BLOCKS);

    params = new URLSearchParams("blocks=repos, repos"); // handle spaces
    expect(parseCardQueryParams(params).blocks).toEqual(["repos"]);
  });

  it("should parse layout correctly", () => {
    let params = new URLSearchParams("layout=left:repos,right:streak");
    expect(parseCardQueryParams(params).layout).toEqual({
      repos: "left",
      streak: "right",
    });

    params = new URLSearchParams("layout=invalid:repos,left:invalid_block");
    expect(parseCardQueryParams(params).layout).toEqual({});

    params = new URLSearchParams("layout=left"); // missing block
    expect(parseCardQueryParams(params).layout).toEqual({});

    params = new URLSearchParams("layout= left : repos "); // spaces
    expect(parseCardQueryParams(params).layout).toEqual({
      repos: "left",
    });
  });

  it("should parse hide correctly", () => {
    let params = new URLSearchParams("hide=stars,forks");
    const result = parseCardQueryParams(params);
    expect(result.hide.has("stars")).toBe(true);
    expect(result.hide.has("forks")).toBe(true);
    expect(result.hide.size).toBe(2);

    params = new URLSearchParams("hide= stars , forks "); // handle spaces
    const result2 = parseCardQueryParams(params);
    expect(result2.hide.has("stars")).toBe(true);
    expect(result2.hide.has("forks")).toBe(true);
  });
});

describe("resolveBlockLayout", () => {
  it("should resolve layout for 1 column", () => {
    const options = parseCardQueryParams(new URLSearchParams("cols=1&blocks=bio,stats,langs&layout=left:bio,right:stats"));
    const result = resolveBlockLayout(options);

    expect(result.full).toEqual(["bio", "stats", "langs"]);
    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
  });

  it("should resolve layout for 2 columns evenly when no layout specified", () => {
    const options = parseCardQueryParams(new URLSearchParams("cols=2&blocks=bio,stats,langs,repos"));
    const result = resolveBlockLayout(options);

    expect(result.full).toEqual([]);
    expect(result.left).toEqual(["bio", "langs"]);
    expect(result.right).toEqual(["stats", "repos"]);
  });

  it("should resolve layout for 2 columns with layout constraints", () => {
    const options = parseCardQueryParams(new URLSearchParams("cols=2&blocks=bio,stats,langs,repos&layout=full:bio,left:stats"));
    const result = resolveBlockLayout(options);

    expect(result.full).toEqual(["bio"]);
    // remaining blocks: langs, repos. left has stats.
    // left: stats, langs -> 2
    // right: repos -> 1
    // wait, right gets langs because left length is 1 and right is 0.
    // Let's trace:
    // assigned: bio, stats
    // full: bio
    // left: stats
    // remaining: langs, repos
    // block: langs -> left.length(1) <= right.length(0) is false -> right.push(langs)
    // block: repos -> left.length(1) <= right.length(1) is true -> left.push(repos)
    expect(result.left).toEqual(["stats", "repos"]);
    expect(result.right).toEqual(["langs"]);
  });

  it("should handle invalid slots in layout gently", () => {
    const options = parseCardQueryParams(new URLSearchParams("cols=2&blocks=bio&layout=invalid:bio"));
    const result = resolveBlockLayout(options);

    expect(result.full).toEqual([]);
    expect(result.left).toEqual(["bio"]);
    expect(result.right).toEqual([]);
  });
});
