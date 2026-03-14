"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import LayoutEditor from "@/components/LayoutEditor";
import DisplayOptionsSection from "@/components/DisplayOptionsSection";
import ReadmeCardUrlSection from "@/components/ReadmeCardUrlSection";
import {
  getDefaultCardSettings,
  loadCardSettings,
  saveCardSettings,
} from "@/lib/cardSettings";
import type { CardBlockId, CardDisplayOptions, CardLayout } from "@/lib/types";

export default function DashboardSettingsClient() {
  const { data: session } = useSession();
  const [layout, setLayout] = useState<CardLayout>(
    () => loadCardSettings().layout,
  );
  const [options, setOptions] = useState<CardDisplayOptions>(
    () => loadCardSettings().options,
  );
  const [status, setStatus] = useState<string>("");

  const onSave = () => {
    saveCardSettings(layout, options);
    setStatus("Saved to local settings.");
  };

  const onReset = () => {
    const defaults = getDefaultCardSettings();
    setLayout(defaults.layout);
    setOptions(defaults.options);
    saveCardSettings(defaults.layout, defaults.options);
    setStatus("Reset to defaults.");
  };

  const onToggleBlockVisibility = (blockId: CardBlockId) => {
    setLayout((previous) => ({
      ...previous,
      blocks: previous.blocks.map((block) =>
        block.id === blockId ? { ...block, visible: !block.visible } : block,
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Card Settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Customize which blocks appear and keep preferences in local storage.
        </p>
      </header>

      <section className="rounded-xl border border-card-border bg-card-bg p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Layout</h2>
        <LayoutEditor
          layout={layout}
          onLayoutChange={setLayout}
          onToggleBlockVisibility={onToggleBlockVisibility}
        />
      </section>

      <DisplayOptionsSection options={options} setOptions={setOptions} />

      <ReadmeCardUrlSection
        username={session?.user?.login}
        layout={layout}
        options={options}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-card-border px-4 py-2 text-sm text-muted transition-colors hover:border-muted hover:text-foreground"
        >
          Reset
        </button>
        {status ? <span className="text-sm text-success">{status}</span> : null}
      </div>
    </div>
  );
}
