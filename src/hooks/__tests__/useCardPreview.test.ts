import type { UserSummary, CardLayout } from "@/lib/types";
import type { CardDisplayOptions } from "@/lib/cardSettings";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCardPreview } from "../useCardPreview";
import { toPng, toBlob } from "html-to-image";
import { logger } from "@/lib/logger";

// Mock external dependencies
vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
  toBlob: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("useCardPreview", () => {
  let mockCardRef: React.RefObject<HTMLDivElement | null>;
  let mockSummary: unknown;
  let mockLayout: unknown;
  let mockDisplayOptions: unknown;

  beforeEach(() => {
    vi.clearAllMocks();

    // We will use real timers, just mock RAF
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 0));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

    // Setup mocks
    mockCardRef = {
      current: {
        getBoundingClientRect: () => ({ width: 800, height: 600, x: 0, y: 0, bottom: 600, left: 0, right: 800, top: 0, toJSON: () => {} } as unknown as DOMRect),
        scrollWidth: 800,
        scrollHeight: 600,
        clientWidth: 800,
        clientHeight: 600,
      },
    } as unknown as React.RefObject<HTMLDivElement | null>;

    mockSummary = { profile: { login: "testuser" } };
    mockLayout = { id: "layout1" };
    mockDisplayOptions = { theme: "dark" };

    // Mock document.fonts.ready
    Object.defineProperty(document, "fonts", {
      value: { ready: Promise.resolve() },
      configurable: true,
    });

    // Mock document.createElement for handleDownload
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        return {
          download: "",
          href: "",
          click: mockClick,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    // Mock navigator.clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    // Mock ClipboardItem
    vi.stubGlobal("ClipboardItem", class { constructor(public data: unknown) {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
    expect(result.current.copyStatus).toBe("idle");
  });

  it("should generate image when opened", async () => {
    const mockDataUrl = "data:image/png;base64,mocked";
    vi.mocked(toPng).mockResolvedValue(mockDataUrl);

    const { result } = renderHook(() =>
      useCardPreview(true, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(true);

    // Wait for the async generation to complete
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(toPng).toHaveBeenCalledWith(mockCardRef.current, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "#0d1117",
    });

    expect(result.current.previewUrl).toBe(mockDataUrl);
    expect(result.current.previewSize).toEqual({ width: 800, height: 600 });
  });

  it("should handle error during image generation", async () => {
    const error = new Error("Mock generation error");
    vi.mocked(toPng).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useCardPreview(true, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(true);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to generate image", error);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
  });

  it("should return early if cardRef is null during generation", async () => {
    const nullRef = { current: null };

    const { result } = renderHook(() =>
      useCardPreview(true, nullRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(toPng).not.toHaveBeenCalled();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
  });

  it("should reset preview when dependencies change while open", async () => {
    vi.mocked(toPng).mockResolvedValue("mock-url");

    const { result, rerender } = renderHook(
      (props: { isOpen: boolean, layout: unknown, displayOptions: unknown }) => useCardPreview(props.isOpen, mockCardRef, mockSummary as unknown as UserSummary, props.layout as unknown as CardLayout, props.displayOptions as unknown as CardDisplayOptions),
      {
        initialProps: {
          isOpen: true,
          layout: mockLayout,
          displayOptions: mockDisplayOptions,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.previewUrl).toBe("mock-url");
    });

    // Rerender with new layout
    const newLayout = { id: "layout2" };
    rerender({ isOpen: true, layout: newLayout as unknown as CardLayout, displayOptions: mockDisplayOptions as unknown as CardDisplayOptions });

    // Should immediately clear previewUrl and start generating again
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
    expect(result.current.isGenerating).toBe(true);
  });

  it("should handle download", async () => {
    vi.mocked(toPng).mockResolvedValue("mock-url");

    const { result } = renderHook(() =>
      useCardPreview(true, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await waitFor(() => {
      expect(result.current.previewUrl).toBe("mock-url");
    });

    act(() => {
      result.current.handleDownload();
    });

    const mockAnchor = vi.mocked(document.createElement).mock.results.find(r => r.value && r.value.download !== undefined)?.value;
    expect(mockAnchor.download).toBe("testuser-summary-card.png");
    expect(mockAnchor.href).toBe("mock-url");
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it("should do nothing if handleDownload is called without previewUrl", () => {
    vi.mocked(document.createElement).mockClear();
    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    act(() => {
      result.current.handleDownload();
    });

    expect(vi.mocked(document.createElement).mock.calls.some(call => call[0] === 'a')).toBe(false);
  });

  it("should successfully copy to clipboard", async () => {
    const mockBlob = new Blob(["test"], { type: "image/png" });
    vi.mocked(toBlob).mockResolvedValue(mockBlob as unknown as Blob);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(toBlob).toHaveBeenCalledWith(mockCardRef.current, {
      cacheBust: true,
      backgroundColor: "#0d1117",
    });

    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(result.current.copyStatus).toBe("copied");
  });

  it("should handle copy failure", async () => {
    const error = new Error("Blob error");
    vi.mocked(toBlob).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to copy", error);
    expect(result.current.copyStatus).toBe("error");
  });

  it("should cancel generation on unmount", async () => {
    vi.mocked(toPng).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("mock"), 1000)));
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { result, unmount } = renderHook(() =>
      useCardPreview(true, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(true);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
