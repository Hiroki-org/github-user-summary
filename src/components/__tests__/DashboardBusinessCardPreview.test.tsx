// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardBusinessCardPreview from "../DashboardBusinessCardPreview";
import "@testing-library/jest-dom";
import type { UserSummary, CardLayout, CardDisplayOptions } from "@/lib/types";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(() => ({
    layout: { type: "mockLayout" },
    options: { mockOption: true },
  })),
}));

vi.mock("@/components/BusinessCard", () => ({
  default: ({ summary, layout, options }: { summary: UserSummary, layout: CardLayout, options: CardDisplayOptions & { mockOption?: boolean } }) => (
    <div data-testid="mock-business-card">
      <span data-testid="summary">{summary.profile?.login}</span>
      <span data-testid="layout">{(layout as unknown as { type: string }).type}</span>
      <span data-testid="options">{options.mockOption ? "true" : "false"}</span>
    </div>
  ),
}));

describe("DashboardBusinessCardPreview", () => {
  const mockSummary = {
    profile: {
      login: "testuser",
    },
  } as unknown as UserSummary;

  it("renders the container with correct classes and styles", () => {
    render(<DashboardBusinessCardPreview summary={mockSummary} />);

    // Check main container wrapper
    const wrapper = screen.getByTestId("mock-business-card").parentElement?.parentElement;
    expect(wrapper).toHaveClass("overflow-hidden rounded-xl border border-card-border bg-card-bg p-4");

    // Check the scaled inner container
    const scaledContainer = screen.getByTestId("mock-business-card").parentElement;
    expect(scaledContainer).toHaveClass("origin-top-left scale-[0.25]");
    expect(scaledContainer).toHaveStyle({ width: "1200px", height: "630px" });
  });

  it("passes correct props to BusinessCard", () => {
    render(<DashboardBusinessCardPreview summary={mockSummary} />);

    expect(screen.getByTestId("summary")).toHaveTextContent("testuser");
    expect(screen.getByTestId("layout")).toHaveTextContent("mockLayout");
    expect(screen.getByTestId("options")).toHaveTextContent("true");
  });
});
