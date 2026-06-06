import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsTab } from "../SettingsTab";
import { MAIN_BLOCKS, DETAIL_OPTIONS } from "@/lib/cardGeneratorConstants";

describe("SettingsTab", () => {
  const mockIsBlockVisible = vi.fn();
  const mockToggleMainBlockVisibility = vi.fn();
  const mockToggleDisplayOption = vi.fn();

  const mockDisplayOptions = {
    showAvatar: true,
    showBio: false,
    showStats: true,
    showLocation: false,
    showJoinedDate: true,
    showTopics: false,
    showLanguage: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlockVisible.mockImplementation((id) => id === "profile" || id === "heatmap");
  });

  it("renders all MAIN_BLOCKS", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={mockDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    for (const block of MAIN_BLOCKS) {
      expect(screen.getByLabelText(block.label)).toBeInTheDocument();
    }
  });

  it("renders all DETAIL_OPTIONS", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={mockDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    for (const option of DETAIL_OPTIONS) {
      expect(screen.getByLabelText(option.label)).toBeInTheDocument();
    }
  });

  it("calls toggleMainBlockVisibility when a main block checkbox is clicked", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={mockDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    const profileCheckbox = screen.getByLabelText("Profile");
    fireEvent.click(profileCheckbox);
    expect(mockToggleMainBlockVisibility).toHaveBeenCalledWith("profile");

    const contributionsCheckbox = screen.getByLabelText("Contributions");
    fireEvent.click(contributionsCheckbox);
    expect(mockToggleMainBlockVisibility).toHaveBeenCalledWith("contributions");
  });

  it("calls toggleDisplayOption when a detail option checkbox is clicked", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={mockDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    const avatarCheckbox = screen.getByLabelText("Avatar");
    fireEvent.click(avatarCheckbox);
    expect(mockToggleDisplayOption).toHaveBeenCalledWith("showAvatar");

    const bioCheckbox = screen.getByLabelText("Bio");
    fireEvent.click(bioCheckbox);
    expect(mockToggleDisplayOption).toHaveBeenCalledWith("showBio");
  });

  it("sets checked state correctly for main blocks based on isBlockVisible", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={mockDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    expect(screen.getByLabelText("Profile")).toBeChecked();
    expect(screen.getByLabelText("Activity Heatmap")).toBeChecked();
    expect(screen.getByLabelText("Contributions")).not.toBeChecked();
  });

  it("sets checked state correctly for detail options based on displayOptions", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={mockDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    expect(screen.getByLabelText("Avatar")).toBeChecked();
    expect(screen.getByLabelText("Stats")).toBeChecked();
    expect(screen.getByLabelText("Joined Date")).toBeChecked();
    expect(screen.getByLabelText("Languages")).toBeChecked();

    expect(screen.getByLabelText("Bio")).not.toBeChecked();
    expect(screen.getByLabelText("Location")).not.toBeChecked();
    expect(screen.getByLabelText("Topics")).not.toBeChecked();
  });
});
