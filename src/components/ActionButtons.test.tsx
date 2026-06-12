// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionButtons } from "./ActionButtons";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

describe("ActionButtons", () => {
  const defaultProps = {
    handleCopy: vi.fn(),
    handleDownload: vi.fn(),
    previewUrl: "https://example.com/preview.png",
    copyStatus: "idle" as const,
  };

  it("renders the Copy Image and Download PNG buttons", () => {
    render(<ActionButtons {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Copy Image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PNG/i })).toBeInTheDocument();
  });

  it("renders 'Copied!' text when copyStatus is 'copied'", () => {
    render(<ActionButtons {...defaultProps} copyStatus="copied" />);

    expect(screen.getByRole("button", { name: /Copied!/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy Image/i })).not.toBeInTheDocument();
  });

  it("disables both buttons when previewUrl is null", () => {
    render(<ActionButtons {...defaultProps} previewUrl={null} />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });

    expect(copyButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
  });

  it("enables both buttons when previewUrl is provided", () => {
    render(<ActionButtons {...defaultProps} previewUrl="https://example.com/image.png" />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });

    expect(copyButton).not.toBeDisabled();
    expect(downloadButton).not.toBeDisabled();
  });

  it("calls handleCopy when the copy button is clicked", async () => {
    const handleCopyMock = vi.fn();
    render(<ActionButtons {...defaultProps} handleCopy={handleCopyMock} />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    await userEvent.click(copyButton);

    expect(handleCopyMock).toHaveBeenCalledTimes(1);
  });

  it("calls handleDownload when the download button is clicked", async () => {
    const handleDownloadMock = vi.fn();
    render(<ActionButtons {...defaultProps} handleDownload={handleDownloadMock} />);

    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });
    await userEvent.click(downloadButton);

    expect(handleDownloadMock).toHaveBeenCalledTimes(1);
  });
});
