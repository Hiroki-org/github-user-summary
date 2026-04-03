import { ImageResponse } from "@vercel/og";
import type { ReactElement } from "react";
import satori from "satori";

import type { CardData } from "@/lib/cardDataFetcher";

export type CardFormat = "png" | "svg";
export type CardTheme = "light" | "dark";
export type CardBlockType =
  | "bio"
  | "stats"
  | "langs"
  | "repos"
  | "streak"
  | "heatmap";
export type CardLayoutSlot = "left" | "right" | "full";

export type CardRenderOptions = {
  format: CardFormat;
  theme: CardTheme;
  blocks: CardBlockType[];
  cols: 1 | 2;
  layout: Partial<Record<CardBlockType, CardLayoutSlot>>;
  hide: Set<string>;
  width: number;
};

type ThemePalette = {
  bg: string;
  panel: string;
  text: string;
  subtext: string;
  accent: string;
  border: string;
  success: string;
};

const DEFAULT_BLOCKS: CardBlockType[] = ["bio", "stats", "langs"];
const VALID_BLOCKS: CardBlockType[] = [
  "bio",
  "stats",
  "langs",
  "repos",
  "streak",
  "heatmap",
];
const VALID_LAYOUT_SLOTS: CardLayoutSlot[] = ["left", "right", "full"];

const themes: Record<CardTheme, ThemePalette> = {
  light: {
    bg: "#f8fafc",
    panel: "#ffffff",
    text: "#0f172a",
    subtext: "#475569",
    accent: "#0284c7",
    border: "#cbd5e1",
    success: "#16a34a",
  },
  dark: {
    bg: "#0b1220",
    panel: "#111827",
    text: "#e2e8f0",
    subtext: "#94a3b8",
    accent: "#38bdf8",
    border: "#334155",
    success: "#4ade80",
  },
};

const DEFAULT_FONT_URL =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const FONT_FETCH_TIMEOUT_MS = 5000;

const fontCache = new Map<string, Promise<ArrayBuffer>>();

function getFontData(fontUrl?: string): Promise<ArrayBuffer> {
  const targetUrl = fontUrl ?? DEFAULT_FONT_URL;

  if (!fontCache.has(targetUrl)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FONT_FETCH_TIMEOUT_MS);

    const pending = fetch(targetUrl, {
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load default font");
        }
        return response.arrayBuffer();
      })
      .catch((error) => {
        fontCache.delete(targetUrl);
        throw error;
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    fontCache.set(targetUrl, pending);
  }

  return fontCache.get(targetUrl)!;
}

function toList(csv: string | null): string[] {
  if (!csv) {
    return [];
  }
  return csv
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseWidth(raw: string | null): number {
  if (!raw) {
    return 600;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 320 || value > 1400) {
    return 600;
  }
  return value;
}

function parseBlocks(raw: string | null): CardBlockType[] {
  const requested = toList(raw);
  if (requested.length === 0) {
    return DEFAULT_BLOCKS;
  }

  const unique: CardBlockType[] = [];
  for (const block of requested) {
    if (!VALID_BLOCKS.includes(block as CardBlockType)) {
      continue;
    }
    if (!unique.includes(block as CardBlockType)) {
      unique.push(block as CardBlockType);
    }
  }

  return unique.length > 0 ? unique : DEFAULT_BLOCKS;
}

function parseLayout(
  raw: string | null,
): Partial<Record<CardBlockType, CardLayoutSlot>> {
  const result: Partial<Record<CardBlockType, CardLayoutSlot>> = {};
  if (!raw) {
    return result;
  }

  const pairs = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const pair of pairs) {
    const [slot, block] = pair
      .split(":")
      .map((value) => value?.trim().toLowerCase());
    if (!slot || !block) {
      continue;
    }
    if (!VALID_LAYOUT_SLOTS.includes(slot as CardLayoutSlot)) {
      continue;
    }
    if (!VALID_BLOCKS.includes(block as CardBlockType)) {
      continue;
    }
    result[block as CardBlockType] = slot as CardLayoutSlot;
  }

  return result;
}

