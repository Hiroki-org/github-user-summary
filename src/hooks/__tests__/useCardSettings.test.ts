// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCardSettings } from "../useCardSettings";
import { loadCardSettings, saveCardSettings } from "@/lib/cardSettings";
import { toggleBlockVisibility } from "@/lib/cardLayout";
import type { CardLayout, CardDisplayOptions } from "@/lib/types";

vi.mock("@/lib/cardSettings", (): { loadCardSettings: Mock; saveCardSettings: Mock } => ({
  loadCardSettings: vi.fn(),
  saveCardSettings: vi.fn(),
}));

vi.mock("@/lib/cardLayout", (): { toggleBlockVisibility: Mock } => ({
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
    expect(loadCardSettings).toHaveBeenCalled();
  });

  it("does not hydrate or save when mounted is false", () => {
    renderHook(() => useCardSettings(false));

    expect(loadCardSettings).toHaveBeenCalled();
    expect(saveCardSettings).not.toHaveBeenCalled();
  });

  it("hydrates state and enables saving when mounted becomes true", () => {
    // Initial mount is false
    const { rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    expect(saveCardSettings).not.toHaveBeenCalled();
    vi.mocked(loadCardSettings).mockClear();

    // Now mount the component
    rerender({ mounted: true });

    expect(loadCardSettings).toHaveBeenCalled();
    expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockOptions);
  });

  it("hydrates without updating state if stored layout and options match current", () => {
    const { rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    vi.clearAllMocks();

    rerender({ mounted: true });

    expect(loadCardSettings).toHaveBeenCalled();
    expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockOptions);
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

  it("toggles block visibility correctly", async () => {
    const { result } = renderHook(() => useCardSettings(true));

    const toggledLayout: CardLayout = {
      blocks: [
        { id: "profile", visible: false, column: "left" },
        { id: "contributions", visible: false, column: "right" },
      ],
    };

    vi.mocked(toggleBlockVisibility).mockReturnValue(toggledLayout);
    vi.mocked(saveCardSettings).mockClear();

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(toggleBlockVisibility).toHaveBeenCalledWith(mockLayout, "profile");
    expect(result.current.layout).toEqual(toggledLayout);
    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(toggledLayout, mockOptions);
    });
  });

  it("toggles display options correctly", async () => {
    const { result } = renderHook(() => useCardSettings(true));
    vi.mocked(saveCardSettings).mockClear();

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions.showAvatar).toBe(false);
    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, {
        showAvatar: false,
        showBio: false,
      });
    });

    act(() => {
      result.current.toggleDisplayOption("showBio");
    });

    expect(result.current.displayOptions.showBio).toBe(true);
    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, {
        showAvatar: false,
        showBio: true,
      });
    });
  });

  it("checks block visibility correctly", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);
    expect(result.current.isBlockVisible("contributions")).toBe(false);

    // A valid block ID that is absent from the current layout should be false.
    expect(result.current.isBlockVisible("skills")).toBe(false);
  });
});
