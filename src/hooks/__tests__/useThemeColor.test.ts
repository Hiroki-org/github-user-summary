// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { useThemeColor } from "../useThemeColor";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetColorAsync = vi.fn().mockResolvedValue({
  value: [100, 150, 200, 255],
  hex: "#6496c8",
  rgba: "rgba(100,150,200,1)"
});
const mockDestroy = vi.fn();

// Mock fast-average-color
vi.mock("fast-average-color", () => {
  return {
    FastAverageColor: function() {
      // @ts-expect-error mock implementation
      this.getColorAsync = mockGetColorAsync;
      // @ts-expect-error mock implementation
      this.destroy = mockDestroy;
      return this;
    }
  };
});

// Mock @/lib/color
vi.mock("@/lib/color", () => ({
  adjustAccentColor: vi.fn().mockReturnValue({
    accent: "mock-accent",
    accentRgb: "100, 150, 200",
    accentHover: "mock-accent-hover"
  })
}));

describe("useThemeColor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.cssText = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should apply topLanguageColor immediately as fallback", () => {
    renderHook(() => useThemeColor({ topLanguageColor: "#ff0000" }));

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("100, 150, 200");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-accent-hover");
  });

  it("should extract and apply color from avatarUrl asynchronously", async () => {
    const { unmount } = renderHook(() => useThemeColor({ avatarUrl: "https://example.com/avatar.jpg" }));

    await waitFor(() => {
      expect(mockGetColorAsync).toHaveBeenCalled();
    });

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("100, 150, 200");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-accent-hover");

    unmount();
  });

  it("should clean up CSS variables and destroy FastAverageColor on unmount", () => {
    const { unmount } = renderHook(() => useThemeColor({ topLanguageColor: "#ff0000" }));

    // Check initial variables are set
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent");

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("");
  });

  it("should not apply extracted color if unmounted before promise resolves", async () => {
    let resolvePromise: (value: { value: [number, number, number, number], hex: string, rgba: string }) => void = () => {};
    mockGetColorAsync.mockReturnValueOnce(new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    const { unmount } = renderHook(() => useThemeColor({ avatarUrl: "https://example.com/avatar.jpg" }));

    // Unmount before promise resolves
    unmount();

    // Now resolve the promise
    resolvePromise({ value: [100, 150, 200, 255], hex: "#6496c8", rgba: "rgba(100,150,200,1)" });

    // Wait a tick for promise handlers
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Because it unmounted, resetColor was called and then the promise resolution should be ignored
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
  });

  it("should handle extraction errors gracefully", async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockGetColorAsync.mockRejectedValueOnce(new Error("Network error"));

    const { unmount } = renderHook(() => useThemeColor({ avatarUrl: "https://example.com/avatar.jpg" }));

    await waitFor(() => {
      expect(mockGetColorAsync).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to extract color from avatar, keeping fallback color.", expect.any(Error));
    });

    consoleWarnSpy.mockRestore();
    unmount();
  });
});
