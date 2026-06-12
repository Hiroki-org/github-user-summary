import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionButtons } from "../ActionButtons";

describe("ActionButtons", () => {
  const defaultProps = {
    handleCopy: vi.fn(),
    handleDownload: vi.fn(),
    previewUrl: "https://example.com/image.png",
    copyStatus: "idle" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both buttons", () => {
    render(<ActionButtons {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Copy Image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PNG/i })).toBeInTheDocument();
  });

  it("calls handleCopy when Copy Image button is clicked", () => {
    render(<ActionButtons {...defaultProps} />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    fireEvent.click(copyButton);

    expect(defaultProps.handleCopy).toHaveBeenCalledTimes(1);
  });

  it("calls handleDownload when Download PNG button is clicked", () => {
    render(<ActionButtons {...defaultProps} />);

    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });
    fireEvent.click(downloadButton);

    expect(defaultProps.handleDownload).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons when previewUrl is null", () => {
    render(<ActionButtons {...defaultProps} previewUrl={null} />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });

    expect(copyButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
  });

  it("shows 'Copied!' text when copyStatus is 'copied'", () => {
    render(<ActionButtons {...defaultProps} copyStatus="copied" />);

    expect(screen.getByRole("button", { name: /Copied!/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy Image/i })).not.toBeInTheDocument();
  });

  it("shows 'Copy Image' text when copyStatus is 'error'", () => {
    render(<ActionButtons {...defaultProps} copyStatus="error" />);

    expect(screen.getByRole("button", { name: /Copy Image/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copied!/i })).not.toBeInTheDocument();
  });
});
