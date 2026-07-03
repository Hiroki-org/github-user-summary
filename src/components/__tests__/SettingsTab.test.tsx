import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsTab } from "../SettingsTab";
import { MAIN_BLOCKS, DETAIL_OPTIONS } from "@/lib/cardGeneratorConstants";

describe("SettingsTab", () => {
  const mockIsBlockVisible = vi.fn();
  const mockToggleMainBlockVisibility = vi.fn();
  const mockToggleDisplayOption = vi.fn();

  const defaultProps = {
    isBlockVisible: mockIsBlockVisible,
    toggleMainBlockVisibility: mockToggleMainBlockVisibility,
    displayOptions: {
      showAvatar: true,
      showBio: false,
    },
    toggleDisplayOption: mockToggleDisplayOption,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlockVisible.mockImplementation((id) => id === "profile"); // Example: only profile is visible
  });

  it("renders correctly with MAIN_BLOCKS and DETAIL_OPTIONS", () => {
    render(<SettingsTab {...defaultProps} />);

    // Check if all MAIN_BLOCKS are rendered
    MAIN_BLOCKS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    // Check if all DETAIL_OPTIONS are rendered
    DETAIL_OPTIONS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("correctly sets checked state for MAIN_BLOCKS based on isBlockVisible prop", () => {
    render(<SettingsTab {...defaultProps} />);

    MAIN_BLOCKS.forEach(({ id, label }) => {
      const checkbox = screen.getByLabelText(label) as HTMLInputElement;
      if (id === "profile") {
        expect(checkbox.checked).toBe(true);
      } else {
        expect(checkbox.checked).toBe(false);
      }
    });
  });

  it("correctly sets checked state for DETAIL_OPTIONS based on displayOptions prop", () => {
    render(<SettingsTab {...defaultProps} />);

    DETAIL_OPTIONS.forEach(({ key, label }) => {
      const checkbox = screen.getByLabelText(label) as HTMLInputElement;
      if (key === "showAvatar") {
        expect(checkbox.checked).toBe(true);
      } else if (key === "showBio") {
        expect(checkbox.checked).toBe(false);
      } else {
        // Fallback for undefined options should be false (due to `displayOptions[key] ?? false` in component)
        expect(checkbox.checked).toBe(false);
      }
    });
  });

  it("calls toggleMainBlockVisibility when a main block checkbox is clicked", () => {
    render(<SettingsTab {...defaultProps} />);

    const firstMainBlock = MAIN_BLOCKS[0];
    const checkbox = screen.getByLabelText(firstMainBlock.label);

    fireEvent.click(checkbox);
    expect(mockToggleMainBlockVisibility).toHaveBeenCalledWith(firstMainBlock.id);
  });

  it("calls toggleDisplayOption when a detail option checkbox is clicked", () => {
    render(<SettingsTab {...defaultProps} />);

    const firstDetailOption = DETAIL_OPTIONS[0];
    const checkbox = screen.getByLabelText(firstDetailOption.label);

    fireEvent.click(checkbox);
    expect(mockToggleDisplayOption).toHaveBeenCalledWith(firstDetailOption.key);
  });
});
