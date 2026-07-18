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
  const [layout, setLayout] = useState<CardLayout>(() => loadCardSettings().layout);
  const [displayOptions, setDisplayOptions] = useState<CardDisplayOptions>(
    () => loadCardSettings().options,
  );

      // Persist changes to storage
  useEffect(() => {
    if (!mounted) {
      return;
    }

    saveCardSettings(layout, displayOptions);
  }, [layout, displayOptions, mounted]);

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
