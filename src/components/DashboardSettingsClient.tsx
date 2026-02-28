"use client";

import { useState } from "react";

import LayoutEditor from "@/components/LayoutEditor";
import { getDefaultCardSettings, loadCardSettings, saveCardSettings } from "@/lib/cardSettings";
import type { CardDisplayOptions, CardLayout } from "@/lib/types";

const toggles: Array<{ key: keyof CardDisplayOptions; label: string }> = [
  { key: "showCompany", label: "Company" },
  { key: "showLocation", label: "Location" },
  { key: "showWebsite", label: "Website" },
  { key: "showTwitter", label: "Twitter" },
  { key: "showJoinedDate", label: "Joined date" },
  { key: "showTopics", label: "Topics" },
  { key: "showContributionBreakdown", label: "Contribution breakdown" },
  { key: "showStreaks", label: "Streaks" },
  { key: "showInterests", label: "Interests" },
  { key: "showActivityBreakdown", label: "Activity breakdown" },
];

export default function DashboardSettingsClient() {
  const [layout, setLayout] = useState<CardLayout>(() => loadCardSettings().layout);
  const [options, setOptions] = useState<CardDisplayOptions>(() => loadCardSettings().options);
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Card Settings</h1>
        <p className="mt-2 text-sm text-muted">Customize which blocks appear and keep preferences in local storage.</p>
      </header>

      <section className="rounded-xl border border-card-border bg-card-bg p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Layout</h2>
        <LayoutEditor value={layout} onChange={setLayout} />
      </section>

      <section className="rounded-xl border border-card-border bg-card-bg p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Display Options</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {toggles.map((toggle) => {
            const checked = Boolean(options[toggle.key]);
            return (
              <label key={toggle.key} className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm text-muted">
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    setOptions((previous) => ({
                      ...previous,
                      [toggle.key]: event.target.checked,
                    }));
                  }}
                />
              </label>
            );
          })}
        </div>
      </section>

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
