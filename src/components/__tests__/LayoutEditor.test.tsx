import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LayoutEditor from "../LayoutEditor";
import { CardLayout } from "@/lib/types";
import "@testing-library/jest-dom";

// Mock dnd-kit components
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: unknown) => void }) => (
      <div data-testid="dnd-context" onClick={() => {
        // Expose a way to trigger onDragEnd via a synthetic event or global for testing
        // We'll attach it to window for easy triggering
        (window as unknown as { triggerDragEnd: (event: unknown) => void }).triggerDragEnd = onDragEnd;
      }}>
        {children}
      </div>
    ),
    useSensors: vi.fn(() => []),
    useSensor: vi.fn(() => ({})),
    useDroppable: () => ({
      setNodeRef: vi.fn(),
      isOver: false,
    }),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    closestCenter: vi.fn(),
  };
});

vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSortable: ({ id }: { id: string }) => ({
      attributes: { "data-id": id },
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
    sortableKeyboardCoordinates: vi.fn(),
    verticalListSortingStrategy: vi.fn(),
  };
});

const defaultLayout: CardLayout = {
  blocks: [
    { id: "profile", visible: true, column: "full" },
    { id: "avatar", visible: true, column: "left" },
    { id: "topLanguages", visible: false, column: "right" },
  ],
};

describe("LayoutEditor", () => {
  let mockOnLayoutChange: ReturnType<typeof vi.fn>; // @ts-expect-error TS does not know it is mocked
  let mockOnToggleVisibility: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLayoutChange = vi.fn();
    mockOnToggleVisibility = vi.fn();
    (window as unknown as { triggerDragEnd?: (event: unknown) => void }).triggerDragEnd = undefined;
  });

  it("renders blocks in their respective columns", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    // Full Width should have Profile
    expect(screen.getByText("Profile Card")).toBeInTheDocument();

    // Left Column should have Avatar
    expect(screen.getByText("Avatar")).toBeInTheDocument();

    // Right Column should have Top Languages
    expect(screen.getByText("Top Languages")).toBeInTheDocument();
  });

  it("calls onToggleBlockVisibility when a checkbox is clicked", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    // Get the checkbox for the avatar block

    // Find the Avatar block and click its checkbox
    const avatarBlock = screen.getByText("Avatar").closest("div[class*='rounded-md border']") as HTMLElement;
    const checkbox = avatarBlock.querySelector("input[type='checkbox']") as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(mockOnToggleVisibility).toHaveBeenCalledWith("avatar");
  });

  it("calls onLayoutChange when dragging a block over another column", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    // Ensure DndContext registered the handler on window
    const dndContext = screen.getByTestId("dnd-context");
    fireEvent.click(dndContext);

    const triggerDragEnd = (window as unknown as { triggerDragEnd: (event: unknown) => void }).triggerDragEnd;
    expect(triggerDragEnd).toBeDefined();

    // Drag 'avatar' to 'right' column
    triggerDragEnd({
      active: { id: "avatar" },
      over: { id: "right" },
    });

    expect(mockOnLayoutChange).toHaveBeenCalled();
    const newLayout = mockOnLayoutChange.mock.calls[0][0] as CardLayout;

    // Avatar should now be in the 'right' column
    const avatarBlock = newLayout.blocks.find(b => b.id === "avatar");
    expect(avatarBlock?.column).toBe("right");
  });

  it("calls onLayoutChange when dragging a block over another block", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    const dndContext = screen.getByTestId("dnd-context");
    fireEvent.click(dndContext);

    const triggerDragEnd = (window as unknown as { triggerDragEnd: (event: unknown) => void }).triggerDragEnd;

    // Drag 'avatar' over 'topLanguages'
    triggerDragEnd({
      active: { id: "avatar" },
      over: { id: "topLanguages" },
    });

    expect(mockOnLayoutChange).toHaveBeenCalled();
    const newLayout = mockOnLayoutChange.mock.calls[0][0] as CardLayout;

    // Avatar should now be in the 'right' column because topLanguages is in 'right'
    const avatarBlock = newLayout.blocks.find(b => b.id === "avatar");
    expect(avatarBlock?.column).toBe("right");
  });

  it("does not call onLayoutChange if over is null", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    const dndContext = screen.getByTestId("dnd-context");
    fireEvent.click(dndContext);

    const triggerDragEnd = (window as unknown as { triggerDragEnd: (event: unknown) => void }).triggerDragEnd;
    triggerDragEnd({
      active: { id: "avatar" },
      over: null,
    });

    expect(mockOnLayoutChange).not.toHaveBeenCalled();
  });

  it("does not call onLayoutChange if active id is same as over id", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    const dndContext = screen.getByTestId("dnd-context");
    fireEvent.click(dndContext);

    const triggerDragEnd = (window as unknown as { triggerDragEnd: (event: unknown) => void }).triggerDragEnd;
    triggerDragEnd({
      active: { id: "avatar" },
      over: { id: "avatar" },
    });

    expect(mockOnLayoutChange).not.toHaveBeenCalled();
  });

  it("does not call onLayoutChange if over block is not found", () => {
    render(
      <LayoutEditor
        layout={defaultLayout}
        onLayoutChange={mockOnLayoutChange as unknown as (layout: CardLayout) => void}
        onToggleBlockVisibility={mockOnToggleVisibility as unknown as (blockId: string) => void}
      />
    );

    const dndContext = screen.getByTestId("dnd-context");
    fireEvent.click(dndContext);

    const triggerDragEnd = (window as unknown as { triggerDragEnd: (event: unknown) => void }).triggerDragEnd;
    triggerDragEnd({
      active: { id: "avatar" },
      over: { id: "non-existent-block" },
    });

    expect(mockOnLayoutChange).not.toHaveBeenCalled();
  });
});
