// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardBusinessCardPreview from "../DashboardBusinessCardPreview";
import "@testing-library/jest-dom";
import type { UserSummary, CardLayout, CardDisplayOptions } from "@/lib/types";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(() => ({
    layout: {
      blocks: [{ id: "profile", visible: true, column: "full" }],
    },
    options: { showAvatar: true },
  })),
}));

vi.mock("@/components/BusinessCard", () => ({
  default: ({ summary, layout, options }: { summary: UserSummary; layout: CardLayout; options: CardDisplayOptions }) => (
    <div data-testid="mock-business-card">
      <span data-testid="summary">{summary.profile?.login}</span>
      <span data-testid="layout">{layout.blocks[0]?.id}</span>
      <span data-testid="options">{options.showAvatar ? "true" : "false"}</span>
    </div>
  ),
}));

describe("DashboardBusinessCardPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSummary = {
    profile: {
      login: "testuser",
    },
  } as unknown as UserSummary;

  it("renders the container with correct classes and styles", () => {
    const { container } = render(<DashboardBusinessCardPreview summary={mockSummary} />);

    // Check main container wrapper
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("overflow-hidden rounded-xl border border-card-border bg-card-bg p-4");

    // Check the scaled inner container
    const scaledContainer = wrapper.firstElementChild as HTMLElement;
    expect(scaledContainer).toHaveClass("origin-top-left scale-[0.25]");
    expect(scaledContainer).toHaveStyle({ width: "1200px", height: "630px" });
  });

  it("passes correct props to BusinessCard", () => {
    render(<DashboardBusinessCardPreview summary={mockSummary} />);

    expect(screen.getByTestId("summary")).toHaveTextContent("testuser");
    expect(screen.getByTestId("layout")).toHaveTextContent("profile");
    expect(screen.getByTestId("options")).toHaveTextContent("true");
  });
});
