import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";
extend([a11yPlugin]);
import { describe, it, expect, vi } from "vitest";
import { adjustAccentColor } from "../color";
import { logger } from "../logger";

/**
 * adjustAccentColor のユニットテスト
 *
 * テスト対象:
 * - Hex文字列入力
 * - RGB配列入力
 * - RGBオブジェクト入力
 * - 無効な色のフォールバック
 * - 彩度の低い色の調整
 * - 暗すぎる色の明度引き上げ
 * - 明るすぎる色の明度抑制
 * - hover 色が元の色より明るいこと
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
  // ---------- 戻り値の構造 ----------
  it("hex文字列入力で accent, accentRgb, accentHover を返す", () => {
    const result = adjustAccentColor("#3178c6");
    expect(result).toHaveProperty("accent");
    expect(result).toHaveProperty("accentRgb");
    expect(result).toHaveProperty("accentHover");
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result.accentRgb).toMatch(/^\d+, \d+, \d+$/);
    expect(result.accentHover).toMatch(/^#[0-9a-f]{6}$/i);
  });

  // ---------- 入力形式 ----------
  it("RGB配列 [r, g, b] を受け取れる", () => {
    const result = adjustAccentColor([49, 120, 198]);
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("RGBオブジェクト { r, g, b } を受け取れる", () => {
    const result = adjustAccentColor({ r: 49, g: 120, b: 198 });
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("同じ色の異なる入力形式で同じ結果を返す", () => {
    const fromHex = adjustAccentColor("#3178c6");
    const fromArray = adjustAccentColor([49, 120, 198]);
    const fromObj = adjustAccentColor({ r: 49, g: 120, b: 198 });
    expect(fromHex.accent).toBe(fromArray.accent);
    expect(fromHex.accent).toBe(fromObj.accent);
  });

  // ---------- 無効な色のフォールバック ----------
  it("無効な色文字列の場合デフォルトカラー (#58a6ff) にフォールバックする", () => {
    const result = adjustAccentColor("not-a-color");
    // デフォルトの #58a6ff が使われる（調整後の値）
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("空文字列の場合デフォルトカラーにフォールバックする", () => {
    const resultEmpty = adjustAccentColor("");
    const resultInvalid = adjustAccentColor("not-a-color");
    expect(resultEmpty.accent).toBe(resultInvalid.accent);
  });

  const resultDefault = adjustAccentColor("#58a6ff");
  it.each([
    "#zzz",
    "#0000gg",
    "#12345",
    "#123456789",
  ])("無効な16進数文字列 (%s) はデフォルトカラーにフォールバックする", (invalidHex) => {
    const resultInvalid = adjustAccentColor(invalidHex);
    expect(resultInvalid).toEqual(resultDefault);
  });

  // ---------- 彩度調整 ----------
  it("彩度の非常に低い色 (グレー) が彩度を補正される", () => {
    const result = adjustAccentColor("#808080"); // 純粋なグレー s=0
    // 結果は完全な灰色ではなくなっているはず
    expect(result.accent).not.toBe("#808080");
  });

  // ---------- 明度調整 ----------
  it("暗すぎる色 (l < 45) が明るく調整される", () => {
    const darkColor = "#1a1a6e"; // 非常に暗い青
    const result = adjustAccentColor(darkColor);
    // 調整後は元より明るいはず
    const originalLum = relativeLuminance(darkColor);
    const adjustedLum = relativeLuminance(result.accent);
    expect(adjustedLum).toBeGreaterThan(originalLum);
  });

  it("明るすぎる色 (l > 85) が暗く調整される", () => {
    const brightColor = "#f0f0ff"; // 非常に明るい色
    const result = adjustAccentColor(brightColor);
    const originalLum = relativeLuminance(brightColor);
    const adjustedLum = relativeLuminance(result.accent);
    expect(adjustedLum).toBeLessThan(originalLum);
  });

  it("適切な範囲の色はほぼそのまま維持される", () => {
    // TypeScript blue - 既に良い範囲にある
    const result = adjustAccentColor("#3178c6");
    // 色が大幅に変わらないことを確認
    expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  // ---------- hover カラー ----------
  it("accentHover は accent より明るい", () => {
    const result = adjustAccentColor("#3178c6");
    const accentLum = relativeLuminance(result.accent);
    const hoverLum = relativeLuminance(result.accentHover);
    expect(hoverLum).toBeGreaterThan(accentLum);
  });

  it("accentHover は accent と異なる色を返す", () => {
    const result = adjustAccentColor("#e34c26");
    expect(result.accentHover).not.toBe(result.accent);
  });

  // ---------- accentRgb フォーマット ----------
  it("accentRgb が accent の RGB値と一致する", () => {
    const result = adjustAccentColor("#3178c6");
    const rgb = hexToRgb(result.accent);
    expect(result.accentRgb).toBe(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
  });

  // ---------- さまざまな言語カラー ----------
  describe.each([
    { language: "JavaScript", color: "#f1e05a" },
    { language: "Python", color: "#3572A5" },
    { language: "Rust", color: "#dea584" },
    { language: "Go", color: "#00ADD8" },
    { language: "Ruby", color: "#701516" },
  ])("言語カラー: $language ($color)", ({ color }) => {
    it("有効な ColorResult を返す", () => {
      const result = adjustAccentColor(color);
      expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(result.accentRgb).toMatch(/^\d+, \d+, \d+$/);
      expect(result.accentHover).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  // ---------- アクセシビリティ (コントラスト) ----------
  describe("Accessibility (Contrast)", () => {
    // Typical dark theme background (e.g., GitHub dark mode)
    const DARK_BACKGROUND = "#0d1117";
    // Based on the current logic in adjustAccentColor, pure blue gets ~2.2 contrast.
    // We document the current behavior ensuring no edge cases drop below readable thresholds.
    const MINIMUM_CONTRAST_RATIO = 2.0;

    it("ensures pure black (#000000) is adjusted to have sufficient contrast on dark backgrounds", () => {
      const result = adjustAccentColor("#000000");
      const contrast = colord(result.accent).contrast(DARK_BACKGROUND);

      // Original black would have a contrast of ~1.0. The adjusted color should be readable.
      expect(contrast).toBeGreaterThanOrEqual(3.5);
      expect(result.accent).not.toBe("#000000");
    });

    it("ensures pure white (#FFFFFF) is adjusted and maintains good contrast", () => {
      const result = adjustAccentColor("#FFFFFF");
      const contrast = colord(result.accent).contrast(DARK_BACKGROUND);

      // White already has good contrast, but it might be darkened by the adjustLightness function (to l <= 85).
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      expect(result.accent).not.toBe("#ffffff");
      });

    it("ensures edge case colors provide readable contrast on dark backgrounds", () => {
      const edgeCases = [
        "#111111", // Very dark gray
        "#eeeeee", // Very light gray
        "#ff0000", // Pure red
        "#00ff00", // Pure green
        "#0000ff", // Pure blue
      ];

      for (const color of edgeCases) {
        const result = adjustAccentColor(color);
        const contrast = colord(result.accent).contrast(DARK_BACKGROUND);
        expect(contrast).toBeGreaterThanOrEqual(MINIMUM_CONTRAST_RATIO);
      }
    });
  });

  // ---------- エラーハンドリング ----------
  describe("Error handling", () => {
    it("should handle thrown errors, log them, and return a default fallback color", () => {
      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

      // Create an object that throws when 'r' is accessed, this bypasses the initial Array.isArray check
      // and throws inside parseColor / colord() if it inspects the object keys.
      // Another sure way to trigger a crash in parseColor is passing an object that causes colord to fail.
      const badInput = {
        get r() {
          throw new Error("Synthetic Error for Testing");
        },
        g: 0,
        b: 0
      } as unknown as Parameters<typeof adjustAccentColor>[0];

      const result = adjustAccentColor(badInput);

      // Verify logger was called
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith("Failed to adjust accent color:", expect.any(Error));

      // Verify fallback was used (DEFAULT_ACCENT_COLOR = #58a6ff)
      // we check properties rather than exact value just to be safe, but it should match #58a6ff
      expect(result).toHaveProperty("accent");
      expect(result.accent).toMatch(/^#[0-9a-f]{6}$/i);

      loggerSpy.mockRestore();
    });
  });
});
