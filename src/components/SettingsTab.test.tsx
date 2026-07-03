/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsTab } from "./SettingsTab";
import { MAIN_BLOCKS, DETAIL_OPTIONS } from "@/lib/cardGeneratorConstants";
import type { CardDisplayOptions } from "@/lib/cardSettings";

describe("SettingsTab", () => {
  const mockIsBlockVisible = vi.fn();
  const mockToggleMainBlockVisibility = vi.fn();
  const mockToggleDisplayOption = vi.fn();

  const defaultDisplayOptions: CardDisplayOptions = {
    showAvatar: true,
    showBio: false,
    showStats: true,
    showLanguage: false,
    showRepos: true,
    showCompany: false,
    showLocation: true,
    showWebsite: false,
    showTwitter: true,
    showJoinedDate: false,
    showTopics: true,
    showContributionBreakdown: false,
    showStreaks: true,
    showInterests: false,
    showActivityBreakdown: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all MAIN_BLOCKS and DETAIL_OPTIONS", () => {
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    MAIN_BLOCKS.forEach((block) => {
      expect(screen.getByLabelText(block.label)).toBeDefined();
    });

    DETAIL_OPTIONS.forEach((option) => {
      expect(screen.getByLabelText(option.label)).toBeDefined();
    });
  });

  it("reflects checked state for blocks and options correctly", () => {
    // Let's set some specific mocks to test truthy vs falsy returns
    mockIsBlockVisible.mockImplementation((id) => id === "profile" || id === "heatmap");

    const customDisplayOptions = {
      ...defaultDisplayOptions,
      showAvatar: true, // Should be checked
      showBio: false,   // Should not be checked
    };

    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={customDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    const profileBlock = screen.getByLabelText(
      MAIN_BLOCKS.find((b) => b.id === "profile")!.label
    ) as HTMLInputElement;
    expect(profileBlock.checked).toBe(true);

    const contributionsBlock = screen.getByLabelText(
      MAIN_BLOCKS.find((b) => b.id === "contributions")!.label
    ) as HTMLInputElement;
    expect(contributionsBlock.checked).toBe(false);

    const avatarOption = screen.getByLabelText(
      DETAIL_OPTIONS.find((o) => o.key === "showAvatar")!.label
    ) as HTMLInputElement;
    expect(avatarOption.checked).toBe(true);

    const bioOption = screen.getByLabelText(
      DETAIL_OPTIONS.find((o) => o.key === "showBio")!.label
    ) as HTMLInputElement;
    expect(bioOption.checked).toBe(false);
  });

  it("calls toggleMainBlockVisibility when a main block checkbox is clicked", () => {
    mockIsBlockVisible.mockReturnValue(false);
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    const profileBlock = screen.getByLabelText(
      MAIN_BLOCKS.find((b) => b.id === "profile")!.label
    );

    fireEvent.click(profileBlock);

    expect(mockToggleMainBlockVisibility).toHaveBeenCalledWith("profile");
    expect(mockToggleMainBlockVisibility).toHaveBeenCalledTimes(1);
  });

  it("calls toggleDisplayOption when a detail option checkbox is clicked", () => {
    mockIsBlockVisible.mockReturnValue(false);
    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    const avatarOption = screen.getByLabelText(
      DETAIL_OPTIONS.find((o) => o.key === "showAvatar")!.label
    );

    fireEvent.click(avatarOption);

    expect(mockToggleDisplayOption).toHaveBeenCalledWith("showAvatar");
    expect(mockToggleDisplayOption).toHaveBeenCalledTimes(1);
  });

  it("defaults missing displayOptions to false", () => {
    const optionsWithMissingKeys = {
      showAvatar: true, // Only this is present
    } as CardDisplayOptions;

    render(
      <SettingsTab
        isBlockVisible={mockIsBlockVisible}
        toggleMainBlockVisibility={mockToggleMainBlockVisibility}
        displayOptions={optionsWithMissingKeys}
        toggleDisplayOption={mockToggleDisplayOption}
      />
    );

    const avatarOption = screen.getByLabelText(
      DETAIL_OPTIONS.find((o) => o.key === "showAvatar")!.label
    ) as HTMLInputElement;
    expect(avatarOption.checked).toBe(true);

    const bioOption = screen.getByLabelText(
      DETAIL_OPTIONS.find((o) => o.key === "showBio")!.label
    ) as HTMLInputElement;
    expect(bioOption.checked).toBe(false); // Defaulted to false because it's missing in the provided object
  });
});
