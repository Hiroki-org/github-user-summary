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
  let originalLocation: Location;
  const mockCopyToClipboard = vi.fn();

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost", href: "http://localhost/johndoe" },
      writable: true,
    });

    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: false,
      copyToClipboard: mockCopyToClipboard,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.clearAllMocks();
  });

  it("calls copyToClipboard with the correct URL when copy button is clicked", () => {
    render(<ShareButtons username="johndoe" />);
    const copyButton = screen.getByRole("button", { name: "Copy profile URL" });
    fireEvent.click(copyButton);
    expect(mockCopyToClipboard).toHaveBeenCalledWith("http://localhost/johndoe");
  });

  it("renders 'Copy URL' initially", () => {
    render(<ShareButtons username="johndoe" />);
    expect(screen.getByText("Copy URL")).toBeDefined();
  });

  it("renders 'Copied!' when copied is true", () => {
    vi.mocked(useCopyToClipboard).mockReturnValue({
      copied: true,
      copyToClipboard: mockCopyToClipboard,
    });
    render(<ShareButtons username="johndoe" />);
    expect(screen.getByText("Copied!")).toBeDefined();
  });

  it("opens Twitter share URL when Share button is clicked", () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ShareButtons username="johndoe" />);

    const shareButton = screen.getByRole("button", { name: "Share on X" });
    fireEvent.click(shareButton);

    const expectedText = encodeURIComponent("Check out johndoe's GitHub profile summary!");
    const expectedUrl = encodeURIComponent("http://localhost/johndoe");
    expect(windowOpenSpy).toHaveBeenCalledWith(
      `https://x.com/intent/tweet?text=${expectedText}&url=${expectedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );

    windowOpenSpy.mockRestore();
  });
});
