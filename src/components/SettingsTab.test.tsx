// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsTab } from "./SettingsTab";
import { MAIN_BLOCKS, DETAIL_OPTIONS } from "@/lib/cardGeneratorConstants";
import type { CardDisplayOptions } from "@/lib/cardSettings";
import type { CardBlockId } from "@/lib/types";
import "@testing-library/jest-dom";

describe("SettingsTab", () => {
  const defaultDisplayOptions: CardDisplayOptions = {
    showAvatar: true,
    showBio: false,
    showStats: true,
    showLocation: false,
    showJoinedDate: true,
    showTopics: false,
    showLanguage: true,
  };

  const defaultIsBlockVisible = vi.fn((id: CardBlockId) => id === "profile" || id === "contributions");
  const toggleMainBlockVisibility = vi.fn();
  const toggleDisplayOption = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all main block labels", () => {
    render(
      <SettingsTab
        isBlockVisible={defaultIsBlockVisible}
        toggleMainBlockVisibility={toggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={toggleDisplayOption}
      />
    );

    MAIN_BLOCKS.forEach(({ label }) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("renders all detail options labels", () => {
    render(
      <SettingsTab
        isBlockVisible={defaultIsBlockVisible}
        toggleMainBlockVisibility={toggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={toggleDisplayOption}
      />
    );

    DETAIL_OPTIONS.forEach(({ label }) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("sets correct checked state for main blocks based on isBlockVisible prop", () => {
    render(
      <SettingsTab
        isBlockVisible={defaultIsBlockVisible}
        toggleMainBlockVisibility={toggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={toggleDisplayOption}
      />
    );

    const profileCheckbox = screen.getByLabelText("Profile") as HTMLInputElement;
    expect(profileCheckbox.checked).toBe(true);

    const heatmapCheckbox = screen.getByLabelText("Activity Heatmap") as HTMLInputElement;
    expect(heatmapCheckbox.checked).toBe(false);
  });

  it("sets correct checked state for detail options based on displayOptions prop", () => {
    const optionsWithUndefined = { ...defaultDisplayOptions, showJoinedDate: undefined };
    render(
      <SettingsTab
        isBlockVisible={defaultIsBlockVisible}
        toggleMainBlockVisibility={toggleMainBlockVisibility}
        displayOptions={optionsWithUndefined}
        toggleDisplayOption={toggleDisplayOption}
      />
    );

    const avatarCheckbox = screen.getByLabelText("Avatar") as HTMLInputElement;
    expect(avatarCheckbox.checked).toBe(true);

    const bioCheckbox = screen.getByLabelText("Bio") as HTMLInputElement;
    expect(bioCheckbox.checked).toBe(false);

    const joinedDateCheckbox = screen.getByLabelText("Joined Date") as HTMLInputElement;
    expect(joinedDateCheckbox.checked).toBe(false); // Covers the ?? false fallback
  });

  it("calls toggleMainBlockVisibility when a main block checkbox is toggled", async () => {
    const user = userEvent.setup();
    render(
      <SettingsTab
        isBlockVisible={defaultIsBlockVisible}
        toggleMainBlockVisibility={toggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={toggleDisplayOption}
      />
    );

    const profileCheckbox = screen.getByLabelText("Profile");
    await user.click(profileCheckbox);
    expect(toggleMainBlockVisibility).toHaveBeenCalledWith("profile");
    expect(toggleMainBlockVisibility).toHaveBeenCalledTimes(1);
  });

  it("calls toggleDisplayOption when a detail option checkbox is toggled", async () => {
    const user = userEvent.setup();
    render(
      <SettingsTab
        isBlockVisible={defaultIsBlockVisible}
        toggleMainBlockVisibility={toggleMainBlockVisibility}
        displayOptions={defaultDisplayOptions}
        toggleDisplayOption={toggleDisplayOption}
      />
    );

    const avatarCheckbox = screen.getByLabelText("Avatar");
    await user.click(avatarCheckbox);
    expect(toggleDisplayOption).toHaveBeenCalledWith("showAvatar");
    expect(toggleDisplayOption).toHaveBeenCalledTimes(1);
  });
});
