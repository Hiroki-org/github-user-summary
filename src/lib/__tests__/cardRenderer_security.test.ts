import { describe, it, expect } from "vitest";
import { isTrustedFontUrl } from "../validators";

describe("isTrustedFontUrl", () => {
    it("allows trusted JSDelivr paths via HTTPS", () => {
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf")).toBe(true);
    });

    it("blocks untrusted JSDelivr paths", () => {
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/evil/malicious-font/font.ttf")).toBe(false);
    });

    it("blocks JSDelivr via HTTP", () => {
        expect(isTrustedFontUrl("http://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf")).toBe(false);
    });

    it("allows the trusted application origin via HTTPS", () => {
        expect(isTrustedFontUrl("https://myapp.com/fonts/NotoSans-Regular.ttf", "https://myapp.com")).toBe(true);
    });

    it("blocks application origin via HTTP", () => {
        expect(isTrustedFontUrl("http://myapp.com/fonts/NotoSans-Regular.ttf", "https://myapp.com")).toBe(false);
    });

    it("blocks untrusted hosts", () => {
        expect(isTrustedFontUrl("https://evil.com/font.ttf", "https://myapp.com")).toBe(false);
    });

    it("blocks the host if the origin does not match exactly", () => {
        expect(isTrustedFontUrl("https://myapp.net/fonts/font.ttf", "https://myapp.com")).toBe(false);
    });

    it("blocks relative URLs", () => {
        expect(isTrustedFontUrl("/fonts/font.ttf")).toBe(false);
    });

    it("handles invalid URL strings gracefully", () => {
        expect(isTrustedFontUrl("not-a-url")).toBe(false);
    });

    it("blocks when allowedOrigin is manipulated to an untrusted domain", () => {
        expect(isTrustedFontUrl("https://evil.com/font.ttf", "https://evil.com")).toBe(false);
    });
});
