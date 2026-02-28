import { describe, expect, it } from "vitest";

import { parseCardQueryParams, resolveBlockLayout } from "@/lib/cardRenderer";

describe("parseCardQueryParams", () => {
    it("falls back to defaults for invalid params", () => {
        const params = new URLSearchParams({
            format: "gif",
            theme: "solarized",
            blocks: "x,y,z",
            cols: "9",
            width: "10000",
        });

        const parsed = parseCardQueryParams(params);

        expect(parsed.format).toBe("png");
        expect(parsed.theme).toBe("light");
        expect(parsed.cols).toBe(1);
        expect(parsed.blocks).toEqual(["bio", "stats", "langs"]);
        expect(parsed.width).toBe(600);
    });

    it("parses valid block/layout/filter params", () => {
        const params = new URLSearchParams({
            format: "svg",
            theme: "dark",
            blocks: "bio,stats,repos",
            cols: "2",
            layout: "left:bio,right:stats,full:repos",
            hide: "stars,forks",
            width: "720",
        });

        const parsed = parseCardQueryParams(params);

        expect(parsed.format).toBe("svg");
        expect(parsed.theme).toBe("dark");
        expect(parsed.cols).toBe(2);
        expect(parsed.blocks).toEqual(["bio", "stats", "repos"]);
        expect(parsed.layout.bio).toBe("left");
        expect(parsed.layout.stats).toBe("right");
        expect(parsed.layout.repos).toBe("full");
        expect(parsed.hide.has("stars")).toBe(true);
        expect(parsed.width).toBe(720);
    });
});

describe("resolveBlockLayout", () => {
    it("assigns remaining blocks in reading order when layout is omitted", () => {
        const options = parseCardQueryParams(new URLSearchParams({ blocks: "bio,stats,langs,repos", cols: "2" }));
        const layout = resolveBlockLayout(options);

        expect(layout.left.length + layout.right.length + layout.full.length).toBe(4);
        expect(layout.full).toEqual([]);
    });

    it("keeps explicit full blocks in two-column mode", () => {
        const options = parseCardQueryParams(
            new URLSearchParams({
                blocks: "bio,stats,langs",
                cols: "2",
                layout: "full:langs,left:bio,right:stats",
            }),
        );
        const layout = resolveBlockLayout(options);

        expect(layout.full).toEqual(["langs"]);
        expect(layout.left).toEqual(["bio"]);
        expect(layout.right).toEqual(["stats"]);
    });
});