export function parseCardQueryParams(
  searchParams: URLSearchParams,
): CardRenderOptions {
  const format = searchParams.get("format") === "svg" ? "svg" : "png";
  const theme = searchParams.get("theme") === "dark" ? "dark" : "light";
  const cols = searchParams.get("cols") === "2" ? 2 : 1;
  const blocks = parseBlocks(searchParams.get("blocks"));
  const layout = parseLayout(searchParams.get("layout"));
  const hide = new Set(toList(searchParams.get("hide")));
  const width = parseWidth(searchParams.get("width"));

  return {
    format,
    theme,
    blocks,
    cols,
    layout,
    hide,
    width,
  };
}

export function resolveBlockLayout(options: CardRenderOptions): {
  full: CardBlockType[];
  left: CardBlockType[];
  right: CardBlockType[];
} {
  const full: CardBlockType[] = [];
  const left: CardBlockType[] = [];
  const right: CardBlockType[] = [];
  const assigned = new Set<CardBlockType>();

  for (const block of options.blocks) {
    const slot = options.layout[block];
    if (!slot) {
      continue;
    }
    assigned.add(block);
    if (options.cols === 1) {
      full.push(block);
      continue;
    }
    if (slot === "left") {
      left.push(block);
    } else if (slot === "right") {
      right.push(block);
    } else {
      full.push(block);
    }
  }

  const remaining = options.blocks.filter((block) => !assigned.has(block));
  if (options.cols === 1) {
    full.push(...remaining);
  } else {
    for (const block of remaining) {
      if (left.length <= right.length) {
        left.push(block);
      } else {
        right.push(block);
      }
    }
  }

  return { full, left, right };
}

function estimateHeight(
  options: CardRenderOptions,
  layout: {
    full: CardBlockType[];
    left: CardBlockType[];
    right: CardBlockType[];
  },
): number {
  const base = 130;
  const rowHeight = 95;
  if (options.cols === 1) {
    return Math.min(900, Math.max(300, base + layout.full.length * rowHeight));
  }
  const rows =
    layout.full.length + Math.max(layout.left.length, layout.right.length);
  return Math.min(900, Math.max(320, base + rows * rowHeight));
}

function levelColor(
  count: number,
  maxCount: number,
  theme: ThemePalette,
): string {
  if (count <= 0 || maxCount <= 0) {
    return theme.border;
  }
  const ratio = count / maxCount;
  if (ratio < 0.25) return "#86efac";
  if (ratio < 0.5) return "#4ade80";
  if (ratio < 0.75) return "#22c55e";
  return "#15803d";
}

