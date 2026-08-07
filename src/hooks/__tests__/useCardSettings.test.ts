// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCardSettings } from "../useCardSettings";
import { loadCardSettings, saveCardSettings } from "@/lib/cardSettings";
import { toggleBlockVisibility } from "@/lib/cardLayout";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(),
  saveCardSettings: vi.fn(),
}));

vi.mock("@/lib/cardLayout", () => ({
  toggleBlockVisibility: vi.fn(),
}));

describe("useCardSettings", () => {
  const mockLayout = {
    blocks: [
      { id: "profile", visible: true, column: "full" },
      { id: "stats", visible: false, column: "left" },
    ],
  };

  const mockOptions = {
    showAvatar: true,
    showBio: false,
  };

  beforeEach(() => {
    vi.mocked(loadCardSettings).mockReturnValue({
      layout: mockLayout as any,
      options: mockOptions as any,
    });
    vi.clearAllMocks();
  });

  it("should initialize state from loadCardSettings", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.layout).toEqual(mockLayout);
    expect(result.current.displayOptions).toEqual(mockOptions);
    expect(loadCardSettings).toHaveBeenCalled();
  });

  it("should not hydrate if not mounted", () => {
    const { result } = renderHook(() => useCardSettings(false));

    // We should not trigger the internal useEffect hydration logice,
    // though initial state is still loaded during useState init.
    // We mainly verify layout matches.
    expect(result.current.layout).toEqual(mockLayout);
  });

  it("should save settings when layout or options change", () => {
    const { result } = renderHook(() => useCardSettings(true));

    // Initially called on mount due to useEffect persistence
    expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockOptions);

    vi.clearAllMocks();

    act(() => {
      result.current.setDisplayOptions({ ...mockOptions, showAvatar: false } as any);
    });

    expect(saveCardSettings).toHaveBeenCalledWith(
      mockLayout,
      { ...mockOptions, showAvatar: false }
    );
  });

  it("should toggle main block visibility", () => {
    const { result } = renderHook(() => useCardSettings(true));
    const newLayout = { ...mockLayout, blocks: [{ id: "profile", visible: false }] };

    vi.mocked(toggleBlockVisibility).mockReturnValue(newLayout as any);

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(toggleBlockVisibility).toHaveBeenCalledWith(mockLayout, "profile");
    expect(result.current.layout).toEqual(newLayout);
  });

  it("should toggle display option", () => {
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

  it("should correctly report block visibility", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);
    expect(result.current.isBlockVisible("stats")).toBe(false);
    // test unknown block
    expect(result.current.isBlockVisible("unknown" as any)).toBe(false);
  });
});
