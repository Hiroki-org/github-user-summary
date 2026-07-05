import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { ActionButtons } from "@/components/ActionButtons";

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

  it("renders the Copy and Download buttons", () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Copy Image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PNG/i })).toBeInTheDocument();
  });

  it("calls handleCopy when the Copy button is clicked", async () => {
    const user = userEvent.setup();
    const handleCopy = vi.fn();
    render(<ActionButtons {...defaultProps} handleCopy={handleCopy} />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    await user.click(copyButton);

    expect(handleCopy).toHaveBeenCalledTimes(1);
  });

  it("calls handleDownload when the Download button is clicked", async () => {
    const user = userEvent.setup();
    const handleDownload = vi.fn();
    render(<ActionButtons {...defaultProps} handleDownload={handleDownload} />);

    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });
    await user.click(downloadButton);

    expect(handleDownload).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons when previewUrl is null", () => {
    render(<ActionButtons {...defaultProps} previewUrl={null} />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });

    expect(copyButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
  });

  it("does not call handlers when disabled buttons are clicked", async () => {
    const user = userEvent.setup();
    const handleCopy = vi.fn();
    const handleDownload = vi.fn();
    render(
      <ActionButtons
        {...defaultProps}
        handleCopy={handleCopy}
        handleDownload={handleDownload}
        previewUrl={null}
      />
    );

    await user.click(screen.getByRole("button", { name: /Copy Image/i }));
    await user.click(screen.getByRole("button", { name: /Download PNG/i }));

    expect(handleCopy).not.toHaveBeenCalled();
    expect(handleDownload).not.toHaveBeenCalled();
  });

  it("enables both buttons when previewUrl is a valid string", () => {
    render(<ActionButtons {...defaultProps} previewUrl="https://example.com/image.png" />);

    const copyButton = screen.getByRole("button", { name: /Copy Image/i });
    const downloadButton = screen.getByRole("button", { name: /Download PNG/i });

    expect(copyButton).not.toBeDisabled();
    expect(downloadButton).not.toBeDisabled();
  });

  it("displays 'Copied!' when copyStatus is 'copied'", () => {
    render(<ActionButtons {...defaultProps} copyStatus="copied" />);

    expect(screen.getByRole("button", { name: /Copied!/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy Image/i })).not.toBeInTheDocument();
  });

  it("displays 'Copy Image' when copyStatus is 'error'", () => {
    render(<ActionButtons {...defaultProps} copyStatus="error" />);

    expect(screen.getByRole("button", { name: /Copy Image/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copied!/i })).not.toBeInTheDocument();
  });
});
