"use client";

import type { CardDisplayOptions } from "@/lib/types";

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

interface Props {
  options: CardDisplayOptions;
  setOptions: React.Dispatch<React.SetStateAction<CardDisplayOptions>>;
}

export default function DisplayOptionsSection({ options, setOptions }: Props) {
  return (
    <section className="rounded-xl border border-card-border bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-medium text-muted">Display Options</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {toggles.map((toggle) => {
          const checked = Boolean(options[toggle.key]);
          return (
            <label
              key={toggle.key}
              className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm text-muted"
            >
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
  );
}
