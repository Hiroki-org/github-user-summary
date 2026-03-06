import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCardSettings, saveCardSettings, getDefaultCardSettings } from "../cardSettings";
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
            expect(settings.options).toEqual(getDefaultCardSettings().options);
        });

        it("returns parsed settings from localStorage when window is defined", () => {
            const mockLayout: CardLayout = "left";
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

        it("returns default settings when localStorage items are invalid JSON", () => {
            const getItemMock = vi.fn((key: string) => {
                return "invalid-json";
            });

            vi.stubGlobal("window", {
                localStorage: {
                    getItem: getItemMock,
                },
            });

            const settings = loadCardSettings();

            expect(settings.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(settings.options).toEqual(getDefaultCardSettings().options);
        });

        it("returns default settings when localStorage items are null", () => {
            const getItemMock = vi.fn((key: string) => {
                return null;
            });

            vi.stubGlobal("window", {
                localStorage: {
                    getItem: getItemMock,
                },
            });

            const settings = loadCardSettings();

            expect(settings.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(settings.options).toEqual(getDefaultCardSettings().options);
        });
    });

    describe("saveCardSettings", () => {
        it("does nothing when window is not defined", () => {
            vi.stubGlobal("window", undefined);

            // Should not throw
            expect(() => saveCardSettings("left", getDefaultCardSettings().options)).not.toThrow();
        });

        it("saves settings to localStorage when window is defined", () => {
            const setItemMock = vi.fn();

            vi.stubGlobal("window", {
                localStorage: {
                    setItem: setItemMock,
                },
            });

            const layout: CardLayout = "compact";
            const options = getDefaultCardSettings().options;

            saveCardSettings(layout, options);

            expect(setItemMock).toHaveBeenCalledWith("card-layout", JSON.stringify(layout));
            expect(setItemMock).toHaveBeenCalledWith("card-display-options", JSON.stringify(options));
        });
    });

    describe("getDefaultCardSettings", () => {
        it("returns default layout and options", () => {
            const defaults = getDefaultCardSettings();

            expect(defaults.layout).toEqual(DEFAULT_CARD_LAYOUT);
            expect(defaults.options).toBeDefined();
            expect(defaults.options.showCompany).toBe(true);
        });
    });
});
