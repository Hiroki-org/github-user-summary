export type CardFormat = "png" | "svg";
export type CardTheme = "light" | "dark";
export type CardBlockType =
  | "bio"
  | "stats"
  | "langs"
  | "repos"
  | "streak"
  | "heatmap";
type CardLayoutSlot = "left" | "right" | "full";

export type CardRenderOptions = {
  format: CardFormat;
  theme: CardTheme;
  blocks: CardBlockType[];
  cols: 1 | 2;
  layout: Partial<Record<CardBlockType, CardLayoutSlot>>;
  hide: Set<string>;
  width: number;
};

export const DEFAULT_BLOCKS: CardBlockType[] = ["bio", "stats", "langs"];
export const VALID_BLOCKS: CardBlockType[] = [
  "bio",
  "stats",
  "langs",
  "repos",
  "streak",
  "heatmap",
];
export const VALID_LAYOUT_SLOTS: CardLayoutSlot[] = ["left", "right", "full"];

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

  const unique = Array.from(new Set(requested)).filter(
    (block): block is CardBlockType =>
      VALID_BLOCKS.includes(block as CardBlockType),
  );

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
