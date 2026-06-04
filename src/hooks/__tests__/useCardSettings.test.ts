// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCardSettings } from "../useCardSettings";
import { loadCardSettings, saveCardSettings } from "@/lib/cardSettings";
import { toggleBlockVisibility } from "@/lib/cardLayout";
import type { CardLayout, CardDisplayOptions } from "@/lib/types";

// Mock dependencies
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

const mockLayout: CardLayout = {
  blocks: [
    { id: "contributions", visible: true, column: "left" },
    { id: "topLanguages", visible: false, column: "right" },
  ],
};

const mockDisplayOptions = {
  showAvatar: true,
  showBio: false,
} satisfies CardDisplayOptions;

describe("useCardSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(loadCardSettings).mockReturnValue({
      layout: mockLayout,
      options: mockDisplayOptions,
    });

    vi.mocked(toggleBlockVisibility).mockImplementation((prev, id) => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    }));
  });

  it("should initialize with default values when not mounted", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(mockLayout);
    expect(result.current.displayOptions).toEqual(mockDisplayOptions);

    // saveCardSettings should not be called when not hydrated/mounted
    expect(saveCardSettings).not.toHaveBeenCalled();
  });

  it("should initialize state from storage on mount and become hydrated", async () => {
    // Initial render where mounted is true
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.layout).toEqual(mockLayout);
    expect(result.current.displayOptions).toEqual(mockDisplayOptions);

    // Wait for effect to finish hydration and trigger save
    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockDisplayOptions);
    });
  });

  it("should update state from storage if it differs from initial render", async () => {
    // Set initial values different from what will be loaded in the effect
    const differentLayout = { ...mockLayout, blocks: [] };
    const differentOptions = { ...mockDisplayOptions, showAvatar: false };

    vi.mocked(loadCardSettings)
      .mockReturnValueOnce({ layout: differentLayout, options: differentOptions })
      .mockReturnValueOnce({ layout: differentLayout, options: differentOptions })
      .mockReturnValue({ layout: mockLayout, options: mockDisplayOptions });

    const { result } = renderHook(() => useCardSettings(true));

    // Verify it updated to the newly loaded values
    await waitFor(() => {
      expect(result.current.layout).toEqual(mockLayout);
      expect(result.current.displayOptions).toEqual(mockDisplayOptions);
    });
  });

  it("should persist changes to storage when mounted and hydrated", async () => {
    const { result } = renderHook(() => useCardSettings(true));

    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockDisplayOptions);
    });
    vi.mocked(saveCardSettings).mockClear();

    // Trigger state change
    act(() => {
      result.current.setLayout({ blocks: [] });
    });

    expect(saveCardSettings).toHaveBeenCalledWith({ blocks: [] }, mockDisplayOptions);
  });

  it("toggleMainBlockVisibility should update layout and trigger save", async () => {
    const { result } = renderHook(() => useCardSettings(true));

    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockDisplayOptions);
    });
    vi.mocked(saveCardSettings).mockClear();

    act(() => {
      result.current.toggleMainBlockVisibility("contributions");
    });

    expect(toggleBlockVisibility).toHaveBeenCalledWith(mockLayout, "contributions");

    // Expected new layout based on our mockImplementation of toggleBlockVisibility
    const expectedLayout = {
      blocks: [
        { id: "contributions", visible: false, column: "left" },
        { id: "topLanguages", visible: false, column: "right" },
      ],
    };

    expect(result.current.layout).toEqual(expectedLayout);
    expect(saveCardSettings).toHaveBeenCalledWith(expectedLayout, mockDisplayOptions);
  });

  it("toggleDisplayOption should update display options and trigger save", async () => {
    const { result } = renderHook(() => useCardSettings(true));

    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockDisplayOptions);
    });
    vi.mocked(saveCardSettings).mockClear();

    act(() => {
      result.current.toggleDisplayOption("showBio" as keyof typeof mockDisplayOptions);
    });

    const expectedOptions = {
      showAvatar: true,
      showBio: true,
    };

    expect(result.current.displayOptions).toEqual(expectedOptions);
    expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, expectedOptions);
  });

  it("isBlockVisible should return correct visibility based on current layout", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("contributions")).toBe(true);
    expect(result.current.isBlockVisible("topLanguages")).toBe(false);
    expect(result.current.isBlockVisible("non-existent-block" as import("@/lib/types").CardBlockId)).toBe(false);
  });

  it("should not persist changes to storage until hydrated", async () => {
    const { rerender } = renderHook(
      ({ mounted }) => useCardSettings(mounted),
      { initialProps: { mounted: false } }
    );

    // Should not have saved during initial unmounted render
    expect(saveCardSettings).not.toHaveBeenCalled();

    // Rerender as mounted, which triggers hydration
    rerender({ mounted: true });

    // Should save after hydration is complete
    await waitFor(() => {
      expect(saveCardSettings).toHaveBeenCalledWith(mockLayout, mockDisplayOptions);
    });
  });
});
