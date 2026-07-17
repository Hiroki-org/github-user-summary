import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCardSettings } from "../useCardSettings";
import * as cardSettingsLib from "@/lib/cardSettings";
import * as cardLayoutLib from "@/lib/cardLayout";
import { DEFAULT_CARD_LAYOUT } from "@/lib/types";
import type { CardLayout } from "@/lib/types";

// Mock the external dependencies
vi.mock("@/lib/cardSettings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cardSettings")>();
  return {
    ...actual,
    loadCardSettings: vi.fn(),
    saveCardSettings: vi.fn(),
  };
});

vi.mock("@/lib/cardLayout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cardLayout")>();
  return {
    ...actual,
    toggleBlockVisibility: vi.fn(),
  };
});

describe("useCardSettings", () => {
  const mockDefaultOptions = {
    showAvatar: true,
    showBio: true,
    showStats: true,
    showLanguage: true,
    showRepos: true,
    showCompany: true,
    showLocation: true,
    showWebsite: true,
    showTwitter: true,
    showJoinedDate: true,
    showTopics: true,
    showContributionBreakdown: true,
    showStreaks: true,
    showInterests: true,
    showActivityBreakdown: true,
  };

  const mockLoadedSettings = {
    layout: {
      ...DEFAULT_CARD_LAYOUT,
      blocks: [
        { id: "profile", visible: true, column: "full" },
        { id: "stats", visible: false, column: "left" },
      ]
    } as CardLayout,
    options: {
      ...mockDefaultOptions,
      showAvatar: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cardSettingsLib.loadCardSettings).mockReturnValue(mockLoadedSettings);
    vi.mocked(cardLayoutLib.toggleBlockVisibility).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prev: any, id: any) => ({ ...prev, toggled: id }) as any
    );
  });

  it("should initialize with values from loadCardSettings", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(mockLoadedSettings.layout);
    expect(result.current.displayOptions).toEqual(mockLoadedSettings.options);
    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(2);
  });

  it("should not hydrate or save if not mounted", () => {
    renderHook(() => useCardSettings(false));

    // It's called once during state initialization, but the effect shouldn't re-call it or save
    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(2);
    expect(cardSettingsLib.saveCardSettings).not.toHaveBeenCalled();
  });

  it("should hydrate and update state when mounted changes to true", () => {
    const { result, rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: false },
    });

    // Reset mock count to ignore initialization
    vi.clearAllMocks();

    rerender({ mounted: true });

    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(1);
    expect(result.current.layout).toEqual(mockLoadedSettings.layout);
    expect(result.current.displayOptions).toEqual(mockLoadedSettings.options);
  });

  it("should save settings when layout or options change (if hydrated)", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    // Once for initial hydration, once for the change
    expect(cardSettingsLib.saveCardSettings).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ showAvatar: true })
    );
  });

  it("toggleMainBlockVisibility should update layout using toggleBlockVisibility", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      result.current.toggleMainBlockVisibility("stats");
    });

    expect(cardLayoutLib.toggleBlockVisibility).toHaveBeenCalledWith(
      mockLoadedSettings.layout,
      "stats"
    );
    expect(result.current.layout).toHaveProperty("toggled", "stats");
  });

  it("toggleDisplayOption should flip boolean values in displayOptions", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.displayOptions.showBio).toBe(true);

    act(() => {
      result.current.toggleDisplayOption("showBio");
    });

    expect(result.current.displayOptions.showBio).toBe(false);
  });

  it("isBlockVisible should return true if block is visible, false otherwise", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);
    expect(result.current.isBlockVisible("stats")).toBe(false);
    expect(result.current.isBlockVisible("non-existent-block" as import("@/lib/types").CardBlockId)).toBe(false);
  });
});
