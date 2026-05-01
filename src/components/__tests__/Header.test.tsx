// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Header from "../Header";
import "@testing-library/jest-dom";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock the LoginButton component to isolate Header tests
vi.mock("@/components/LoginButton", () => ({
  default: () => <div data-testid="login-button-mock">LoginButton Mock</div>,
}));

// Import the mocked hook to change its return value in tests
import { usePathname } from "next/navigation";

describe("Header", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the logo/title correctly", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Header />);

    const logoLink = screen.getByRole("link", { name: /GitHub User Summary/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders all navigation links", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Header />);

    const links = ["Home", "Dashboard", "Year in Review", "Stats", "Settings"];
    links.forEach((label) => {
      const link = screen.getByRole("link", { name: label });
      expect(link).toBeInTheDocument();
    });
  });

  it("applies active styles to Home link when pathname is '/'", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Header />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveClass("bg-accent/15");
    expect(homeLink).toHaveClass("text-accent");

    // Other links should not be active
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).not.toHaveClass("bg-accent/15");
    expect(dashboardLink).toHaveClass("text-muted");
  });

  it("applies active styles to Dashboard link when pathname is '/dashboard'", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<Header />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveClass("bg-accent/15");

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).not.toHaveClass("bg-accent/15");
  });

  it("applies active styles to parent Dashboard and exact child links when pathname is a sub-route", () => {
    // Testing /dashboard/year
    vi.mocked(usePathname).mockReturnValue("/dashboard/year");
    const { unmount } = render(<Header />);

    let dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveClass("bg-accent/15");

    const yearLink = screen.getByRole("link", { name: "Year in Review" });
    expect(yearLink).toHaveClass("bg-accent/15");

    let statsLink = screen.getByRole("link", { name: "Stats" });
    expect(statsLink).not.toHaveClass("bg-accent/15");

    unmount();

    // Testing /dashboard/stats
    vi.mocked(usePathname).mockReturnValue("/dashboard/stats");
    render(<Header />);

    // Since isActive logic uses pathname.startsWith(`${href}/`), /dashboard should be active
    dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveClass("bg-accent/15");

    statsLink = screen.getByRole("link", { name: "Stats" });
    expect(statsLink).toHaveClass("bg-accent/15");

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    expect(settingsLink).not.toHaveClass("bg-accent/15");
  });


  it("does not apply active styles to partial matches like '/dashboard-something'", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard-something");
    render(<Header />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).not.toHaveClass("bg-accent/15");
  });

  it("renders the LoginButton component", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Header />);

    expect(screen.getByTestId("login-button-mock")).toBeInTheDocument();
  });
});
