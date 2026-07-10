// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardSettings } from "../useCardSettings";
import { DEFAULT_CARD_LAYOUT } from "@/lib/types";
import { DEFAULT_DISPLAY_OPTIONS } from "@/lib/cardSettings";
import * as cardSettingsLib from "@/lib/cardSettings";

describe("useCardSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should initialize with default settings when localStorage is empty", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(DEFAULT_CARD_LAYOUT);
    expect(result.current.displayOptions).toEqual(DEFAULT_DISPLAY_OPTIONS);
  });

  it("should load settings from localStorage on initial render if available", () => {
    const customOptions = { ...DEFAULT_DISPLAY_OPTIONS, showAvatar: false };
    window.localStorage.setItem("card-display-options", JSON.stringify(customOptions));

    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.displayOptions.showAvatar).toBe(false);
  });

  it("should hydrate when mounted becomes true and not change state if options are identical", () => {
    // Set exact default options to local storage so JSON.stringify(prev) === JSON.stringify(stored)
    window.localStorage.setItem("card-display-options", JSON.stringify(DEFAULT_DISPLAY_OPTIONS));
    window.localStorage.setItem("card-layout", JSON.stringify(DEFAULT_CARD_LAYOUT));

    const { result, rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: false }
    });

    const initialLayout = result.current.layout;
    const initialOptions = result.current.displayOptions;

    // Rerender as mounted
    rerender({ mounted: true });

    // Ensure state references didn't change because values were identical
    expect(result.current.layout).toBe(initialLayout);
    expect(result.current.displayOptions).toBe(initialOptions);
  });

  it("should hydrate when mounted becomes true and change state if options differ", () => {
    // Change options so they differ from initial state to hit true branch of ternary
    const customOptions = { ...DEFAULT_DISPLAY_OPTIONS, showAvatar: false };
    const customLayout = { blocks: [{ id: "profile", visible: false, column: "full" }] };

    const { result, rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: false }
    });

    // Mock loadCardSettings to return new values during effect execution
    vi.spyOn(cardSettingsLib, 'loadCardSettings').mockReturnValueOnce({
      layout: customLayout as any,
      options: customOptions
    });

    rerender({ mounted: true });

    expect(result.current.displayOptions.showAvatar).toBe(false);
    expect(result.current.layout).toEqual(customLayout);
  });

  it("should not hydrate if already hydrated", () => {
    // Spy on setItem to see if saveCardSettings was called again
    const saveCardSettingsSpy = vi.spyOn(cardSettingsLib, 'saveCardSettings');

    const { rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: true }
    });

    // Initial mount hydration complete
    expect(saveCardSettingsSpy).toHaveBeenCalledTimes(1);

    // Rerender again with mounted: true
    rerender({ mounted: true });

    // It should not trigger hydration logic again, but saveCardSettings will trigger
    // because of useEffect dependencies unless we verify state setter didn't fire again.
    // Testing the early return in the first useEffect:
    const loadCardSettingsSpy = vi.spyOn(cardSettingsLib, 'loadCardSettings');
    rerender({ mounted: true });

    // The load shouldn't be called again since isHydrated is true
    expect(loadCardSettingsSpy).toHaveBeenCalledTimes(0);
  });


  it("should update display options when toggleDisplayOption is called", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.displayOptions.showAvatar).toBe(true);

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions.showAvatar).toBe(false);

    // Verify it was saved to storage
    const savedOptions = JSON.parse(window.localStorage.getItem("card-display-options") || "{}");
    expect(savedOptions.showAvatar).toBe(false);
  });

  it("should update layout when toggleMainBlockVisibility is called", () => {
    const { result } = renderHook(() => useCardSettings(true));

    const profileBlock = result.current.layout.blocks.find(b => b.id === "profile");
    expect(profileBlock?.visible).toBe(true);

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    const updatedProfileBlock = result.current.layout.blocks.find(b => b.id === "profile");
    expect(updatedProfileBlock?.visible).toBe(false);

    // Verify it was saved to storage
    const savedLayout = JSON.parse(window.localStorage.getItem("card-layout") || "{}");
    const savedProfileBlock = savedLayout.blocks.find((b: any) => b.id === "profile");
    expect(savedProfileBlock.visible).toBe(false);
  });

  it("should return correct visibility using isBlockVisible", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(result.current.isBlockVisible("profile")).toBe(false);
    // @ts-expect-error Testing invalid id
    expect(result.current.isBlockVisible("invalid-id")).toBe(false);
  });

  it("should not save settings to localStorage if not hydrated", () => {
    // Spy on setItem
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useCardSettings(false));

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    // It shouldn't have setItem because it's not mounted and hydrated
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
