"use client";

import { useState } from "react";

import BusinessCard from "@/components/BusinessCard";
import { loadCardSettings } from "@/lib/cardSettings";
import type { CardDisplayOptions, CardLayout, UserSummary } from "@/lib/types";

type Props = {
  summary: UserSummary;
};

export default function DashboardBusinessCardPreview({ summary }: Props) {
  const [layout] = useState<CardLayout>(() => loadCardSettings().layout);
  const [options] = useState<CardDisplayOptions>(
    () => loadCardSettings().options,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card-bg p-4">
      <div
        className="origin-top-left scale-[0.25]"
        style={{ width: "1200px", height: "630px" }}
      >
        <BusinessCard summary={summary} layout={layout} options={options} />
      </div>
    </div>
  );
}
