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

    it("allows the trusted application origin via HTTPS (localhost)", () => {
        expect(isTrustedFontUrl("https://localhost:3000/fonts/NotoSans-Regular.ttf", "https://localhost:3000")).toBe(true);
    });

    it("allows the trusted application origin via HTTPS (vercel app)", () => {
        expect(isTrustedFontUrl("https://github-user-summary.vercel.app/fonts/NotoSans-Regular.ttf", "https://github-user-summary.vercel.app")).toBe(true);
    });

    it("blocks application origin via HTTP", () => {
        expect(isTrustedFontUrl("http://localhost:3000/fonts/NotoSans-Regular.ttf", "http://localhost:3000")).toBe(false);
    });

    it("blocks untrusted hosts even with trusted allowedOrigin", () => {
        expect(isTrustedFontUrl("https://evil.com/font.ttf", "https://localhost:3000")).toBe(false);
    });

    it("blocks the host if the origin does not match exactly", () => {
        expect(isTrustedFontUrl("https://github-user-summary.vercel.app.malicious.com/fonts/font.ttf", "https://github-user-summary.vercel.app")).toBe(false);
    });


    it("blocks allowedOrigin if it is not in the trusted list", () => {
        expect(isTrustedFontUrl("https://myapp.com/fonts/NotoSans-Regular.ttf", "https://myapp.com")).toBe(false);
    });
    it("blocks relative URLs", () => {
        expect(isTrustedFontUrl("/fonts/font.ttf")).toBe(false);
    });

    it("handles invalid URL strings gracefully", () => {
        expect(isTrustedFontUrl("not-a-url")).toBe(false);
    });
});
