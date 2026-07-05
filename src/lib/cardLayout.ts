import type { CardBlock, CardBlockId, CardLayout } from "./types";
import { DEFAULT_CARD_LAYOUT } from "./types";

const BLOCK_ID_SET = new Set<CardBlockId>([
    ...DEFAULT_CARD_LAYOUT.blocks.map((block) => block.id),
]);

export function cloneDefaultCardLayout(): CardLayout {
    return {
        blocks: DEFAULT_CARD_LAYOUT.blocks.map((block) => ({ ...block })),
    };
}

export function normalizeCardLayout(input: unknown): CardLayout {
    if (!input || typeof input !== "object") {
        return cloneDefaultCardLayout();
    }

    const maybeBlocks = (input as { blocks?: unknown }).blocks;
    if (!Array.isArray(maybeBlocks)) {
        return cloneDefaultCardLayout();
    }

    const defaultMap = new Map<CardBlockId, CardBlock>(
        DEFAULT_CARD_LAYOUT.blocks.map((block) => [block.id, block])
    );

    const blocks: CardBlock[] = [];
    const seen = new Set<CardBlockId>();

    for (const item of maybeBlocks) {
        if (!item || typeof item !== "object") {
            continue;
        }

        const block = item as Partial<CardBlock>;
        if (!block.id || !BLOCK_ID_SET.has(block.id as CardBlockId)) {
            continue;
        }

        const id = block.id as CardBlockId;
        if (seen.has(id)) {
            continue;
        }

        const fallback = defaultMap.get(id)!;
        const column =
            block.column === "left" || block.column === "right" || block.column === "full"
                ? block.column
                : fallback.column;

        blocks.push({
            id,
            visible: typeof block.visible === "boolean" ? block.visible : fallback.visible,
            column,
        });
        seen.add(id);
    }

    for (const fallback of DEFAULT_CARD_LAYOUT.blocks) {
        if (!seen.has(fallback.id)) {
            blocks.push({ ...fallback });
        }
    }

    return { blocks };
}

export function toggleBlockVisibility(layout: CardLayout, blockId: CardBlockId): CardLayout {
    return {
        ...layout,
        blocks: layout.blocks.map((block) =>
            block.id === blockId ? { ...block, visible: !block.visible } : block
        ),
    };
}

export function moveBlock(layout: CardLayout, blockId: CardBlockId, targetColumn: CardBlock["column"], targetIndex: number): CardLayout {
    const grouped: Record<CardBlock["column"], CardBlock[]> = {
        left: [],
        right: [],
        full: [],
    };

    let moving: CardBlock | null = null;
    for (const block of layout.blocks) {
        if (block.id === blockId) {
            moving = { ...block, column: targetColumn };
            continue;
        }
        grouped[block.column].push({ ...block });
    }

    if (!moving) {
        return layout;
    }

    const clamped = Math.max(0, Math.min(targetIndex, grouped[targetColumn].length));
    grouped[targetColumn].splice(clamped, 0, moving);

    return {
        blocks: [...grouped.left, ...grouped.right, ...grouped.full],
    };
}
