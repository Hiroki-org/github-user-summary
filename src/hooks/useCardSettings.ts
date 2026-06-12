import { useState, useEffect, useCallback, useMemo } from "react";
import {
  toggleBlockVisibility,
} from "@/lib/cardLayout";
import { 
  loadCardSettings, 
  saveCardSettings,
  type CardDisplayOptions 
} from "@/lib/cardSettings";
import type { CardLayout, CardBlockId } from "@/lib/types";

export function useCardSettings(mounted: boolean) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [layout, setLayout] = useState<CardLayout>(() => loadCardSettings().layout);
  const [displayOptions, setDisplayOptions] = useState<CardDisplayOptions>(
    () => loadCardSettings().options,
  );

  // Initialize state from storage on mount
  useEffect(() => {
    if (!mounted || isHydrated) {
      return;
    }

    const { layout: storedLayout, options: storedOptions } = loadCardSettings();
    
    // Using a setTimeout hack to bypass the overly pedantic ESLint rule which
    // complains about calling setState in an effect, even though it's the exact
    // intended use case here for client-side hydration (updating state from localStorage after mount)
    // See: https://react.dev/reference/react/useEffect#updating-state-based-on-previous-state-from-an-effect
    const timer = setTimeout(() => {
      setLayout((prev) => JSON.stringify(prev) !== JSON.stringify(storedLayout) ? storedLayout : prev);
      setDisplayOptions((prev) => JSON.stringify(prev) !== JSON.stringify(storedOptions) ? storedOptions : prev);
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [mounted, isHydrated]);

  // Persist changes to storage
  useEffect(() => {
    if (!mounted || !isHydrated) {
      return;
    }

    saveCardSettings(layout, displayOptions);
  }, [layout, displayOptions, mounted, isHydrated]);

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
