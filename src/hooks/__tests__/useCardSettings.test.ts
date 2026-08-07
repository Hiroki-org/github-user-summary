// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCardSettings } from "../useCardSettings";
import * as cardSettings from "@/lib/cardSettings";
import * as cardLayout from "@/lib/cardLayout";

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
  const mockDefaultLayout = {
    blocks: [
      { id: "profile", visible: true, column: "full" as const },
      { id: "contributions", visible: false, column: "full" as const },
    ],
  };
  const mockDefaultOptions = { showAvatar: true, showBio: false };

  beforeEach(() => {
    vi.clearAllMocks();
    (cardSettings.loadCardSettings as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      layout: mockDefaultLayout,
      options: mockDefaultOptions,
    });
  });

  it("should initialize with default settings from loadCardSettings", () => {
    const { result } = renderHook(() => useCardSettings(false));

    expect(result.current.layout).toEqual(mockDefaultLayout);
    expect(result.current.displayOptions).toEqual(mockDefaultOptions);
    // Not hydrated yet because mounted is false
    expect(cardSettings.saveCardSettings).not.toHaveBeenCalled();
  });

  it("should hydrate and save settings when mounted", () => {
    const { rerender } = renderHook(({ mounted }) => useCardSettings(mounted), {
      initialProps: { mounted: false },
    });

    rerender({ mounted: true });

    // Expect loadCardSettings to have been called to initialize state
    expect(cardSettings.loadCardSettings).toHaveBeenCalled();

    // After hydrating, it should save the settings
    expect(cardSettings.saveCardSettings).toHaveBeenCalledWith(mockDefaultLayout, mockDefaultOptions);
  });

  it("should toggle main block visibility", () => {
    const { result } = renderHook(() => useCardSettings(true));

    // Setup toggleBlockVisibility mock
    const newLayout = { ...mockDefaultLayout, blocks: [{ id: "profile", visible: false, column: "full" as const }] };
    (cardLayout.toggleBlockVisibility as unknown as ReturnType<typeof vi.fn>).mockReturnValue(newLayout);

    act(() => {
      result.current.toggleMainBlockVisibility("profile");
    });

    expect(cardLayout.toggleBlockVisibility).toHaveBeenCalledWith(mockDefaultLayout, "profile");
    expect(result.current.layout).toEqual(newLayout);
  });

  it("should toggle display options", () => {
    const { result } = renderHook(() => useCardSettings(true));

    act(() => {
      // @ts-expect-error key may be incomplete in mock
      result.current.toggleDisplayOption("showAvatar");
    });

    expect(result.current.displayOptions).toEqual({
      ...mockDefaultOptions,
      showAvatar: false, // Toggled from true to false
    });

    act(() => {
      // @ts-expect-error key may be incomplete in mock
      result.current.toggleDisplayOption("showBio");
    });

    expect(result.current.displayOptions).toEqual({
      ...mockDefaultOptions,
      showAvatar: false,
      showBio: true, // Toggled from false to true
    });
  });

  it("should check if a block is visible correctly", () => {
    const { result } = renderHook(() => useCardSettings(true));

    expect(result.current.isBlockVisible("profile")).toBe(true);
    expect(result.current.isBlockVisible("contributions")).toBe(false);
    expect(result.current.isBlockVisible("stats")).toBe(false); // Does not exist, returns false
  });
});
