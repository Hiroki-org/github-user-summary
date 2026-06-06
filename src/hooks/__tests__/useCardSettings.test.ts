// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardSettings } from "../useCardSettings";
import * as cardSettingsLib from "@/lib/cardSettings";
import * as cardLayoutLib from "@/lib/cardLayout";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(),
  saveCardSettings: vi.fn(),
}));

vi.mock("@/lib/cardLayout", () => ({
  toggleBlockVisibility: vi.fn(),
}));

describe("useCardSettings", () => {
  const mockDefaultLayout = {
    blocks: [
      { id: "profile", visible: true, column: "full" },
      { id: "stats", visible: false, column: "left" },
    ],
  };

  const mockDefaultOptions = {
    showAvatar: true,
    showBio: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cardSettingsLib.loadCardSettings).mockReturnValue({
      // @ts-expect-error - mock data
      layout: mockDefaultLayout,
      // @ts-expect-error - mock data
      options: mockDefaultOptions,
    });
  });

  it("should initialize with values from loadCardSettings synchronously", () => {
    const { result } = renderHook(() => useCardSettings(false));

    // loadCardSettings is called twice during useState lazy initialization (once for layout, once for options)
    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(2);
    expect(result.current.layout).toEqual(mockDefaultLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);
    expect(cardSettingsLib.saveCardSettings).not.toHaveBeenCalled();
  });

  it("should not hydrate if mounted is false", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(2); // Only for init
    // Hydration useEffect should return early
    expect(result.current.layout).toEqual(mockDefaultLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);
    expect(cardSettingsLib.saveCardSettings).not.toHaveBeenCalled();
  });

  it("should hydrate and update state when mounted becomes true", () => {
    const { result, rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    // Now mount
    rerender({ mounted: true });

    // Expect loadCardSettings to be called again during the effect (2 from init + 1 from effect)
    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(3);
    expect(result.current.layout).toEqual(mockDefaultLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);
  });

  it("should not call saveCardSettings before hydration is complete", () => {
    const { rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    expect(cardSettingsLib.saveCardSettings).not.toHaveBeenCalled();

    // Trigger hydration
    rerender({ mounted: true });

    // Once hydration is complete, isHydrated becomes true, and the second useEffect will call saveCardSettings
    expect(cardSettingsLib.saveCardSettings).toHaveBeenCalledTimes(1);
    expect(cardSettingsLib.saveCardSettings).toHaveBeenCalledWith(mockDefaultLayout, mockDefaultOptions);
  });

  it("should call saveCardSettings when state changes after hydration", () => {
    const { result, rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: true } }
    );

    // Clear mock to isolate the save call from the subsequent manual state change
    vi.mocked(cardSettingsLib.saveCardSettings).mockClear();

    // Trigger state change
    act(() => {
      // @ts-expect-error - mock data
      result.current.setDisplayOptions({ showAvatar: false, showBio: false });
    });

    expect(cardSettingsLib.saveCardSettings).toHaveBeenCalledTimes(1);
    expect(cardSettingsLib.saveCardSettings).toHaveBeenCalledWith(
      mockDefaultLayout,
      { showAvatar: false, showBio: false }
    );
  });

  it("toggleMainBlockVisibility should call layout toggle function", () => {
    const { result } = renderHook(() => useCardSettings(true));

    const mockToggledLayout = { blocks: [] };
    vi.mocked(cardLayoutLib.toggleBlockVisibility).mockReturnValue(mockToggledLayout as any);

    act(() => {
      // @ts-expect-error - mock data
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(cardLayoutLib.toggleBlockVisibility).toHaveBeenCalledWith(mockDefaultLayout, "profile");
    expect(result.current.layout).toEqual(mockToggledLayout);
  });

  it("toggleDisplayOption should toggle boolean values", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      // @ts-expect-error - mock data
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions.showAvatar).toBe(false);

    act(() => {
      // @ts-expect-error - mock data
      result.current.toggleDisplayOption("showBio");
    });

    expect(result.current.displayOptions.showBio).toBe(true);
  });

  it("isBlockVisible should return true for visible blocks and false for hidden/unknown", () => {
    const { result } = renderHook(() => useCardSettings(true));

    // @ts-expect-error - mock data
    expect(result.current.isBlockVisible("profile")).toBe(true);
    // @ts-expect-error - mock data
    expect(result.current.isBlockVisible("stats")).toBe(false);
    // @ts-expect-error - mock data
    expect(result.current.isBlockVisible("unknown")).toBe(false);
  });
});
