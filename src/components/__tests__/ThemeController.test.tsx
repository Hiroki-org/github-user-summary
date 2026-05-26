import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ThemeController from "@/components/ThemeController";
import * as colorLib from "@/lib/color";

// Hoist variables for use in mocks
const { mockGetColorAsync, mockDestroy } = vi.hoisted(() => ({
  mockGetColorAsync: vi.fn().mockResolvedValue({ value: [100, 150, 200, 255] }),
  mockDestroy: vi.fn(),
}));

// We need to test the component's effect on the DOM via the hook.
// The hook uses fast-average-color, which we need to mock so it doesn't try to fetch real images in tests.
vi.mock("fast-average-color", () => {
  return {
    FastAverageColor: vi.fn().mockImplementation(function() {
      return {
        getColorAsync: mockGetColorAsync,
        destroy: mockDestroy,
      };
    }),
  };
});

// Mock color.ts for deterministic output
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

describe("ThemeController", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetColorAsync.mockResolvedValue({
      value: [100, 150, 200, 255]
    });
    // Ensure adjustAccentColor mock implementation is restored
    vi.mocked(colorLib.adjustAccentColor).mockImplementation((color) => ({
      accent: `mock-accent-${color}`,
      accentRgb: `mock-rgb-${color}`,
      accentHover: `mock-hover-${color}`,
    }));

    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-rgb");
    document.documentElement.style.removeProperty("--accent-hover");
  });

  afterEach(() => {
    // We don't use resetAllMocks because it clears implementations we want to keep.
    // clearAllMocks in beforeEach is sufficient for call history.
    consoleSpy?.mockRestore();
    consoleSpy = undefined;
  });

  it("renders null but sets CSS variables immediately when topLanguageColor is provided", () => {
    const { container } = render(<ThemeController topLanguageColor="#ff0000" />);

    // Renders null
    expect(container.firstChild).toBeNull();

    // Sets CSS variables on document.documentElement
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#ff0000");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-#ff0000");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-#ff0000");

    // adjustAccentColor should have been called
    expect(colorLib.adjustAccentColor).toHaveBeenCalledWith("#ff0000");
  });

  it("sets CSS variables asynchronously when avatarUrl is provided", async () => {
    render(<ThemeController avatarUrl="https://example.com/avatar.png" />);

    // Wait for the async color extraction
    await waitFor(() => {
      expect(colorLib.adjustAccentColor).toHaveBeenCalledWith([100, 150, 200]);
    });

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-100,150,200");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-100,150,200");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-100,150,200");
  });

  it("prioritizes topLanguageColor initially, then overrides with avatarUrl color", async () => {
    render(
      <ThemeController
        avatarUrl="https://example.com/avatar.png"
        topLanguageColor="#00ff00"
      />
    );

    // Initial sync application
    expect(colorLib.adjustAccentColor).toHaveBeenCalledWith("#00ff00");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#00ff00");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-#00ff00");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-#00ff00");

    // Async application overrides it
    await waitFor(() => {
      expect(colorLib.adjustAccentColor).toHaveBeenCalledWith([100, 150, 200]);
    });

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-100,150,200");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-100,150,200");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-100,150,200");
  });

  it("handles failure during color extraction", async () => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetColorAsync.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(
      <ThemeController
        avatarUrl="https://example.com/avatar.png"
        topLanguageColor="#0000ff"
      />
    );

    // Initial sync application
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#0000ff");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-#0000ff");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-#0000ff");

    // Wait for the async failure
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to extract color from avatar, keeping fallback color.",
        expect.any(Error)
      );
    });

    // Still has the fallback color
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#0000ff");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("mock-rgb-#0000ff");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("mock-hover-#0000ff");
  });

  it("cleans up CSS variables on unmount", () => {
    const { unmount } = render(<ThemeController topLanguageColor="#ff0000" />);

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("mock-accent-#ff0000");

    unmount();

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-rgb")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-hover")).toBe("");
  });
});
