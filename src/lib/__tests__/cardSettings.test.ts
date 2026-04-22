import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDefaultCardSettings, loadCardSettings, saveCardSettings } from "../cardSettings";
import { DEFAULT_CARD_LAYOUT, CardLayout, CardDisplayOptions } from "../types";
import { CardBlockType } from "../cardOptions";
import { normalizeCardLayout } from "../cardLayout";

describe("cardSettings", () => {
    // let originalWindow: typeof window | undefined;
    let getItemMock: ReturnType<typeof vi.fn>;
    let setItemMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // originalWindow = globalThis.window;
        getItemMock = vi.fn();
        setItemMock = vi.fn();

        vi.stubGlobal("window", {
            localStorage: {
                getItem: getItemMock,
                setItem: setItemMock,
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("loadCardSettings", () => {
        it("returns defaults when window is undefined", () => {
             // Remove window from global object to simulate SSR environment
             vi.stubGlobal("window", undefined);
             const result = loadCardSettings();
             expect(result.layout).toEqual(DEFAULT_CARD_LAYOUT);
             expect(result.options.showCompany).toBe(true);
             expect(result.options.showTwitter).toBe(true);
        });

        it("returns defaults when localStorage is empty", () => {
            getItemMock.mockReturnValue(null);
            const result = loadCardSettings();
            expect(result.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(result.options.showCompany).toBe(true);
        });

        it("safely handles invalid JSON in localStorage (safeParse)", () => {
            // Mock returning invalid JSON
            getItemMock.mockReturnValue("{invalid-json: true");

            const result = loadCardSettings();

            // Should fallback to defaults
            expect(result.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(result.options.showCompany).toBe(true);
            expect(getItemMock).toHaveBeenCalledTimes(2); // One for layout, one for options
        });

        it("safely handles partially invalid JSON across multiple localStorage keys (safeParse fallback)", () => {
            const mockLayout: CardLayout = normalizeCardLayout({ blocks: [{ id: "bio", visible: true, column: "full" }] });

            // Return valid JSON for layout, but completely invalid JSON for options
            getItemMock.mockImplementation((key: string) => {
                if (key === "card-layout") return JSON.stringify(mockLayout);
                if (key === "card-display-options") return "completely { invalid [] JSON !!";
                return null;
            });

            const settings = loadCardSettings();

            // Valid layout should be loaded
            expect(settings.layout).toEqual(mockLayout);
            // Invalid options should fallback to defaults smoothly
            expect(settings.options.showCompany).toBe(true);
            expect(settings.options.showTwitter).toBe(true);
            expect(getItemMock).toHaveBeenCalledWith("card-layout");
            expect(getItemMock).toHaveBeenCalledWith("card-display-options");
        });

        it.each([
            ["invalid JSON", "{invalid-json: true"],
            ["null", null],
        ])("safely handles %s for layout but valid JSON for options", (_, layoutValue) => {
            const mockOptions: Partial<CardDisplayOptions> = { showTwitter: false, showLocation: false };
            getItemMock.mockReturnValueOnce(layoutValue);
            getItemMock.mockReturnValueOnce(JSON.stringify(mockOptions));

            const settings = loadCardSettings();

            expect(settings.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(settings.options.showTwitter).toBe(false);
            expect(settings.options.showLocation).toBe(false);
            expect(settings.options.showCompany).toBe(true);
        });

        it("safely handles valid JSON for layout but null for options", () => {
            const mockLayout: CardLayout = normalizeCardLayout({ blocks: [{ id: "bio", visible: true, column: "left" }] });
            getItemMock.mockReturnValueOnce(JSON.stringify(mockLayout));
            getItemMock.mockReturnValueOnce(null);

            const settings = loadCardSettings();

            expect(settings.layout).toEqual(mockLayout);
            expect(settings.options.showCompany).toBe(true);
        });

        it("returns parsed settings from localStorage when window is defined", () => {
            const mockLayout: CardLayout = normalizeCardLayout({ blocks: [{ id: "bio", visible: true, column: "left" }] });
            const mockOptions: Partial<CardDisplayOptions> = { showTwitter: false, showLocation: false };

            getItemMock.mockImplementation((key: string) => {
                if (key === "card-layout") return JSON.stringify(mockLayout);
                if (key === "card-display-options") return JSON.stringify(mockOptions);
                return null;
            });

            const settings = loadCardSettings();

            expect(settings.layout).toEqual(mockLayout);
            expect(settings.options.showTwitter).toBe(false);
            expect(settings.options.showLocation).toBe(false);
            expect(settings.options.showCompany).toBe(true); // default option should be preserved
            expect(getItemMock).toHaveBeenCalledWith("card-layout");
            expect(getItemMock).toHaveBeenCalledWith("card-display-options");
        });
    });


        it("normalizes semantically invalid layout structure that is valid JSON", () => {
            // Valid JSON, but semantically invalid layout (missing blocks, wrong column type)
            const invalidLayout = {
                blocks: [
                    { id: "invalidBlockType", visible: true, column: "left" },
                    { id: "bio", visible: true, column: "wrongColumn" }
                ]
            };

            getItemMock.mockImplementation((key: string) => {
                if (key === "card-layout") return JSON.stringify(invalidLayout);
                return null;
            });

            const settings = loadCardSettings();

            // The bio block should be fixed to 'left' (or full depending on normalization, but valid)
            const bioBlock = settings.layout.blocks.find(b => b.id === "bio");
            expect(bioBlock).toBeDefined();
            expect(["left", "right", "full"]).toContain(bioBlock?.column);

            // The invalid block should be removed
            const invalidBlock = settings.layout.blocks.find(b => b.id === "invalidBlockType" as unknown as CardBlockType);
            expect(invalidBlock).toBeUndefined();

            // Missing blocks should be added
            const profileBlock = settings.layout.blocks.find(b => b.id === "profile");
            expect(profileBlock).toBeDefined();
        });

    describe("saveCardSettings", () => {
        it("does nothing when window is undefined", () => {
            vi.stubGlobal("window", undefined);
            saveCardSettings(DEFAULT_CARD_LAYOUT, getDefaultCardSettings().options);
            expect(setItemMock).not.toHaveBeenCalled();
        });

        it("saves settings to localStorage", () => {
            const customLayout: CardLayout = { blocks: [{ id: "bio", visible: true, column: "full" }] };
            const customOptions: Partial<CardDisplayOptions> = { showCompany: false };

            saveCardSettings(customLayout, customOptions);

            expect(setItemMock).toHaveBeenCalledWith("card-layout", JSON.stringify(customLayout));
            expect(setItemMock).toHaveBeenCalledWith("card-display-options", JSON.stringify(customOptions));
        });
    });

    describe("getDefaultCardSettings", () => {
        it("returns default settings", () => {
            const result = getDefaultCardSettings();
            expect(result.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(result.options.showCompany).toBe(true);
        });
    });
});
