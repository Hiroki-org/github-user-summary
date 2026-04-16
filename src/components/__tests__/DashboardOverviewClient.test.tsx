import { UserSummary } from "@/lib/types";
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardOverviewClient from "../DashboardOverviewClient";
import { useDashboardData } from "@/hooks/useDashboardData";

// Mock the hook
vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: vi.fn(),
}));

// Mock the nested component to keep the test focused
vi.mock("@/components/DashboardBusinessCardPreview", () => ({
  default: () => <div data-testid="business-card-preview" />,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("DashboardOverviewClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state when isLoading is true", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: true,
      summary: undefined,
      username: undefined,
      error: undefined,
      mutate: vi.fn(),
      session: null,
      status: "loading",
    });

    render(<DashboardOverviewClient />);
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("renders error state when there is an error", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      summary: undefined,
      username: undefined,
      error: new Error("Test error"),
      mutate: vi.fn(),
      session: null,
      status: "unauthenticated",
    });

    render(<DashboardOverviewClient />);
    expect(screen.getByText("Failed to load dashboard data.")).toBeInTheDocument();
  });

  it("renders error state when summary is missing", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      summary: undefined,
      username: "testuser",
      error: undefined,
      mutate: vi.fn(),
      session: null,
      status: "unauthenticated",
    });

    render(<DashboardOverviewClient />);
    expect(screen.getByText("Failed to load dashboard data.")).toBeInTheDocument();
  });

  it("renders success state with correct username and summary", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      summary: { profile: { name: "Test User" } } as unknown as UserSummary,
      username: "testuser",
      error: undefined,
      mutate: vi.fn(),
      session: null,
      status: "authenticated",
    });

    render(<DashboardOverviewClient />);
    expect(screen.getByText("Welcome back, Test User")).toBeInTheDocument();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    expect(screen.getByTestId("business-card-preview")).toBeInTheDocument();
  });
});
