import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCardSettings } from "../useCardSettings";
import { loadCardSettings, saveCardSettings } from "@/lib/cardSettings";
import { toggleBlockVisibility } from "@/lib/cardLayout";
import { type CardLayout, type CardBlockId } from "@/lib/types";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(),
  saveCardSettings: vi.fn(),
}));

vi.mock("@/lib/cardLayout", () => ({
  toggleBlockVisibility: vi.fn(),
}));

const mockDefaultOptions = {
  showAvatar: true,
  showBio: true,
};

const mockLayout: CardLayout = {
  blocks: [
    { id: "profile", visible: true, column: "full" },
    { id: "contributions", visible: false, column: "full" },
  ],
};

describe("useCardSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadCardSettings).mockReturnValue({
      layout: mockLayout,
      options: mockDefaultOptions as any,
    });
    vi.mocked(toggleBlockVisibility).mockImplementation((layout, blockId) => ({
      ...layout,
      blocks: layout.blocks.map(b => b.id === blockId ? { ...b, visible: !b.visible } : b)
    }));
  });

  it("should initialize with values from loadCardSettings", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(mockLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);
    expect(loadCardSettings).toHaveBeenCalledTimes(2); // Called in useState initializers
  });

  it("should hydrate from storage when mounted becomes true", () => {
    const updatedLayout: CardLayout = { blocks: [] };
    const updatedOptions = { ...mockDefaultOptions, showAvatar: false };

    vi.mocked(loadCardSettings).mockReturnValue({
        layout: mockLayout,
        options: mockDefaultOptions as any,
    });

    const { result, rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: false }
    });

    // Before hydration
    expect(result.current.layout).toEqual(mockLayout);

    vi.mocked(loadCardSettings).mockReturnValue({
      layout: updatedLayout,
      options: updatedOptions as any,
    });

    rerender({ mounted: true });

    expect(result.current.layout).toEqual(updatedLayout);
    expect(result.current.displayOptions).toEqual(updatedOptions);
  });

  it("should persist changes to storage when hydrated and mounted", () => {
    const { result } = renderHook(() => useCardSettings(true));

    // Clear calls from hydration
    vi.mocked(saveCardSettings).mockClear();

    act(() => {
      result.current.setDisplayOptions({ ...mockDefaultOptions, showAvatar: false } as any);
    });

    expect(saveCardSettings).toHaveBeenCalledWith(
        mockLayout,
        { ...mockDefaultOptions, showAvatar: false }
    );
  });

  it("should toggle block visibility", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(toggleBlockVisibility).toHaveBeenCalledWith(mockLayout, "profile");
    expect(result.current.layout.blocks[0].visible).toBe(false);
  });

  it("should toggle display options", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions.showAvatar).toBe(false);
  });

  it("should return correct block visibility using isBlockVisible", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);
    expect(result.current.isBlockVisible("contributions")).toBe(false);
    expect(result.current.isBlockVisible("non-existent" as CardBlockId)).toBe(false);
  });

  it("should not save to storage if not hydrated", () => {
    const { result } = renderHook(() => useCardSettings(false));

    act(() => {
        result.current.setDisplayOptions({ ...mockDefaultOptions, showAvatar: false } as any);
    });

    expect(saveCardSettings).not.toHaveBeenCalled();
  });

  it("should allow direct setLayout and setDisplayOptions updates", () => {
    const { result } = renderHook(() => useCardSettings(true));

    const newLayout: CardLayout = { blocks: [{ id: "profile", visible: false, column: "full" }] };
    const newOptions = { ...mockDefaultOptions, showBio: false };

    act(() => {
      result.current.setLayout(newLayout);
      result.current.setDisplayOptions(newOptions as any);
    });

    expect(result.current.layout).toEqual(newLayout);
    expect(result.current.displayOptions).toEqual(newOptions);
    expect(saveCardSettings).toHaveBeenCalledWith(newLayout, newOptions);
  });
});
