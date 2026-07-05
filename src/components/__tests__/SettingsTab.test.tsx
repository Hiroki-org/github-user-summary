// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { SettingsTab } from "../SettingsTab";
import { MAIN_BLOCKS, DETAIL_OPTIONS } from "@/lib/cardGeneratorConstants";
import type { CardDisplayOptions, CardBlockId } from "@/lib/types";

describe("SettingsTab", () => {
  const defaultProps = {
    isBlockVisible: vi.fn().mockReturnValue(false),
    toggleMainBlockVisibility: vi.fn(),
    displayOptions: {} as CardDisplayOptions,
    toggleDisplayOption: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.isBlockVisible.mockReturnValue(false);
  });

  it("renders all main blocks and detail options", () => {
    render(<SettingsTab {...defaultProps} />);

    MAIN_BLOCKS.forEach(({ label }) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });

    DETAIL_OPTIONS.forEach(({ label }) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("sets checked state correctly for main blocks", () => {
    const isBlockVisible = (id: CardBlockId): boolean => id === "profile";
    render(<SettingsTab {...defaultProps} isBlockVisible={isBlockVisible} />);

    const profileCheckbox = screen.getByLabelText("Profile") as HTMLInputElement;
    expect(profileCheckbox.checked).toBe(true);

    const heatmapCheckbox = screen.getByLabelText("Activity Heatmap") as HTMLInputElement;
    expect(heatmapCheckbox.checked).toBe(false);
  });

  it("sets checked state correctly for detail options", () => {
    const displayOptions: CardDisplayOptions = {
      showAvatar: true,
      showBio: false,
    };
    render(<SettingsTab {...defaultProps} displayOptions={displayOptions} />);

    const avatarCheckbox = screen.getByLabelText("Avatar") as HTMLInputElement;
    expect(avatarCheckbox.checked).toBe(true);

    const bioCheckbox = screen.getByLabelText("Bio") as HTMLInputElement;
    expect(bioCheckbox.checked).toBe(false);

    // Unspecified ones should be false
    const statsCheckbox = screen.getByLabelText("Stats") as HTMLInputElement;
    expect(statsCheckbox.checked).toBe(false);
  });

  it("calls toggleMainBlockVisibility when a main block checkbox is clicked", () => {
    const toggleMainBlockVisibility = vi.fn();
    render(<SettingsTab {...defaultProps} toggleMainBlockVisibility={toggleMainBlockVisibility} />);

    const profileCheckbox = screen.getByLabelText("Profile");
    fireEvent.click(profileCheckbox);

    expect(toggleMainBlockVisibility).toHaveBeenCalledWith("profile");
  });

  it("calls toggleDisplayOption when a detail option checkbox is clicked", () => {
    const toggleDisplayOption = vi.fn();
    render(<SettingsTab {...defaultProps} toggleDisplayOption={toggleDisplayOption} />);

    const avatarCheckbox = screen.getByLabelText("Avatar");
    fireEvent.click(avatarCheckbox);

    expect(toggleDisplayOption).toHaveBeenCalledWith("showAvatar");
  });
});
