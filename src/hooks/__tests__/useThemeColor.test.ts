// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useThemeColor } from "@/hooks/useThemeColor";

type MockColor = {
  value: [number, number, number, number];
  hex: string;
  rgba: string;
};

type AccentResult = {
  accent: string;
  accentRgb: string;
  accentHover: string;
};

const MOCK_COLOR: MockColor = {
  value: [100, 150, 200, 255],
  hex: "#6496c8",
  rgba: "rgba(100,150,200,1)",
};

const MOCK_ACCENT_RESULT: AccentResult = {
  accent: "mock-accent",
  accentRgb: "100, 150, 200",
  accentHover: "mock-accent-hover",
};

const { mockGetColorAsync, mockDestroy, mockAdjustAccentColor } = vi.hoisted(() => ({
  mockGetColorAsync: vi.fn(),
  mockDestroy: vi.fn(),
  mockAdjustAccentColor: vi.fn(),
}));

vi.mock("fast-average-color", () => {
  class MockFastAverageColor {
    getColorAsync = mockGetColorAsync;
    destroy = mockDestroy;
  }

  return {
    FastAverageColor: MockFastAverageColor,
  };
});

vi.mock("@/lib/color", () => ({
  adjustAccentColor: mockAdjustAccentColor,
}));

describe("useThemeColor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.cssText = "";
    mockGetColorAsync.mockResolvedValue(MOCK_COLOR);
    mockAdjustAccentColor.mockReturnValue(MOCK_ACCENT_RESULT);
  });

  afterEach(() => {
    document.documentElement.style.cssText = "";
  });

  it("applies the fallback color immediately", () => {
    renderHook(() => useThemeColor({ topLanguageColor: "#ff0000" }));

    expect(mockAdjustAccentColor).toHaveBeenCalledWith("#ff0000");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(MOCK_ACCENT_RESULT.accent);
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe(MOCK_ACCENT_RESULT.accentRgb);
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe(MOCK_ACCENT_RESULT.accentHover);
  });

  it("applies the avatar color after the fallback when both inputs are provided", async () => {
    renderHook(() =>
      useThemeColor({
        topLanguageColor: "#ff0000",
        avatarUrl: "https://example.com/avatar.jpg",
      })
    );

    await waitFor(() => {
      expect(mockGetColorAsync).toHaveBeenCalled();
    });

    expect(mockAdjustAccentColor).toHaveBeenNthCalledWith(1, "#ff0000");
    expect(mockAdjustAccentColor).toHaveBeenNthCalledWith(2, [100, 150, 200]);
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(MOCK_ACCENT_RESULT.accent);
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe(MOCK_ACCENT_RESULT.accentRgb);
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe(MOCK_ACCENT_RESULT.accentHover);
  });

  it("cleans up CSS variables and destroys FastAverageColor on unmount", () => {
    const { unmount } = renderHook(() => useThemeColor({ topLanguageColor: "#ff0000" }));

    unmount();

    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("");
  });

  it("ignores an extracted color if unmounted before the promise resolves", async () => {
    let resolveColor!: (value: MockColor) => void;

    mockGetColorAsync.mockReturnValueOnce(
      new Promise<MockColor>((resolve) => {
        resolveColor = resolve;
      })
    );

    const { unmount } = renderHook(() =>
      useThemeColor({
        avatarUrl: "https://example.com/avatar.jpg",
      })
    );

    unmount();
    resolveColor(MOCK_COLOR);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("");
  });

  it("logs a warning when avatar color extraction fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetColorAsync.mockRejectedValueOnce(new Error("Network error"));

    renderHook(() =>
      useThemeColor({
        avatarUrl: "https://example.com/avatar.jpg",
      })
    );

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to extract color from avatar, keeping fallback color.",
        expect.any(Error)
      );
    });

    warnSpy.mockRestore();
  });
});
