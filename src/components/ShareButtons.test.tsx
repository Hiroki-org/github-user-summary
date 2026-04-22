/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ShareButtons from "./ShareButtons";
import { logger } from "@/lib/logger";

describe("ShareButtons", () => {
  let originalClipboard: Navigator["clipboard"] | undefined;
  let originalExecCommand: (commandId: string, showUI?: boolean, value?: string) => boolean;
  let originalLocation: Location;

  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    originalClipboard = navigator.clipboard;
    originalExecCommand = document.execCommand;
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
    document.execCommand = originalExecCommand;

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("uses document.execCommand as fallback when navigator.clipboard.writeText fails", async () => {
    // 1. Mock clipboard.writeText to reject
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Not allowed"));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // 2. Mock execCommand
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    // 3. Spy on document.createElement, document.body.appendChild, and document.body.removeChild
    // to verify the full fallback flow
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("http://localhost/johndoe");
    });

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith("textarea");

      // Find the appendChild call that appends the textarea (since React might also call appendChild)
      const textareaAppendCall = appendChildSpy.mock.calls.find(
        (call) => (call[0] as HTMLElement).tagName === "TEXTAREA"
      );

      expect(textareaAppendCall).toBeDefined();
      if (textareaAppendCall) {
        const appendedNode = textareaAppendCall[0] as HTMLTextAreaElement;
        expect(appendedNode.value).toBe("http://localhost/johndoe");

        expect(execCommandMock).toHaveBeenCalledWith("copy");

        // Verify removeChild was called with the same element
        expect(removeChildSpy).toHaveBeenCalledWith(appendedNode);
      }
    });

    // Clear out React's state updates
    await act(async () => {
      vi.advanceTimersByTime(2500);
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

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("http://localhost/johndoe");
    });

    // Fallback should not be triggered
    expect(execCommandMock).not.toHaveBeenCalled();

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

  it("logs an error and does not show 'Copied!' feedback when both copy methods fail", async () => {
    // 1. Mock clipboard.writeText to reject
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Clipboard API failed"));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // 2. Mock execCommand to return false (failure)
    const execCommandMock = vi.fn().mockReturnValue(false);
    document.execCommand = execCommandMock;

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("http://localhost/johndoe");
    });

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    // Verify logger.error was called
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error), // error from clipboard.writeText
      expect.any(Error)  // error from execCommand fallback failing
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

  it("uses document.execCommand as fallback when navigator.clipboard is undefined", async () => {
    const restoreClipboard = setupUndefinedClipboard();

    // 2. Mock execCommand
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    // Check for success feedback
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeDefined();
    });

    // Clear out React's state updates
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    restoreClipboard();
  });

  it("logs an error and does not show 'Copied!' feedback when both copy methods fail and clipboard is undefined", async () => {
    const restoreClipboard = setupUndefinedClipboard();

    const execCommandMock = vi.fn().mockReturnValue(false);
    document.execCommand = execCommandMock;

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error),
      expect.any(Error)
    );

    restoreClipboard();
  });

  it("uses document.execCommand as fallback and catches its error", async () => {
    const restoreClipboard = setupUndefinedClipboard();

    const execCommandMock = vi.fn().mockImplementation(() => {
      throw new Error("execCommand crashed");
    });
    document.execCommand = execCommandMock;

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to copy",
      expect.any(Error), // clipboard API missing error
      expect.any(Error)  // execCommand crash error
    );

    restoreClipboard();
  });

});