/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ShareButtons from "./ShareButtons";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

// Mock the hook
vi.mock("@/hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: vi.fn(),
}));

describe("ShareButtons", () => {
  let originalLocation: Location;
  const mockCopyToClipboard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: false,
      copyToClipboard: mockCopyToClipboard,
    });

    // Mock window.location and window.open
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost", href: "http://localhost/johndoe" },
      writable: true,
    });

    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("calls copyToClipboard with correct URL when 'Copy URL' is clicked", () => {
    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });
    fireEvent.click(copyButton);

    expect(mockCopyToClipboard).toHaveBeenCalledWith("http://localhost/johndoe");
  });

  it("displays 'Copy URL' text when not copied", () => {
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: false,
      copyToClipboard: mockCopyToClipboard,
    });

    render(<ShareButtons username="johndoe" />);

    expect(screen.getByText("Copy URL")).toBeDefined();
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  it("displays 'Copied!' text when copied is true", () => {
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: true,
      copyToClipboard: mockCopyToClipboard,
    });

    render(<ShareButtons username="johndoe" />);

    expect(screen.getByText("Copied!")).toBeDefined();
    expect(screen.queryByText("Copy URL")).toBeNull();
  });

  it("calls window.open with correct Twitter URL when share button is clicked", () => {
    render(<ShareButtons username="johndoe" />);

    const shareButton = screen.getByRole("button", { name: "Share on X" });
    fireEvent.click(shareButton);

    const expectedText = encodeURIComponent("Check out johndoe's GitHub profile summary!");
    const expectedUrl = encodeURIComponent("http://localhost/johndoe");
    const expectedTwitterUrl = `https://x.com/intent/tweet?text=${expectedText}&url=${expectedUrl}`;

    expect(window.open).toHaveBeenCalledWith(expectedTwitterUrl, "_blank", "noopener,noreferrer");
  });
});
