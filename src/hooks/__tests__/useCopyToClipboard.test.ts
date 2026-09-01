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
  let originalExecCommand: typeof document.execCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    originalClipboard = navigator.clipboard;
    originalExecCommand = document.execCommand;

    // Mock clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
    });

    // Mock document.execCommand
    document.execCommand = vi.fn();
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
    document.execCommand = originalExecCommand;
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
    expect(document.execCommand).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should use fallback if navigator.clipboard is not available", async () => {
    // Remove clipboard
    // @ts-expect-error test setup
    delete navigator.clipboard;
    vi.mocked(document.execCommand).mockReturnValue(true);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("fallback text");
    });

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should use fallback if navigator.clipboard.writeText fails", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("Clipboard error"));
    vi.mocked(document.execCommand).mockReturnValue(true);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("fallback text");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("fallback text");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should log error if both clipboard and fallback fail", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("Clipboard error"));
    vi.mocked(document.execCommand).mockReturnValue(false);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("failed text");
    });

    expect(result.current.copied).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error),
      expect.any(Error)
    );
  });


  it("should log error if both clipboard.writeText and fallback throw errors", async () => {
    const writeError = new Error("Clipboard write error");
    const execError = new Error("execCommand thrown error");

    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(writeError);
    vi.mocked(document.execCommand).mockImplementation(() => {
      throw execError;
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("failed text");
    });

    expect(result.current.copied).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      writeError,
      execError
    );
  });

  it("should log error if fallback throws an error", async () => {
    // @ts-expect-error test setup
    delete navigator.clipboard;
    vi.mocked(document.execCommand).mockImplementation(() => {
      throw new Error("execCommand thrown error");
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("failed text");
    });

    expect(result.current.copied).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error),
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

  it("should perform fallback copy with DOM manipulation and cleanup", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("Clipboard error"));
    vi.mocked(document.execCommand).mockReturnValue(true);

    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    const selectSpy = vi.spyOn(HTMLTextAreaElement.prototype, "select");

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("fallback text");
    });

    expect(createElementSpy).toHaveBeenCalledWith("textarea");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(removeChildSpy).toHaveBeenCalled();

    // Verify the appended child was the textarea we created
    const textarea = createElementSpy.mock.results.find(
      (result) => result.value instanceof HTMLTextAreaElement
    )?.value;
    expect(textarea).toBeDefined();
    expect(appendChildSpy).toHaveBeenCalledWith(textarea);
    expect(removeChildSpy).toHaveBeenCalledWith(textarea);
    expect(textarea.value).toBe("fallback text");

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    selectSpy.mockRestore();
  });
});
