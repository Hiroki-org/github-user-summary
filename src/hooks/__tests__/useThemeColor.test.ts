// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useThemeColor } from "../useThemeColor";
import * as colorLib from "@/lib/color";
import { FastAverageColor } from "fast-average-color";
import { logger } from "@/lib/logger";

// Mock fast-average-color
vi.mock("fast-average-color", () => {
  const mockGetColorAsync = vi.fn();
  const mockDestroy = vi.fn();
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FastAverageColor: vi.fn().mockImplementation(function(this: any) {
      this.getColorAsync = mockGetColorAsync;
      this.destroy = mockDestroy;
      return this;
    }),
  };
});

// Mock color.ts
vi.mock("@/lib/color", () => {
  return {
    adjustAccentColor: vi.fn().mockImplementation((color) => {
      return {
        accent: `mock-accent-${color}`,
        accentRgb: `mock-rgb-${color}`,
        accentHover: `mock-hover-${color}`,
      };
    }),
  };
});

describe("useThemeColor", () => {
  let mockGetColorAsync: ReturnType<typeof vi.fn>;
  let mockDestroy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear CSS variables
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-rgb");
    document.documentElement.style.removeProperty("--accent-hover");

    // Setup mocked methods for FastAverageColor
    const facInstance = new FastAverageColor();
    mockGetColorAsync = facInstance.getColorAsync as ReturnType<typeof vi.fn>;
    mockDestroy = facInstance.destroy as ReturnType<typeof vi.fn>;

    // Default mock implementation
    mockGetColorAsync.mockResolvedValue({
      value: [100, 150, 200, 255]
    });

    // Suppress console.warn for error tests
    vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should apply topLanguageColor immediately if provided", () => {
    renderHook(() => useThemeColor({ topLanguageColor: "#ff0000" }));

    expect(colorLib.adjustAccentColor).toHaveBeenCalledWith("#ff0000");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#ff0000");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-#ff0000");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-#ff0000");
  });

  it("should extract color from avatarUrl asynchronously and apply it", async () => {
    renderHook(() => useThemeColor({ avatarUrl: "https://example.com/avatar.jpg" }));

    // Wait for async color extraction to complete
    await waitFor(() => {
      expect(mockGetColorAsync).toHaveBeenCalled();
    });

    // The hook slices the value to get RGB [100, 150, 200]
    await waitFor(() => {
      expect(colorLib.adjustAccentColor).toHaveBeenCalledWith([100, 150, 200]);
    });

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-100,150,200");
  });

  it("should prioritize topLanguageColor initially, then override with avatarUrl color", async () => {
    renderHook(() => useThemeColor({
      topLanguageColor: "#00ff00",
      avatarUrl: "https://example.com/avatar.jpg"
    }));

    // Initially applied topLanguageColor
    expect(colorLib.adjustAccentColor).toHaveBeenCalledWith("#00ff00");

    // Wait for async extraction
    await waitFor(() => {
      expect(mockGetColorAsync).toHaveBeenCalled();
    });

    // Overridden by avatar color
    await waitFor(() => {
      expect(colorLib.adjustAccentColor).toHaveBeenCalledWith([100, 150, 200]);
    });

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-100,150,200");
  });

  it("should handle error during color extraction gracefully", async () => {
    // Mock rejection
    const error = new Error("Failed to load image");
    mockGetColorAsync.mockRejectedValueOnce(error);

    renderHook(() => useThemeColor({
      topLanguageColor: "#0000ff", // Provide fallback
      avatarUrl: "https://example.com/bad-avatar.jpg"
    }));

    // Wait for extraction to fail
    await waitFor(() => {
      expect(mockGetColorAsync).toHaveBeenCalled();
    });

    // Check that console.warn was called
    await waitFor(() => {
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to extract color from avatar, keeping fallback color.",
        error
      );
    });

    // Should still have the fallback color applied
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#0000ff");

    // adjustAccentColor should only be called once for the fallback, not for the failed avatar
    expect(colorLib.adjustAccentColor).toHaveBeenCalledTimes(1);
    expect(colorLib.adjustAccentColor).toHaveBeenCalledWith("#0000ff");
  });

  it("should cleanup variables and destroy FastAverageColor on unmount", () => {
    // Manually set some properties first to ensure they get removed
    document.documentElement.style.setProperty("--accent", "test-accent");
    document.documentElement.style.setProperty("--accent-rgb", "test-rgb");
    document.documentElement.style.setProperty("--accent-hover", "test-hover");

    const { unmount } = renderHook(() => useThemeColor({ avatarUrl: "https://example.com/avatar.jpg" }));

    // Unmount
    unmount();

    // Check that properties are removed
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("");

    // Check that fac.destroy was called
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should do nothing if neither avatarUrl nor topLanguageColor are provided", () => {
    renderHook(() => useThemeColor({}));

    expect(colorLib.adjustAccentColor).not.toHaveBeenCalled();
    expect(mockGetColorAsync).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
  });
});
