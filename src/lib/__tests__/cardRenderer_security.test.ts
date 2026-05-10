import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isTrustedFontUrl } from "../validators";

describe("isTrustedFontUrl", () => {
    const originalAppUrl = process.env.APP_URL;

    beforeEach(() => {
        delete process.env.APP_URL;
    });

    afterEach(() => {
        if (originalAppUrl === undefined) {
            delete process.env.APP_URL;
        } else {
            process.env.APP_URL = originalAppUrl;
        }
    });

    it("allows trusted JSDelivr paths via HTTPS", () => {
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf")).toBe(true);
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf")).toBe(true);
    });

    it("blocks untrusted JSDelivr paths", () => {
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/evil/malicious-font/font.ttf")).toBe(false);
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts-evil/font.ttf")).toBe(false);
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/../../evil/repo/font.ttf")).toBe(false);
        expect(isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/..%2f..%2fevil/repo/font.ttf")).toBe(false);
    });

    it("blocks JSDelivr via HTTP", () => {
        expect(isTrustedFontUrl("http://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf")).toBe(false);
    });

    it("allows the trusted application origin via HTTPS", () => {
        expect(isTrustedFontUrl("https://github-user-summary.vercel.app/fonts/NotoSans-Regular.ttf", "https://github-user-summary.vercel.app")).toBe(true);
    });

    it("allows a configured HTTPS application origin", () => {
        process.env.APP_URL = "https://custom.example";

        expect(isTrustedFontUrl("https://custom.example/fonts/NotoSans-Regular.ttf", "https://custom.example")).toBe(true);
    });

    it("blocks application origin via HTTP", () => {
        process.env.APP_URL = "http://localhost:3000";

        expect(isTrustedFontUrl("http://localhost:3000/fonts/NotoSans-Regular.ttf", "http://localhost:3000")).toBe(false);
        expect(isTrustedFontUrl("https://localhost:3000/fonts/NotoSans-Regular.ttf", "https://localhost:3000")).toBe(false);
    });

    it("blocks untrusted hosts", () => {
        expect(isTrustedFontUrl("https://evil.com/font.ttf", "https://github-user-summary.vercel.app")).toBe(false);
    });

    it("blocks the host if the origin does not match exactly", () => {
        expect(isTrustedFontUrl("https://github-user-summary.vercel.app:444/fonts/font.ttf", "https://github-user-summary.vercel.app")).toBe(false);
    });

    it("blocks relative URLs", () => {
        expect(isTrustedFontUrl("/fonts/font.ttf")).toBe(false);
    });

    it("handles invalid URL strings gracefully", () => {
        expect(isTrustedFontUrl("not-a-url")).toBe(false);
    });
});
