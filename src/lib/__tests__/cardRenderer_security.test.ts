import { describe, it, expect } from "vitest";
import { isTrustedFontUrl } from "../validators";

describe("isTrustedFontUrl", () => {
    it("allows JSDelivr URLs", () => {
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf")).toBe(true);
    });

    it("allows the current origin when provided", () => {
        expect(isTrustedFontUrl("http://localhost:3000/fonts/NotoSans-Regular.ttf", "http://localhost:3000")).toBe(true);
    });

    it("blocks untrusted hosts", () => {
        expect(isTrustedFontUrl("https://evil.com/font.ttf", "http://localhost:3000")).toBe(false);
    });

    it("blocks the host if the origin does not match exactly", () => {
        expect(isTrustedFontUrl("http://localhost:3001/fonts/font.ttf", "http://localhost:3000")).toBe(false);
    });

    it("blocks relative URLs (as they are invalid URLs for the constructor)", () => {
        expect(isTrustedFontUrl("/fonts/font.ttf")).toBe(false);
    });

    it("handles invalid URL strings gracefully", () => {
        expect(isTrustedFontUrl("not-a-url")).toBe(false);
    });

    it("blocks local host if no origin is specifically allowed", () => {
        expect(isTrustedFontUrl("http://localhost:3000/fonts/font.ttf")).toBe(false);
    });
});
