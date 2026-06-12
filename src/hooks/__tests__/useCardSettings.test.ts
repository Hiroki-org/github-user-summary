// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCardSettings } from "../useCardSettings";
import * as cardSettingsLib from "@/lib/cardSettings";
import * as cardLayoutLib from "@/lib/cardLayout";
import { DEFAULT_CARD_LAYOUT, CardBlockId, CardLayout, CardBlock } from "@/lib/types";

// Mock loadCardSettings and saveCardSettings
vi.mock("@/lib/cardSettings", async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/cardSettings')>();
  return {
    ...actual,
    loadCardSettings: vi.fn(),
    saveCardSettings: vi.fn(),
  };
});

// Mock toggleBlockVisibility
vi.mock("@/lib/cardLayout", async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/cardLayout')>();
  return {
    ...actual,
    toggleBlockVisibility: vi.fn(),
  };
});

describe("useCardSettings", () => {
  const mockDefaultLayout: CardLayout = { ...DEFAULT_CARD_LAYOUT };
  const mockDefaultOptions = { ...cardSettingsLib.DEFAULT_DISPLAY_OPTIONS };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cardSettingsLib.loadCardSettings).mockReturnValue({
      layout: mockDefaultLayout,
      options: mockDefaultOptions,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize state from loadCardSettings", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(mockDefaultLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);
    expect(cardSettingsLib.loadCardSettings).toHaveBeenCalledTimes(2); // Initial state setup
  });

  it("should hydrate from storage when mounted becomes true", async () => {
    const storedLayout: CardLayout = { blocks: [{ id: "profile" as CardBlockId, visible: false, column: "full" as const }] as CardBlock[] };
    const storedOptions = { ...mockDefaultOptions, showAvatar: false };

    const { result, rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: false },
    });

    // Before hydration, it should have the initial values
    expect(result.current.layout).toEqual(mockDefaultLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);

    // Now change what loadCardSettings returns for the effect
    vi.mocked(cardSettingsLib.loadCardSettings).mockReturnValue({
      layout: storedLayout,
      options: storedOptions,
    });

    // Trigger mount
    rerender({ mounted: true });

    // The effect should have run and updated the state (needs waitFor because of setTimeout)
    await waitFor(() => {
      expect(result.current.layout).toEqual(storedLayout);
      expect(result.current.displayOptions).toEqual(storedOptions);
    });
  });

  it("should call saveCardSettings when layout or options change and hydrated", async () => {
    const { result } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: true },
    });

    // Wait for hydration to complete
    await waitFor(() => {
      expect(cardSettingsLib.loadCardSettings).toHaveBeenCalled();
    });

    // Clear initial saveCardSettings call
    vi.mocked(cardSettingsLib.saveCardSettings).mockClear();

    // Trigger state change
    act(() => {
      result.current.setDisplayOptions({ ...mockDefaultOptions, showAvatar: false });
    });

    // Because state updates are sometimes batched/async, let's wait
    await waitFor(() => {
      expect(cardSettingsLib.saveCardSettings).toHaveBeenCalledWith(
        mockDefaultLayout,
        { ...mockDefaultOptions, showAvatar: false }
      );
    });
  });

  it("should provide toggleMainBlockVisibility which updates layout", async () => {
    const { result } = renderHook(() => useCardSettings(true));

    // Wait for hydration
    await waitFor(() => expect(result.current.layout).toEqual(mockDefaultLayout));

    const newLayout: CardLayout = { blocks: [{ id: "profile" as CardBlockId, visible: false, column: "full" as const }] as CardBlock[] };
    vi.mocked(cardLayoutLib.toggleBlockVisibility).mockReturnValue(newLayout);

    act(() => {
      result.current.toggleMainBlockVisibility("profile" as CardBlockId);
    });

    expect(cardLayoutLib.toggleBlockVisibility).toHaveBeenCalledWith(mockDefaultLayout, "profile");
    expect(result.current.layout).toEqual(newLayout);
  });

  it("should provide toggleDisplayOption which updates displayOptions", async () => {
    const { result } = renderHook(() => useCardSettings(true));

    // Wait for hydration
    await waitFor(() => expect(result.current.displayOptions.showAvatar).toBe(true));

    act(() => {
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions.showAvatar).toBe(false);
  });

  it("should provide isBlockVisible to check if a block is visible", () => {
    const layout: CardLayout = {
      blocks: [
        { id: "profile" as CardBlockId, visible: true, column: "full" as const },
        { id: "stats" as CardBlockId, visible: false, column: "left" as const },
      ] as CardBlock[]
    };

    vi.mocked(cardSettingsLib.loadCardSettings).mockReturnValue({
      layout: layout,
      options: mockDefaultOptions,
    });

    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile" as CardBlockId)).toBe(true);
    expect(result.current.isBlockVisible("stats" as CardBlockId)).toBe(false);
    expect(result.current.isBlockVisible("unknown" as CardBlockId)).toBe(false);
  });
});
