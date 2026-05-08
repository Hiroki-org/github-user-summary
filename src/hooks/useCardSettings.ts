import { useState, useEffect, useCallback, useMemo } from "react";
import {
  cloneDefaultCardLayout,
  normalizeCardLayout,
  toggleBlockVisibility,
  LAYOUT_STORAGE_KEY,
} from "@/lib/cardLayout";
import { DEFAULT_DISPLAY_OPTIONS, type CardDisplayOptions } from "@/lib/cardSettings";
import type { CardLayout, CardBlockId } from "@/lib/types";

export function useCardSettings(mounted: boolean) {
  const [isLayoutHydrated, setIsLayoutHydrated] = useState(false);
  const [layout, setLayout] = useState<CardLayout>(cloneDefaultCardLayout());
  const [displayOptions, setDisplayOptions] = useState<CardDisplayOptions>(
    DEFAULT_DISPLAY_OPTIONS,
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

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
    if (!mounted || !isLayoutHydrated) {
      return;
    }

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Ignore storage write failures (private mode, quota exceeded, etc.)
    }
  }, [layout, mounted, isLayoutHydrated]);

  const toggleMainBlockVisibility = useCallback((blockId: CardBlockId) => {
    setLayout((prev) => toggleBlockVisibility(prev, blockId));
  }, []);

  const toggleDisplayOption = useCallback((key: keyof CardDisplayOptions) => {
    setDisplayOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const visibleBlocksMap = useMemo(() => {
    const map = new Map<CardBlockId, boolean>();
    for (let i = 0; i < layout.blocks.length; i++) {
      const block = layout.blocks[i];
      map.set(block.id, block.visible);
    }
    return map;
  }, [layout.blocks]);

  const isBlockVisible = useCallback((blockId: CardBlockId): boolean => {
    return visibleBlocksMap.get(blockId) ?? false;
  }, [visibleBlocksMap]);

  return {
    layout,
    setLayout,
    displayOptions,
    setDisplayOptions,
    toggleMainBlockVisibility,
    toggleDisplayOption,
    isBlockVisible,
  };
}
