// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardSettings } from "../useCardSettings";
import { loadCardSettings, saveCardSettings } from "@/lib/cardSettings";
import { toggleBlockVisibility } from "@/lib/cardLayout";
import type { CardLayout, CardDisplayOptions, CardBlockId } from "@/lib/types";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(),
  saveCardSettings: vi.fn(),
}));

vi.mock("@/lib/cardLayout", () => ({
  toggleBlockVisibility: vi.fn(),
}));

describe("useCardSettings", () => {
  const mockLayout: CardLayout = {
    blocks: [
      { id: "profile", visible: true, column: "left" },
      { id: "contributions", visible: false, column: "right" },
    ],
  };

  const mockOptions: CardDisplayOptions = {
    showAvatar: true,
    showBio: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadCardSettings).mockReturnValue({
      layout: mockLayout,
      options: mockOptions,
    });
  });

  it("initializes state from loadCardSettings on first render", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(mockLayout);
    expect(result.current.displayOptions).toEqual(mockOptions);
    // Since useState initializers are called once
    expect(loadCardSettings).toHaveBeenCalledTimes(2);
  });

  it("does not hydrate or save when mounted is false", () => {
    renderHook(() => useCardSettings(false));

    // Initial load only
    expect(loadCardSettings).toHaveBeenCalledTimes(2);
    expect(saveCardSettings).not.toHaveBeenCalled();
  });

  it("hydrates state and enables saving when mounted becomes true", () => {
    // Initial mount is false
    const { result, rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    expect(saveCardSettings).not.toHaveBeenCalled();

    // Now mount the component
    rerender({ mounted: true });

    // It should have called loadCardSettings again during hydration
    expect(loadCardSettings).toHaveBeenCalledTimes(3);
    // After hydration, layout and displayOptions effects trigger saveCardSettings
    expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockOptions);
  });

  it("hydrates without updating state if stored layout and options match current", () => {
    const { rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    vi.clearAllMocks();

    rerender({ mounted: true });

    // loadCardSettings should be called for hydration
    expect(loadCardSettings).toHaveBeenCalledTimes(1);
    // Save should be called after hydration
    expect(saveCardSettings).toHaveBeenCalledTimes(1);
  });

  it("updates state if stored layout and options differ during hydration", () => {
    const { result, rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    const newMockLayout: CardLayout = { blocks: [{ id: "skills", visible: true, column: "full" }] };
    const newMockOptions: CardDisplayOptions = { showAvatar: false, showBio: true };

    vi.mocked(loadCardSettings).mockReturnValue({
      layout: newMockLayout,
      options: newMockOptions,
    });

    rerender({ mounted: true });

    expect(result.current.layout).toEqual(newMockLayout);
    expect(result.current.displayOptions).toEqual(newMockOptions);
  });

  it("saves state changes to storage when mounted and hydrated", () => {
    const { result } = renderHook(() => useCardSettings(true));

    // Clear initial save from hydration
    vi.mocked(saveCardSettings).mockClear();

    const updatedOptions = { ...mockOptions, showAvatar: false };

    act(() => {
      result.current.setDisplayOptions(updatedOptions);
    });

    expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, updatedOptions);
  });

  it("toggles block visibility correctly", () => {
    const { result } = renderHook(() => useCardSettings(true));

    const toggledLayout: CardLayout = {
      blocks: [
        { id: "profile", visible: false, column: "left" },
        { id: "contributions", visible: false, column: "right" },
      ],
    };

    vi.mocked(toggleBlockVisibility).mockReturnValue(toggledLayout);

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(toggleBlockVisibility).toHaveBeenCalledWith(mockLayout, "profile");
    expect(result.current.layout).toEqual(toggledLayout);
  });

  it("toggles display options correctly", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions.showAvatar).toBe(false);

    act(() => {
      result.current.toggleDisplayOption("showBio");
    });

    expect(result.current.displayOptions.showBio).toBe(true);
  });

  it("checks block visibility correctly", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);
    expect(result.current.isBlockVisible("contributions")).toBe(false);

    // Non-existent block should be false
    expect(result.current.isBlockVisible("skills" as CardBlockId)).toBe(false);
  });
});
