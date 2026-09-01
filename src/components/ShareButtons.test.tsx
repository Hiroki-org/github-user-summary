/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ShareButtons from "./ShareButtons";
import { logger } from "@/lib/logger";

describe("ShareButtons", () => {
  let originalClipboard: Navigator["clipboard"] | undefined;
  let originalLocation: Location;

  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    originalClipboard = navigator.clipboard;
    originalLocation = window.location;

    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost", href: "http://localhost/johndoe" },
      writable: true,
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.assign(navigator, { clipboard: originalClipboard });

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("uses navigator.clipboard.writeText when available and successful", async () => {
    // Mock clipboard.writeText to succeed
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("http://localhost/johndoe");
    });

    // Clear out React's state updates
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
  });

  it("shows 'Copied!' feedback after copying", async () => {
    // Mock clipboard.writeText to succeed
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    // Check if the button text changes
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeDefined();
    });

    // Fast forward time
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    // Check if the button text changes back
    await waitFor(() => {
      expect(screen.getByText("Copy URL")).toBeDefined();
    });
  });

  it("logs an error and does not show 'Copied!' feedback when copy fails", async () => {
    // 1. Mock clipboard.writeText to reject
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Clipboard API failed"));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("http://localhost/johndoe");
    });

    // Verify logger.error was called
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error) // error from clipboard.writeText
    );

    // Verify button text remains unchanged
    expect(screen.getByText("Copy URL")).toBeDefined();
    expect(screen.queryByText("Copied!")).toBeNull();
  });


  const setupUndefinedClipboard = () => {
    const origClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    return () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: origClipboard,
        configurable: true,
      });
    };
  };

  it("logs an error and does not show 'Copied!' feedback when clipboard is undefined", async () => {
    const restoreClipboard = setupUndefinedClipboard();

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to copy",
        expect.any(Error)
      );
    });

    restoreClipboard();
  });

});
