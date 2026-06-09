import { logger } from "@/lib/logger";
import type { CardDisplayOptions, CardLayout } from "@/lib/types";
export type { CardDisplayOptions, CardLayout };
import { DEFAULT_CARD_LAYOUT } from "@/lib/types";
import { normalizeCardLayout } from "@/lib/cardLayout";

const LAYOUT_KEY = "card-layout";
const OPTIONS_KEY = "card-display-options";

export const DEFAULT_DISPLAY_OPTIONS: CardDisplayOptions = {
    showAvatar: true,
    showBio: true,
    showStats: true,
    showLanguage: true,
    showRepos: true,
    showCompany: true,
    showLocation: true,
    showWebsite: true,
    showTwitter: true,
    showJoinedDate: true,
    showTopics: true,
    showContributionBreakdown: true,
    showStreaks: true,
    showInterests: true,
    showActivityBreakdown: true,
};

function hasWindow(): boolean {
    return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function loadCardSettings(): { layout: CardLayout; options: CardDisplayOptions } {
    if (!hasWindow()) {
        return { layout: DEFAULT_CARD_LAYOUT, options: DEFAULT_DISPLAY_OPTIONS };
    }

    try {
        const parsedLayout = safeParse<CardLayout>(window.localStorage.getItem(LAYOUT_KEY));
        const parsedOptions = safeParse<CardDisplayOptions>(window.localStorage.getItem(OPTIONS_KEY));

        return {
            layout: parsedLayout ? normalizeCardLayout(parsedLayout) : DEFAULT_CARD_LAYOUT,
            options: { ...DEFAULT_DISPLAY_OPTIONS, ...(parsedOptions ?? {}) },
        };
    } catch {
        return { layout: DEFAULT_CARD_LAYOUT, options: DEFAULT_DISPLAY_OPTIONS };
    }
}

export function saveCardSettings(layout: CardLayout, options: CardDisplayOptions): void {
    if (!hasWindow()) {
        return;
    }

    try {
        window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
        window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    } catch (err) {
        logger.error("Failed to save card settings to localStorage", err);
        // Ignore storage write failures (private mode, quota exceeded, etc.)
    }
}

export function getDefaultCardSettings(): { layout: CardLayout; options: CardDisplayOptions } {
    return {
        layout: DEFAULT_CARD_LAYOUT,
        options: DEFAULT_DISPLAY_OPTIONS,
    };
}
