import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionButtons } from "./ActionButtons";

describe("ActionButtons", () => {
  const mockHandleCopy = vi.fn();
  const mockHandleDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both buttons", () => {
    render(
      <ActionButtons
        handleCopy={mockHandleCopy}
        handleDownload={mockHandleDownload}
        previewUrl="https://example.com/image.png"
        copyStatus="idle"
      />
    );

    expect(screen.getByRole("button", { name: /copy image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download png/i })).toBeInTheDocument();
  });

  it("disables buttons when previewUrl is null", () => {
    render(
      <ActionButtons
        handleCopy={mockHandleCopy}
        handleDownload={mockHandleDownload}
        previewUrl={null}
        copyStatus="idle"
      />
    );

    const copyButton = screen.getByRole("button", { name: /copy image/i });
    const downloadButton = screen.getByRole("button", { name: /download png/i });

    expect(copyButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
  });

  it("enables buttons when previewUrl is provided", () => {
    render(
      <ActionButtons
        handleCopy={mockHandleCopy}
        handleDownload={mockHandleDownload}
        previewUrl="https://example.com/image.png"
        copyStatus="idle"
      />
    );

    const copyButton = screen.getByRole("button", { name: /copy image/i });
    const downloadButton = screen.getByRole("button", { name: /download png/i });

    expect(copyButton).not.toBeDisabled();
    expect(downloadButton).not.toBeDisabled();
  });

  it("calls handleCopy when copy button is clicked", () => {
    render(
      <ActionButtons
        handleCopy={mockHandleCopy}
        handleDownload={mockHandleDownload}
        previewUrl="https://example.com/image.png"
        copyStatus="idle"
      />
    );

    const copyButton = screen.getByRole("button", { name: /copy image/i });
    fireEvent.click(copyButton);

    expect(mockHandleCopy).toHaveBeenCalledTimes(1);
  });

  it("calls handleDownload when download button is clicked", () => {
    render(
      <ActionButtons
        handleCopy={mockHandleCopy}
        handleDownload={mockHandleDownload}
        previewUrl="https://example.com/image.png"
        copyStatus="idle"
      />
    );

    const downloadButton = screen.getByRole("button", { name: /download png/i });
    fireEvent.click(downloadButton);

    expect(mockHandleDownload).toHaveBeenCalledTimes(1);
  });

  it("shows 'Copied!' text and icon when copyStatus is 'copied'", () => {
    render(
      <ActionButtons
        handleCopy={mockHandleCopy}
        handleDownload={mockHandleDownload}
        previewUrl="https://example.com/image.png"
        copyStatus="copied"
      />
    );

    expect(screen.getByRole("button", { name: /copied!/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy image/i })).not.toBeInTheDocument();
  });
});
