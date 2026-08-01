// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { logger } from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("useCopyToClipboard", () => {
  let originalClipboard: Clipboard | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    originalClipboard = navigator.clipboard;

    // Mock clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
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
    vi.restoreAllMocks();
  });

  it("should successfully copy using navigator.clipboard", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copied).toBe(false);

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test text");
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should log error if navigator.clipboard.writeText fails", async () => {
    const error = new Error("Clipboard error");
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(error);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("failed text");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("failed text");
    expect(result.current.copied).toBe(false);
    expect(logger.error).toHaveBeenCalledWith("Failed to copy", error);
  });

  it("should log error if navigator.clipboard is not available", async () => {
    // Remove clipboard
    // @ts-expect-error test setup
    delete navigator.clipboard;

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("failed text");
    });

    expect(result.current.copied).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error)
    );
  });

  it("should respect custom timeout", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCopyToClipboard(5000));

    await act(async () => {
      await result.current.copyToClipboard("timeout text");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("should clear timeout if called multiple times rapidly", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("text 1");
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.copyToClipboard("text 2");
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should clear timeout on unmount", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("unmount text");
    });

    expect(result.current.copied).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
