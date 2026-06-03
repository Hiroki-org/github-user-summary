// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

// Mock the Client component so we don't need to mount the whole React tree
vi.mock("@/components/DashboardOverviewClient", () => ({
  default: () => <div data-testid="dashboard-overview-client">Mocked Client Component</div>,
}));

describe("DashboardPage", () => {
  it("renders the DashboardOverviewClient component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard-overview-client")).toBeInTheDocument();
  });
});
