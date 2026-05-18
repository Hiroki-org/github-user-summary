import type { UserSummary, CardLayout } from "@/lib/types";
import type { CardDisplayOptions } from "@/lib/cardSettings";
import type { RefObject } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardPreview } from "@/hooks/useCardPreview";
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
  let mockCardRef: RefObject<HTMLDivElement | null>;
  let mockSummary: unknown;
  let mockLayout: unknown;
  let mockDisplayOptions: unknown;
  let mockAnchor: HTMLAnchorElement;
  let mockAnchorClick: ReturnType<typeof vi.fn>;
  let originalFontsDescriptor: PropertyDescriptor | undefined;
  let originalClipboardDescriptor: PropertyDescriptor | undefined;

  const createMockCardElement = () =>
    ({
      getBoundingClientRect: () => ({
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        toJSON: () => ({}),
      }),
      scrollWidth: 800,
      scrollHeight: 600,
      clientWidth: 800,
      clientHeight: 600,
    }) as HTMLDivElement;

  const flushImageGeneration = async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    // Setup mocks
    mockCardRef = {
      current: createMockCardElement(),
    };

    mockSummary = { profile: { login: "testuser" } };
    mockLayout = { id: "layout1" };
    mockDisplayOptions = { theme: "dark" };

    // Mock document.fonts.ready
    originalFontsDescriptor = Object.getOwnPropertyDescriptor(document, "fonts");
    Object.defineProperty(document, "fonts", {
      get: () => ({ ready: Promise.resolve() }),
      configurable: true,
    });

    // Mock document.createElement for handleDownload
    mockAnchorClick = vi.fn();
    mockAnchor = {
      download: "",
      href: "",
      click: mockAnchorClick,
    } as unknown as HTMLAnchorElement;
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        return mockAnchor;
      }
      return originalCreateElement(tagName);
    });

    // Mock navigator.clipboard
    originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    // Mock ClipboardItem
    vi.stubGlobal(
      "ClipboardItem",
      vi.fn(function ClipboardItem(data: Record<string, Blob>) {
        return data;
      }),
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    if (originalFontsDescriptor) {
      Object.defineProperty(document, "fonts", originalFontsDescriptor);
    } else {
      Reflect.deleteProperty(document, "fonts");
    }

    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
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

    await flushImageGeneration();

    expect(result.current.isGenerating).toBe(false);

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

    await flushImageGeneration();

    expect(result.current.isGenerating).toBe(false);

    expect(logger.error).toHaveBeenCalledWith("Failed to generate image", error);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
  });

  it("should return early if cardRef is null during generation", async () => {
    const nullRef = { current: null };

    const { result } = renderHook(() =>
      useCardPreview(true, nullRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(true);

    await flushImageGeneration();

    expect(result.current.isGenerating).toBe(false);

    expect(toPng).not.toHaveBeenCalled();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
  });

  it("should reset preview when dependencies change while open", async () => {
    vi.mocked(toPng).mockResolvedValue("mock-url");

    const { result, rerender } = renderHook(
      (props) => useCardPreview(props.isOpen, mockCardRef, mockSummary as unknown as UserSummary, props.layout as unknown as CardLayout, props.displayOptions as unknown as CardDisplayOptions),
      {
        initialProps: {
          isOpen: true,
          layout: mockLayout,
          displayOptions: mockDisplayOptions,
        },
      }
    );

    await flushImageGeneration();

    expect(result.current.previewUrl).toBe("mock-url");

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

    await flushImageGeneration();

    expect(result.current.previewUrl).toBe("mock-url");

    act(() => {
      result.current.handleDownload();
    });

    expect(mockAnchor.download).toBe("testuser-summary-card.png");
    expect(mockAnchor.href).toBe("mock-url");
    expect(mockAnchorClick).toHaveBeenCalled();
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

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.copyStatus).toBe("idle");
  });

  it("should return early when copying with a null cardRef", async () => {
    const nullRef = { current: null };

    const { result } = renderHook(() =>
      useCardPreview(false, nullRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(toBlob).not.toHaveBeenCalled();
    expect(navigator.clipboard.write).not.toHaveBeenCalled();
    expect(result.current.copyStatus).toBe("idle");
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

  it("should handle null blob copy failure", async () => {
    vi.mocked(toBlob).mockResolvedValue(null);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to copy", expect.any(Error));
    expect(result.current.copyStatus).toBe("error");
    expect(navigator.clipboard.write).not.toHaveBeenCalled();
  });

  it("should handle clipboard write failure", async () => {
    const mockBlob = new Blob(["test"], { type: "image/png" });
    const error = new Error("Clipboard denied");
    vi.mocked(toBlob).mockResolvedValue(mockBlob);
    vi.mocked(navigator.clipboard.write).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith("Failed to copy", error);
    expect(result.current.copyStatus).toBe("error");
  });

  it("should cancel generation on unmount", async () => {
    vi.mocked(toPng).mockResolvedValue("mock");

    const { result, unmount } = renderHook(() =>
      useCardPreview(true, mockCardRef, mockSummary as unknown as UserSummary, mockLayout as unknown as CardLayout, mockDisplayOptions as unknown as CardDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(true);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(toPng).not.toHaveBeenCalled();
    expect(result.current.previewUrl).toBeNull();
  });
});
