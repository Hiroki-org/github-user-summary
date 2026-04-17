// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import DashboardBusinessCardPreview from "../DashboardBusinessCardPreview";
import "@testing-library/jest-dom";
import type { UserSummary, CardLayout, CardDisplayOptions } from "@/lib/types";
import { loadCardSettings } from "@/lib/cardSettings";

vi.mock("@/lib/cardSettings", () => ({
  loadCardSettings: vi.fn(),
}));

vi.mock("@/components/BusinessCard", () => ({
  default: ({ summary, layout, options }: { summary: UserSummary, layout: CardLayout, options: CardDisplayOptions }) => (
    <div data-testid="mock-business-card">
      <span data-testid="summary">{summary.profile?.login}</span>
      <span data-testid="layout">{(layout as unknown as { type: string }).type}</span>
      <span data-testid="options">{(options as unknown as { mockOption: boolean }).mockOption ? "true" : "false"}</span>
    </div>
  ),
}));

describe("DashboardBusinessCardPreview", () => {
  const mockSummary = {
    profile: {
      login: "testuser",
    },
  } as unknown as UserSummary;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadCardSettings).mockReturnValue({
      layout: { type: "mockLayout" } as unknown as CardLayout,
      options: { mockOption: true } as unknown as CardDisplayOptions,
    });
  });

  it("renders the container with correct classes and styles", () => {
    render(<DashboardBusinessCardPreview summary={mockSummary} />);

    const wrapper = screen.getByTestId("mock-business-card").closest("div.overflow-hidden");
    expect(wrapper).toHaveClass("overflow-hidden rounded-xl border border-card-border bg-card-bg p-4");

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
