import type { CardDisplayOptions, CardLayout } from "@/lib/types";
import { DEFAULT_CARD_LAYOUT } from "@/lib/types";

const LAYOUT_KEY = "card-layout";
const OPTIONS_KEY = "card-display-options";

const defaultOptions: CardDisplayOptions = {
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
        return { layout: DEFAULT_CARD_LAYOUT, options: defaultOptions };
    }

    const parsedLayout = safeParse<CardLayout>(window.localStorage.getItem(LAYOUT_KEY));
    const parsedOptions = safeParse<CardDisplayOptions>(window.localStorage.getItem(OPTIONS_KEY));

    return {
        layout: parsedLayout ?? DEFAULT_CARD_LAYOUT,
        options: { ...defaultOptions, ...(parsedOptions ?? {}) },
    };
}

export function saveCardSettings(layout: CardLayout, options: CardDisplayOptions): void {
    if (!hasWindow()) {
        return;
    }

    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
}

export function getDefaultCardSettings(): { layout: CardLayout; options: CardDisplayOptions } {
    return {
        layout: DEFAULT_CARD_LAYOUT,
        options: defaultOptions,
    };
}
