import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCardSettings } from "../cardSettings";
import { DEFAULT_CARD_LAYOUT, CardLayout, CardDisplayOptions } from "../types";

describe("cardSettings", () => {
    let originalWindow: typeof window | undefined;

    beforeEach(() => {
        originalWindow = globalThis.window;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("loadCardSettings", () => {
        it("returns default settings when window is not defined", () => {
            // Remove window from global object to simulate SSR environment
            vi.stubGlobal("window", undefined);

            const settings = loadCardSettings();

            expect(settings.layout).toEqual(DEFAULT_CARD_LAYOUT);
            // Verify some default options are present
            expect(settings.options.showCompany).toBe(true);
            expect(settings.options.showTwitter).toBe(true);
        });

        it("returns parsed settings from localStorage when window is defined", () => {
            const mockLayout: CardLayout = { blocks: [{ id: "bio", visible: true, column: "left" }] };
            const mockOptions: Partial<CardDisplayOptions> = { showTwitter: false, showLocation: false };

            const getItemMock = vi.fn((key: string) => {
                if (key === "card-layout") return JSON.stringify(mockLayout);
                if (key === "card-display-options") return JSON.stringify(mockOptions);
                return null;
            });

            vi.stubGlobal("window", {
                localStorage: {
                    getItem: getItemMock,
                },
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
});
