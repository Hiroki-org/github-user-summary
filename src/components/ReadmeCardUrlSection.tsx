"use client";

import { useMemo, useState } from "react";
import type { CardBlockId, CardDisplayOptions, CardLayout } from "@/lib/types";

interface Props {
  username?: string | null;
  layout: CardLayout;
  options: CardDisplayOptions;
}

const blockMap: Record<
  CardBlockId,
  "bio" | "stats" | "langs" | "repos" | null
> = {
  avatar: null,
  bio: "bio",
  stats: "stats",
  topLanguages: "langs",
  topRepos: "repos",
  profile: null,
  contributions: null,
  heatmap: null,
  interests: null,
  skills: null,
  repos: "repos",
};

export function generateReadmeUrl({
  username,
  layout,
  options,
  readmeTheme,
  readmeCols,
  includeStreak,
  includeHeatmap,
  origin,
}: {
  username?: string | null;
  layout: CardLayout;
  options: CardDisplayOptions;
  readmeTheme: string;
  readmeCols: number;
  includeStreak: boolean;
  includeHeatmap: boolean;
  origin: string;
}) {
  if (!username) {
    return "";
  }

  const activeBlocks = layout.blocks
    .filter((block) => block.visible)
    .map((block) => ({ block, target: blockMap[block.id] }))
    .filter(
      (
        item,
      ): item is {
        block: CardLayout["blocks"][number];
        target: "bio" | "stats" | "langs" | "repos";
      } => Boolean(item.target),
    );

  const selected = activeBlocks.map((item) => item.target);

  const selectedBlocks: Array<
    "bio" | "stats" | "langs" | "repos" | "streak" | "heatmap"
  > = [...selected];

  if (includeStreak) {
    selectedBlocks.push("streak");
  }

  if (includeHeatmap) {
    selectedBlocks.push("heatmap");
  }

  const uniqueBlocks = Array.from(new Set(selectedBlocks));

  const layoutParts = activeBlocks.map(
    (item) => `${item.block.column}:${item.target}`,
  );

  const hide = [];
  if (options.showContributionBreakdown === false) {
    hide.push("stars");
  }
  if (options.showActivityBreakdown === false) {
    hide.push("forks");
  }

  const params = new URLSearchParams();
  params.set("format", "png");
  params.set("theme", readmeTheme);
  params.set("cols", String(readmeCols));
  params.set(
    "blocks",
    uniqueBlocks.length > 0 ? uniqueBlocks.join(",") : "bio,stats,langs",
  );
  if (layoutParts.length > 0) {
    params.set("layout", layoutParts.join(","));
  }
  if (hide.length > 0) {
    params.set("hide", hide.join(","));
  }
  params.set("width", "600");

  return `${origin}/api/card/${encodeURIComponent(username)}?${params.toString()}`;
}

export default function ReadmeCardUrlSection({ username, layout, options }: Props) {
  const [readmeTheme, setReadmeTheme] = useState<"light" | "dark">("light");
  const [readmeCols, setReadmeCols] = useState<1 | 2>(1);
  const [includeStreak, setIncludeStreak] = useState(false);
  const [includeHeatmap, setIncludeHeatmap] = useState(false);
  const [copyState, setCopyState] = useState("");

  const readmeUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return generateReadmeUrl({
      username,
      layout,
      options,
      readmeTheme,
      readmeCols,
      includeStreak,
      includeHeatmap,
      origin,
    });
  }, [
    username,
    layout,
    options,
    readmeTheme,
    readmeCols,
    includeStreak,
    includeHeatmap,
  ]);

  const onCopyReadmeUrl = async () => {
    if (!readmeUrl) {
      setCopyState("Sign in to generate URL");
      return;
    }

    try {
      await navigator.clipboard.writeText(readmeUrl);
      setCopyState("Copied!");
    } catch {
      setCopyState("Copy failed");
    }
  };

  return (
    <section className="rounded-xl border border-card-border bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-medium text-muted">README Card URL</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm text-muted">
          <span>Theme</span>
          <select
            value={readmeTheme}
            onChange={(event) =>
              setReadmeTheme(event.target.value === "dark" ? "dark" : "light")
            }
            className="rounded-md border border-card-border bg-background px-2 py-1 text-foreground"
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm text-muted">
          <span>Columns</span>
          <select
            value={readmeCols}
            onChange={(event) =>
              setReadmeCols(event.target.value === "2" ? 2 : 1)
            }
            className="rounded-md border border-card-border bg-background px-2 py-1 text-foreground"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm text-muted">
          <span>Include streak</span>
          <input
            type="checkbox"
            checked={includeStreak}
            onChange={(e) => setIncludeStreak(e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between rounded-md border border-card-border px-3 py-2 text-sm text-muted">
          <span>Include heatmap</span>
          <input
            type="checkbox"
            checked={includeHeatmap}
            onChange={(e) => setIncludeHeatmap(e.target.checked)}
          />
        </label>
      </div>

      <div className="mt-4 rounded-md border border-card-border bg-background px-3 py-2 text-xs text-muted break-all">
        {readmeUrl || "Sign in to generate your README URL"}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onCopyReadmeUrl}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Copy URL
        </button>
        {copyState ? (
          <span className="text-sm text-success">{copyState}</span>
        ) : null}
      </div>
    </section>
  );
}
