import type { ReactElement } from "react";
import type { CardData } from "@/lib/cardDataFetcher";
import type {
  CardBlockType,
  CardRenderOptions,
  CardTheme,
} from "./cardOptions";
import { resolveBlockLayout } from "./cardOptions";

export type ThemePalette = {
  bg: string;
  panel: string;
  text: string;
  subtext: string;
  accent: string;
  border: string;
  success: string;
};

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

export function estimateHeight(
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

export function levelColor(
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

function createBioBlock(data: CardData, theme: ThemePalette): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 14,
        alignItems: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
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

function createStatsBlock(
  data: CardData,
  theme: ThemePalette,
  hide: Set<string>,
): ReactElement {
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

function createLanguagesBlock(
  data: CardData,
  theme: ThemePalette,
): ReactElement {
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

function createReposBlock(
  data: CardData,
  theme: ThemePalette,
  hide: Set<string>,
): ReactElement {
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

function createStreakBlock(
  data: CardData,
  theme: ThemePalette,
): ReactElement {
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

function createHeatmapBlock(
  data: CardData,
  theme: ThemePalette,
): ReactElement {
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

export function createBlock(
  block: CardBlockType,
  data: CardData,
  theme: ThemePalette,
  hide: Set<string>,
): ReactElement {
  switch (block) {
    case "bio":
      return createBioBlock(data, theme);
    case "stats":
      return createStatsBlock(data, theme, hide);
    case "langs":
      return createLanguagesBlock(data, theme);
    case "repos":
      return createReposBlock(data, theme, hide);
    case "streak":
      return createStreakBlock(data, theme);
    case "heatmap":
      return createHeatmapBlock(data, theme);
  }
}

export function blockContainer(
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

export function cardTree(
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

export function errorTree(
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
