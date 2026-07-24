// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardSettingsPage from "./page";

vi.mock("@/components/DashboardSettingsClient", () => ({
  default: () => <div data-testid="dashboard-settings-client">Mocked Client Component</div>,
}));

describe("DashboardSettingsPage", () => {
  it("renders the DashboardSettingsClient component", () => {
    render(<DashboardSettingsPage />);
    expect(screen.getByTestId("dashboard-settings-client")).toBeInTheDocument();
  });
});
