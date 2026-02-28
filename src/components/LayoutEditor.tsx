"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { CardBlock, CardBlockId, CardLayout } from "@/lib/types";
import { moveBlock } from "@/lib/cardLayout";

type Props = {
  layout: CardLayout;
  onLayoutChange: (layout: CardLayout) => void;
  onToggleBlockVisibility: (blockId: CardBlockId) => void;
};

const CONTAINERS: CardBlock["column"][] = ["left", "right", "full"];

const BLOCK_LABELS: Record<CardBlockId, string> = {
  avatar: "アバター",
  bio: "Bio",
  stats: "統計情報",
  topLanguages: "トップ言語",
  topRepos: "トップリポジトリ",
};

const CONTAINER_LABELS: Record<CardBlock["column"], string> = {
  left: "左カラム",
  right: "右カラム",
  full: "フルワイド",
};

function toTransformStyle(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!transform) {
    return undefined;
  }
  return `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`;
}

function getBlocksByColumn(
  layout: CardLayout,
  column: CardBlock["column"],
): CardBlock[] {
  return layout.blocks.filter((block) => block.column === column);
}

function findBlock(layout: CardLayout, id: string): CardBlock | undefined {
  return layout.blocks.find((block) => block.id === id);
}

function getInsertIndex(
  layout: CardLayout,
  activeId: CardBlockId,
  overId: string,
): { column: CardBlock["column"]; index: number } | null {
  if (CONTAINERS.includes(overId as CardBlock["column"])) {
    const column = overId as CardBlock["column"];
    const items = getBlocksByColumn(layout, column).filter(
      (block) => block.id !== activeId,
    );
    return { column, index: items.length };
  }

  const overBlock = findBlock(layout, overId);
  if (!overBlock) {
    return null;
  }

  const columnItems = getBlocksByColumn(layout, overBlock.column).filter(
    (block) => block.id !== activeId,
  );
  const index = columnItems.findIndex((block) => block.id === overBlock.id);

  return {
    column: overBlock.column,
    index: index >= 0 ? index : columnItems.length,
  };
}

function SortableBlock({
  block,
  onToggle,
}: {
  block: CardBlock;
  onToggle: (id: CardBlockId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: toTransformStyle(transform),
        transition,
      }}
      className={`rounded-md border border-card-border bg-background p-3 ${isDragging ? "opacity-60" : "opacity-100"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="cursor-grab text-sm font-medium text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          {BLOCK_LABELS[block.id]}
        </button>
        <label className="flex items-center gap-2 text-xs text-muted">
          表示
          <input
            type="checkbox"
            checked={block.visible}
            onChange={() => onToggle(block.id)}
            className="rounded border-card-border bg-background text-accent focus:ring-accent"
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-muted">ID: {block.id}</p>
    </div>
  );
}

function ColumnDropZone({
  column,
  blocks,
  onToggle,
}: {
  column: CardBlock["column"];
  blocks: CardBlock[];
  onToggle: (id: CardBlockId) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  });

  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-sm font-semibold text-foreground">
        {CONTAINER_LABELS[column]}
      </h4>
      <div
        ref={setNodeRef}
        className={`min-h-28 space-y-2 rounded-lg border border-dashed p-3 ${isOver ? "border-accent bg-accent/5" : "border-card-border"}`}
      >
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <SortableBlock key={block.id} block={block} onToggle={onToggle} />
          ))}
        </SortableContext>
        {blocks.length === 0 && (
          <p className="text-xs text-muted">ここにドロップ</p>
        )}
      </div>
    </div>
  );
}

export default function LayoutEditor({
  layout,
  onLayoutChange,
  onToggleBlockVisibility,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id) as CardBlockId;
    const next = getInsertIndex(layout, activeId, String(over.id));
    if (!next) {
      return;
    }

    onLayoutChange(moveBlock(layout, activeId, next.column, next.index));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {CONTAINERS.map((column) => (
          <ColumnDropZone
            key={column}
            column={column}
            blocks={getBlocksByColumn(layout, column)}
            onToggle={onToggleBlockVisibility}
          />
        ))}
      </div>
    </DndContext>
  );
}
