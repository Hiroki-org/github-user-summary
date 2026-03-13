"use client";

import { useState } from "react";
import type { UserSummary } from "@/lib/types";
import CardGeneratorModal from "./CardGeneratorModal";

type Props = {
  summary: UserSummary;
};

export default function CardGenerator({ summary }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!summary.profile) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        Card
      </button>

      <CardGeneratorModal
        summary={summary}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
