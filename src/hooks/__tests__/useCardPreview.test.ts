// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCardPreview } from "../useCardPreview";
import { logger } from "@/lib/logger";
import { toPng, toBlob } from "html-to-image";
import type { UserSummary, CardLayout } from "@/lib/types";
import type { CardDisplayOptions } from "@/lib/cardSettings";

// Mock dependencies
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
  let mockSummary: UserSummary;
  let mockLayout: CardLayout;
  let mockDisplayOptions: CardDisplayOptions;
  let originalClipboard: Clipboard | undefined;
  let originalFonts: Document['fonts'];
  let originalRAF: typeof window.requestAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCardRef = {
      current: document.createElement("div"),
    };

    if (mockCardRef.current) mockCardRef.current.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 400,
    });

    mockSummary = {
      profile: { login: "testuser" } as unknown as UserSummary["profile"],
    } as UserSummary;

    mockLayout = { blocks: [] };
    mockDisplayOptions = {} as CardDisplayOptions;

    originalClipboard = navigator.clipboard;

    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn(),
      },
      configurable: true,
    });

    // @ts-expect-error global mock
    global.ClipboardItem = vi.fn().mockImplementation(function(this: ClipboardItem, data: Record<string, Blob>) {
      Object.assign(this, data);
    });

    originalFonts = document.fonts;
    Object.defineProperty(document, "fonts", {
      value: {
        ready: Promise.resolve(),
      },
      configurable: true,
    });

    // Mock RAF to execute immediately
    originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
        cb();
        return 1;
    });

  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalClipboard === undefined) {
      // @ts-expect-error test cleanup
      delete navigator.clipboard;
    } else {
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
    }

    Object.defineProperty(document, "fonts", {
      value: originalFonts,
      configurable: true,
    });

    window.requestAnimationFrame = originalRAF;

    // @ts-expect-error global cleanup
    delete global.ClipboardItem;

    vi.restoreAllMocks();
  });

  it("returns initial state when not open", () => {
    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
    expect(result.current.copyStatus).toBe("idle");
    expect(toPng).not.toHaveBeenCalled();
  });

  it("generates image when isOpen changes to true", async () => {
    vi.mocked(toPng).mockResolvedValue("data:image/png;base64,mockdata");

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useCardPreview(isOpen, mockCardRef, mockSummary, mockLayout, mockDisplayOptions),
      { initialProps: { isOpen: false } }
    );

    rerender({ isOpen: true });

    await waitFor(() => {
      expect(result.current.previewUrl).toBe("data:image/png;base64,mockdata");
    });

    expect(toPng).toHaveBeenCalledWith(mockCardRef.current, expect.any(Object));
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewSize).toEqual({ width: 800, height: 400 });
  });

  it("handles generateImage failure", async () => {
    const error = new Error("toPng failed");
    vi.mocked(toPng).mockRejectedValue(error);

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useCardPreview(isOpen, mockCardRef, mockSummary, mockLayout, mockDisplayOptions),
      { initialProps: { isOpen: false } }
    );

    rerender({ isOpen: true });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to generate image", error);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
  });

  it("resets preview when layout or displayOptions change", async () => {
    vi.mocked(toPng).mockResolvedValue("data:image/png;base64,mockdata");

    const { result, rerender } = renderHook(
      ({ layout, options }) =>
        useCardPreview(true, mockCardRef, mockSummary, layout, options),
      { initialProps: { layout: mockLayout, options: mockDisplayOptions } }
    );

    await waitFor(() => {
      expect(result.current.previewUrl).toBe("data:image/png;base64,mockdata");
    });

    // Change layout
    const newLayout = { blocks: [{ id: "stats", visible: true }] } as CardLayout;

    rerender({ layout: newLayout, options: mockDisplayOptions });

    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();

    await waitFor(() => {
      expect(toPng).toHaveBeenCalledTimes(2);
      expect(result.current.previewUrl).toBe("data:image/png;base64,mockdata");
    });
  });

  it("handles download", async () => {
    vi.mocked(toPng).mockResolvedValue("data:image/png;base64,mockdata");

    const { result } = renderHook(() =>
      useCardPreview(true, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    await waitFor(() => {
      expect(result.current.previewUrl).toBe("data:image/png;base64,mockdata");
    });

    const createElementSpy = vi.spyOn(document, "createElement");
    const mockLink = {
      download: "",
      href: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    createElementSpy.mockReturnValue(mockLink);

    act(() => {
      result.current.handleDownload();
    });

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.download).toBe("testuser-summary-card.png");
    expect(mockLink.href).toBe("data:image/png;base64,mockdata");
    expect(mockLink.click).toHaveBeenCalled();
  });

  it("does nothing in handleDownload if previewUrl is null", () => {
      const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    const createElementSpy = vi.spyOn(document, "createElement");

    act(() => {
        result.current.handleDownload();
    });

    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it("handles copy success", async () => {
    vi.useFakeTimers();
    const mockBlob = new Blob(["mock-image-data"], { type: "image/png" });
    vi.mocked(toBlob).mockResolvedValue(mockBlob);
    vi.mocked(navigator.clipboard.write).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(toBlob).toHaveBeenCalledWith(mockCardRef.current, expect.any(Object));
    expect(global.ClipboardItem).toHaveBeenCalledWith({ "image/png": mockBlob });
    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(result.current.copyStatus).toBe("copied");

    // Advance timers to reset copyStatus
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copyStatus).toBe("idle");
    vi.useRealTimers();
  });

  it("handles copy failure from toBlob", async () => {
    const error = new Error("toBlob failed");
    vi.mocked(toBlob).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to copy", error);
    expect(result.current.copyStatus).toBe("error");
  });

  it("handles copy failure if toBlob returns null", async () => {
      vi.mocked(toBlob).mockResolvedValue(null);

      const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    await act(async () => {
        await result.current.handleCopy();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to copy", expect.any(Error));
    expect(result.current.copyStatus).toBe("error");
  });

  it("handles copy failure from clipboard", async () => {
    const mockBlob = new Blob(["mock-image-data"], { type: "image/png" });
    vi.mocked(toBlob).mockResolvedValue(mockBlob);
    const clipboardError = new Error("clipboard write failed");
    vi.mocked(navigator.clipboard.write).mockRejectedValue(clipboardError);

    const { result } = renderHook(() =>
      useCardPreview(false, mockCardRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to copy", clipboardError);
    expect(result.current.copyStatus).toBe("error");
  });

  it("does nothing in handleCopy if cardRef is null", async () => {
      const nullRef = { current: null };
      const { result } = renderHook(() =>
      useCardPreview(false, nullRef, mockSummary, mockLayout, mockDisplayOptions)
    );

    await act(async () => {
        await result.current.handleCopy();
    });

    expect(toBlob).not.toHaveBeenCalled();
    expect(result.current.copyStatus).toBe("idle");
  });

  it("handles fonts ready failure in generate effect", async () => {
    // Suppress unhandled rejection warning by catching it
    const fontsReadyPromise = Promise.reject(new Error("Fonts loading failed"));
    fontsReadyPromise.catch(() => {});

    Object.defineProperty(document, "fonts", {
      value: {
        ready: fontsReadyPromise,
      },
      configurable: true,
    });

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useCardPreview(isOpen, mockCardRef, mockSummary, mockLayout, mockDisplayOptions),
      { initialProps: { isOpen: false } }
    );

    rerender({ isOpen: true });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.previewUrl).toBeNull();
    expect(result.current.previewSize).toBeNull();
  });

  it("handles generateImage failure due to target error", async () => {
    // Override the mock block to return null or throw earlier if possible, but testing the catch block of generateImage
    const error = new Error("Mock Error");
    vi.mocked(toPng).mockRejectedValueOnce(error);

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useCardPreview(isOpen, mockCardRef, mockSummary, mockLayout, mockDisplayOptions),
      { initialProps: { isOpen: false } }
    );

    rerender({ isOpen: true });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to generate image", error);
    expect(result.current.previewUrl).toBeNull();
  });
});