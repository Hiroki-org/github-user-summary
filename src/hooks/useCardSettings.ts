"use client";

import { useState, useEffect } from "react";
import { type CardLayout, type CardBlockId } from "@/lib/types";
import {
  cloneDefaultCardLayout,
  normalizeCardLayout,
  toggleBlockVisibility,
  LAYOUT_STORAGE_KEY,
} from "@/lib/cardLayout";
import {
  DEFAULT_DISPLAY_OPTIONS,
  type CardDisplayOptions,
} from "@/lib/cardSettings";

export function useCardSettings(mounted: boolean) {
  const [isLayoutHydrated, setIsLayoutHydrated] = useState(false);
  const [layout, setLayout] = useState<CardLayout>(cloneDefaultCardLayout());
  const [displayOptions, setDisplayOptions] = useState<CardDisplayOptions>(
    DEFAULT_DISPLAY_OPTIONS,
  );

  useEffect(() => {
    if (!mounted) return;

    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setLayout(normalizeCardLayout(parsed));
      } else {
        setLayout(cloneDefaultCardLayout());
      }
    } catch {
      setLayout(cloneDefaultCardLayout());
    } finally {
      setIsLayoutHydrated(true);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isLayoutHydrated) return;

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Ignore storage write failures
    }
  }, [layout, mounted, isLayoutHydrated]);

  const toggleMainBlockVisibility = (blockId: CardBlockId) => {
    setLayout((prev) => toggleBlockVisibility(prev, blockId));
  };

  const toggleDisplayOption = (key: keyof CardDisplayOptions) => {
    setDisplayOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isBlockVisible = (blockId: CardBlockId): boolean => {
    return (
      layout.blocks.find((block) => block.id === blockId)?.visible ?? false
    );
  };

  return {
    layout,
    setLayout,
    displayOptions,
    toggleMainBlockVisibility,
    toggleDisplayOption,
    isBlockVisible,
  };
}