function createBlock(
  block: CardBlockType,
  data: CardData,
  theme: ThemePalette,
  hide: Set<string>,
): ReactElement {
  if (block === "bio") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 14,
          alignItems: "center",
        }}
      >
        <img
          src={data.profile.avatarUrl}
          width={58}
          height={58}
          style={{ borderRadius: 999, border: `2px solid ${theme.border}` }}
          alt="avatar"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ color: theme.text, fontSize: 22, fontWeight: 700 }}>
            {data.profile.name}
          </div>
          <div style={{ color: theme.subtext, fontSize: 14 }}>
            @{data.profile.login}
          </div>
          {data.profile.bio ? (
            <div style={{ color: theme.subtext, fontSize: 13, maxWidth: 470 }}>
              {data.profile.bio.length > 110
                ? `${data.profile.bio.slice(0, 110)}...`
                : data.profile.bio}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block === "stats") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>
          Stats
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 14,
            color: theme.subtext,
            fontSize: 14,
          }}
        >
          <div>Followers: {data.profile.followers.toLocaleString()}</div>
          <div>Following: {data.profile.following.toLocaleString()}</div>
          <div>Repos: {data.profile.publicRepos.toLocaleString()}</div>
          {!hide.has("stars") ? (
            <div>Stars: {data.totalStars.toLocaleString()}</div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block === "langs") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>
          Top Languages
        </div>
        {data.languages.slice(0, 4).map((lang) => (
          <div
            key={lang.name}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              fontSize: 13,
              color: theme.subtext,
            }}
          >
            <span>{lang.name}</span>
            <span>{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }

  if (block === "repos") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>
          Top Repositories
        </div>
        {data.repos.slice(0, 3).map((repo) => (
          <div
            key={repo.name}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              fontSize: 13,
              color: theme.subtext,
            }}
          >
            <span>{repo.name}</span>
            <span>
              {!hide.has("stars") ? `★${repo.stars}` : ""}
              {!hide.has("stars") && !hide.has("forks") ? " / " : ""}
              {!hide.has("forks") ? `⑂${repo.forks}` : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (block === "streak") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>
          Streak
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 16,
            color: theme.subtext,
            fontSize: 13,
          }}
        >
          <span>Current: {data.streak.current} days</span>
          <span>Longest: {data.streak.longest} days</span>
        </div>
      </div>
    );
  }

  const days = data.heatmap.days.slice(-42);
  const columns: Array<Array<{ date: string; count: number }>> = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>
        Heatmap
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
        {columns.map((column, colIndex) => (
          <div
            key={`col-${colIndex}`}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            {column.map((day) => (
              <div
                key={day.date}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: levelColor(
                    day.count,
                    data.heatmap.maxCount,
                    theme,
                  ),
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function blockContainer(
  theme: ThemePalette,
  child: ReactElement,
): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        backgroundColor: theme.panel,
        padding: "14px 16px",
      }}
    >
      {child}
    </div>
  );
}

function cardTree(
  data: CardData,
  options: CardRenderOptions,
  height: number,
): ReactElement {
  const theme = themes[options.theme];
  const layout = resolveBlockLayout(options);

  const fullBlocks = layout.full.map((block) =>
    blockContainer(theme, createBlock(block, data, theme, options.hide)),
  );
  const leftBlocks = layout.left.map((block) =>
    blockContainer(theme, createBlock(block, data, theme, options.hide)),
  );
  const rightBlocks = layout.right.map((block) =>
    blockContainer(theme, createBlock(block, data, theme, options.hide)),
  );

  return (
    <div
      style={{
        width: options.width,
        height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.bg,
        padding: "18px",
        gap: "12px",
        color: theme.text,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700 }}>
          {data.profile.login}
        </div>
        <div style={{ fontSize: 12, color: theme.subtext }}>
          github-user-summary
        </div>
      </div>

      {fullBlocks.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fullBlocks}
        </div>
      ) : null}

      {options.cols === 2 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 10,
            }}
          >
            {leftBlocks}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 10,
            }}
          >
            {rightBlocks}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function errorTree(
  message: string,
  options: CardRenderOptions,
  height: number,
): ReactElement {
  const theme = themes[options.theme];
  return (
    <div
      style={{
        width: options.width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: theme.bg,
        border: `2px solid ${theme.border}`,
        color: theme.text,
        fontSize: 20,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700 }}>{message}</div>
      <div style={{ fontSize: 13, color: theme.subtext }}>
        github-user-summary card endpoint
      </div>
    </div>
  );
}

async function renderSvg(
  element: ReactElement,
  width: number,
  height: number,
  fontUrl?: string,
): Promise<string> {
  const fontData = await getFontData(fontUrl);
  return satori(element, {
    width,
    height,
    fonts: [
      {
        name: "Noto Sans",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });
}

export async function renderCardResponse(args: {
  data: CardData;
  options: CardRenderOptions;
  cacheControl: string;
  fontUrl?: string;
}): Promise<Response> {
  const layout = resolveBlockLayout(args.options);
  const height = estimateHeight(args.options, layout);
  const element = cardTree(args.data, args.options, height);

  if (args.options.format === "svg") {
    const svg = await renderSvg(
      element,
      args.options.width,
      height,
      args.fontUrl,
    );
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": args.cacheControl,
      },
    });
  }

  return new ImageResponse(element, {
    width: args.options.width,
    height,
    headers: {
      "Cache-Control": args.cacheControl,
    },
  });
}

export async function renderErrorCardResponse(args: {
  message: string;
  options: CardRenderOptions;
  status: number;
  cacheControl: string;
  fontUrl?: string;
}): Promise<Response> {
  const height = 260;
  const element = errorTree(args.message, args.options, height);

  if (args.options.format === "svg") {
    const svg = await renderSvg(
      element,
      args.options.width,
      height,
      args.fontUrl,
    );
    return new Response(svg, {
      status: args.status,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": args.cacheControl,
      },
    });
  }

  return new ImageResponse(element, {
    width: args.options.width,
    height,
    status: args.status,
    headers: {
      "Cache-Control": args.cacheControl,
    },
  });
}
