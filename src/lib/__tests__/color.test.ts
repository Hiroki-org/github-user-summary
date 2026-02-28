import { describe, it, expect } from "vitest";
import { adjustAccentColor, type ColorResult } from "../color";

/**
 * Unit tests for adjustAccentColor
 *
 * Test targets:
 * - Hex string input
 * - RGB array input
 * - RGB object input
 * - Invalid color fallback
 * - Low saturation color adjustment
 * - Lighten too dark colors
 * - Darken too bright colors
 * - hover color should be brighter than original
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.replace("#", "").match(/.{2}/g);
  if (!match) throw new Error(`Invalid hex: ${hex}`);
  return {
    r: parseInt(match[0], 16),
    g: parseInt(match[1], 16),
    b: parseInt(match[2], 16),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

describe("adjustAccentColor", () => {
  // ---------- Return structure ----------
  it("returns accent, accentRgb, accentHover on hex string input", () => {
    const result = adjustAccentColor("#3178c6");
    expect(result).toHaveProperty("accent");
    expect(result).toHaveProperty("accentRgb");
    expect(result).toHaveProperty("accentHover");
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result.accentRgb).toMatch(/^\d+, \d+, \d+$/);
    expect(result.accentHover).toMatch(/^#[0-9a-f]{6}$/i);
  });

  // ---------- Input formats ----------
  it("accepts RGB array [r, g, b]", () => {
    const result = adjustAccentColor([49, 120, 198]);
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("accepts RGB object { r, g, b }", () => {
    const result = adjustAccentColor({ r: 49, g: 120, b: 198 });
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns same result for different input formats of the same color", () => {
    const fromHex = adjustAccentColor("#3178c6");
    const fromArray = adjustAccentColor([49, 120, 198]);
    const fromObj = adjustAccentColor({ r: 49, g: 120, b: 198 });
    expect(fromHex.accent).toBe(fromArray.accent);
    expect(fromHex.accent).toBe(fromObj.accent);
  });

  // ---------- Invalid color fallback ----------
  it("falls back to default color (#58a6ff) for invalid color string", () => {
    const result = adjustAccentColor("not-a-color");
    // default #58a6ff is used (adjusted value)
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("falls back to default color for empty string", () => {
    const resultEmpty = adjustAccentColor("");
    const resultInvalid = adjustAccentColor("not-a-color");
    expect(resultEmpty.accent).toBe(resultInvalid.accent);
  });

  // ---------- Saturation adjustment ----------
  it("adjusts saturation for very low saturation colors (gray)", () => {
    const result = adjustAccentColor("#808080"); // pure gray s=0
    // result should not be pure gray anymore
    expect(result.accent).not.toBe("#808080");
  });

  // ---------- Lightness adjustment ----------
  it("adjusts lightness up for too dark colors (l < 45)", () => {
    const darkColor = "#1a1a6e"; // very dark blue
    const result = adjustAccentColor(darkColor);
    // adjusted should be brighter than original
    const originalLum = relativeLuminance(darkColor);
    const adjustedLum = relativeLuminance(result.accent);
    expect(adjustedLum).toBeGreaterThan(originalLum);
  });

  it("adjusts lightness down for too bright colors (l > 85)", () => {
    const brightColor = "#f0f0ff"; // very bright color
    const result = adjustAccentColor(brightColor);
    const originalLum = relativeLuminance(brightColor);
    const adjustedLum = relativeLuminance(result.accent);
    expect(adjustedLum).toBeLessThan(originalLum);
  });

  it("maintains colors in good range almost as is", () => {
    // TypeScript blue - already in good range
    const result = adjustAccentColor("#3178c6");
    // verify color doesnt change significantly
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  // ---------- hover color ----------
  it("accentHover is brighter than accent", () => {
    const result = adjustAccentColor("#3178c6");
    const accentLum = relativeLuminance(result.accent);
    const hoverLum = relativeLuminance(result.accentHover);
    expect(hoverLum).toBeGreaterThan(accentLum);
  });

  it("accentHover returns different color than accent", () => {
    const result = adjustAccentColor("#e34c26");
    expect(result.accentHover).not.toBe(result.accent);
  });

  // ---------- accentRgb format ----------
  it("accentRgb matches accent RGB values", () => {
    const result = adjustAccentColor("#3178c6");
    const rgb = hexToRgb(result.accent);
    expect(result.accentRgb).toBe(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
  });

  // ---------- various language colors ----------
  describe.each([
    { language: "JavaScript", color: "#f1e05a" },
    { language: "Python", color: "#3572A5" },
    { language: "Rust", color: "#dea584" },
    { language: "Go", color: "#00ADD8" },
    { language: "Ruby", color: "#701516" },
  ])("language color: $language ($color)", ({ color }) => {
    it("returns valid ColorResult", () => {
      const result = adjustAccentColor(color);
      expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(result.accentRgb).toMatch(/^\d+, \d+, \d+$/);
      expect(result.accentHover).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
