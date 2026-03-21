"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function SearchForm() {
  const [username, setUsername] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) {
      startTransition(() => {
        router.push(`/${encodeURIComponent(trimmed)}`);
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="GitHub username"
        className="flex-1 rounded-md border border-card-border bg-card-bg px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={!username.trim() || isPending}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Loading..." : "Search"}
      </button>
    </form>
  );
}
