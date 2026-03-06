import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDefaultCardSettings, loadCardSettings, saveCardSettings } from "../cardSettings";
import { DEFAULT_CARD_LAYOUT } from "../../lib/types";

describe("cardSettings", () => {
    let getItemMock: ReturnType<typeof vi.fn>;
    let setItemMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
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
    });

    describe("loadCardSettings", () => {
        it("returns defaults when window is undefined", () => {
            vi.unstubAllGlobals();
            const result = loadCardSettings();
            expect(result.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(result.options.showCompany).toBe(true);
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

        it("returns parsed settings when JSON is valid", () => {
            const customLayout = { blocks: [{ id: "bio" as const, visible: true, column: "full" as const }] };
            const customOptions = { showCompany: false };

            getItemMock.mockImplementation((key) => {
                if (key === "card-layout") return JSON.stringify(customLayout);
                if (key === "card-display-options") return JSON.stringify(customOptions);
                return null;
            });

            const result = loadCardSettings();
            expect(result.layout).toEqual(customLayout);
            expect(result.options.showCompany).toBe(false);
            expect(result.options.showLocation).toBe(true); // default merged
        });
    });

    describe("saveCardSettings", () => {
        it("does nothing when window is undefined", () => {
            vi.unstubAllGlobals();
            saveCardSettings(DEFAULT_CARD_LAYOUT, getDefaultCardSettings().options);
            expect(setItemMock).not.toHaveBeenCalled();
        });

        it("saves settings to localStorage", () => {
            const customLayout = { blocks: [{ id: "bio" as const, visible: true, column: "full" as const }] };
            const customOptions = { showCompany: false };

            saveCardSettings(customLayout, customOptions as Parameters<typeof saveCardSettings>[1]);

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
