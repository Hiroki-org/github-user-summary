"use client";

import type { CardBlockId, CardDisplayOptions } from "@/lib/types";

interface ModalSettingsTabProps {
  MAIN_BLOCKS: { id: CardBlockId; label: string }[];
  DETAIL_OPTIONS: { key: keyof CardDisplayOptions; label: string }[];
  isBlockVisible: (blockId: CardBlockId) => boolean;
  toggleMainBlockVisibility: (blockId: CardBlockId) => void;
  displayOptions: CardDisplayOptions;
  toggleDisplayOption: (key: keyof CardDisplayOptions) => void;
}

export default function ModalSettingsTab({
  MAIN_BLOCKS,
  DETAIL_OPTIONS,
  isBlockVisible,
  toggleMainBlockVisibility,
  displayOptions,
  toggleDisplayOption,
}: ModalSettingsTabProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-card-border/50 bg-card-bg/50 p-4 md:grid-cols-3">
      {MAIN_BLOCKS.map(({ id, label }) => (
        <label
          key={id}
          className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <input
            type="checkbox"
            checked={isBlockVisible(id)}
            onChange={() => toggleMainBlockVisibility(id)}
            className="rounded border-card-border bg-background text-accent focus:ring-accent"
          />
          {label}
        </label>
      ))}

      {DETAIL_OPTIONS.map(({ key, label }) => (
        <label
          key={key as string}
          className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <input
            type="checkbox"
            checked={displayOptions[key] ?? false}
            onChange={() => toggleDisplayOption(key)}
            className="rounded border-card-border bg-background text-accent focus:ring-accent"
          />
          {label}
        </label>
      ))}
    </div>
  );
}
