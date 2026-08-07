/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ShareButtons from "./ShareButtons";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

vi.mock("@/hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: vi.fn(),
}));

describe("ShareButtons", () => {
  let originalWindowOpen: typeof window.open;
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.open
    originalWindowOpen = window.open;
    window.open = vi.fn();

    // Mock window.location
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost", href: "http://localhost/johndoe" },
      writable: true,
    });
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("renders share buttons", () => {
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: false,
      copyToClipboard: vi.fn(),
    });

    render(<ShareButtons username="johndoe" />);

    expect(screen.getByRole("button", { name: "Share on X" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Copy profile URL" })).toBeDefined();
    expect(screen.getByText("Copy URL")).toBeDefined();
  });

  it("calls copyToClipboard with correct URL when copy button is clicked", () => {
    const copyToClipboardMock = vi.fn();
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: false,
      copyToClipboard: copyToClipboardMock,
    });

    render(<ShareButtons username="johndoe" />);

    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });
    fireEvent.click(copyButton);

    expect(copyToClipboardMock).toHaveBeenCalledWith("http://localhost/johndoe");
  });

  it("shows 'Copied!' feedback when copied is true", () => {
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: true,
      copyToClipboard: vi.fn(),
    });

    render(<ShareButtons username="johndoe" />);

    expect(screen.getByText("Copied!")).toBeDefined();
  });

  it("opens Twitter share URL when share button is clicked", () => {
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: false,
      copyToClipboard: vi.fn(),
    });

    render(<ShareButtons username="johndoe" />);

    const shareButton = screen.getByRole("button", { name: "Share on X" });
    fireEvent.click(shareButton);

    const expectedText = "Check out johndoe's GitHub profile summary!";
    const expectedUrl = "http://localhost/johndoe";
    const expectedTwitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(expectedText)}&url=${encodeURIComponent(expectedUrl)}`;

    expect(window.open).toHaveBeenCalledWith(expectedTwitterUrl, "_blank", "noopener,noreferrer");
  });
});
