// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardSettingsPage from "@/app/dashboard/settings/page";

// Mock the Client component so we don't need to mount the whole React tree
vi.mock("@/components/DashboardSettingsClient", () => ({
  default: () => <div data-testid="dashboard-settings-client">Mocked Settings Client</div>,
}));

describe("DashboardSettingsPage", () => {
  it("renders the DashboardSettingsClient component", () => {
    render(<DashboardSettingsPage />);
    expect(screen.getByTestId("dashboard-settings-client")).toBeInTheDocument();
  });
});
