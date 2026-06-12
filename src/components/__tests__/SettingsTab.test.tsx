// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SettingsTab } from "../SettingsTab";
import { MAIN_BLOCKS, DETAIL_OPTIONS } from "@/lib/cardGeneratorConstants";
import type { CardDisplayOptions, CardBlockId } from "@/lib/types";
import "@testing-library/jest-dom";

describe("SettingsTab", () => {
  const mockIsBlockVisible = vi.fn();
  const mockToggleMainBlockVisibility = vi.fn();
  const mockToggleDisplayOption = vi.fn();

  const defaultProps = {
    isBlockVisible: mockIsBlockVisible,
    toggleMainBlockVisibility: mockToggleMainBlockVisibility,
    displayOptions: {} as CardDisplayOptions,
    toggleDisplayOption: mockToggleDisplayOption,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders all MAIN_BLOCKS checkboxes", () => {
    mockIsBlockVisible.mockReturnValue(false);
    render(<SettingsTab {...defaultProps} />);

    MAIN_BLOCKS.forEach(({ label }) => {
      const checkbox = screen.getByLabelText(label);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
      expect(checkbox).not.toBeChecked();
    });
  });

  it("renders all DETAIL_OPTIONS checkboxes", () => {
    render(<SettingsTab {...defaultProps} />);

    DETAIL_OPTIONS.forEach(({ label }) => {
      const checkbox = screen.getByLabelText(label);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
      expect(checkbox).not.toBeChecked();
    });
  });

  it("sets MAIN_BLOCKS checkbox checked state based on isBlockVisible prop", () => {
    // Mock that 'profile' and 'skills' are visible, others are not
    mockIsBlockVisible.mockImplementation((id: CardBlockId) => id === "profile" || id === "skills");

    render(<SettingsTab {...defaultProps} />);

    MAIN_BLOCKS.forEach(({ id, label }) => {
      const checkbox = screen.getByLabelText(label);
      if (id === "profile" || id === "skills") {
        expect(checkbox).toBeChecked();
      } else {
        expect(checkbox).not.toBeChecked();
      }
    });
  });

  it("sets DETAIL_OPTIONS checkbox checked state based on displayOptions prop", () => {
    const displayOptions: CardDisplayOptions = {
      showAvatar: true,
      showLocation: true,
      // Others are implicitly false or undefined
    };

    render(<SettingsTab {...defaultProps} displayOptions={displayOptions} />);

    DETAIL_OPTIONS.forEach(({ key, label }) => {
      const checkbox = screen.getByLabelText(label);
      if (key === "showAvatar" || key === "showLocation") {
        expect(checkbox).toBeChecked();
      } else {
        expect(checkbox).not.toBeChecked();
      }
    });
  });

  it("calls toggleMainBlockVisibility with correct id when MAIN_BLOCKS checkbox is clicked", () => {
    mockIsBlockVisible.mockReturnValue(false);
    render(<SettingsTab {...defaultProps} />);

    const firstMainBlock = MAIN_BLOCKS[0];
    const checkbox = screen.getByLabelText(firstMainBlock.label);

    fireEvent.click(checkbox);

    expect(mockToggleMainBlockVisibility).toHaveBeenCalledTimes(1);
    expect(mockToggleMainBlockVisibility).toHaveBeenCalledWith(firstMainBlock.id);
  });

  it("calls toggleDisplayOption with correct key when DETAIL_OPTIONS checkbox is clicked", () => {
    render(<SettingsTab {...defaultProps} />);

    const firstDetailOption = DETAIL_OPTIONS[0];
    const checkbox = screen.getByLabelText(firstDetailOption.label);

    fireEvent.click(checkbox);

    expect(mockToggleDisplayOption).toHaveBeenCalledTimes(1);
    expect(mockToggleDisplayOption).toHaveBeenCalledWith(firstDetailOption.key);
  });
});
