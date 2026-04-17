// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import Header from "../Header";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/components/LoginButton", () => ({
  default: () => <div data-testid="login-button">Login</div>,
}));

describe("Header", () => {
  it("renders correctly", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByText("GitHub User Summary")).toBeInTheDocument();
    expect(screen.getByTestId("login-button")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Year in Review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Stats" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("highlights the active link correctly (exact match)", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Header />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    const homeLink = screen.getByRole("link", { name: "Home" });

    expect(dashboardLink).toHaveClass("text-accent");
    expect(homeLink).toHaveClass("text-muted");
  });

  it("highlights the active link correctly (subpath match)", () => {
    mockUsePathname.mockReturnValue("/dashboard/year");
    render(<Header />);

    const yearLink = screen.getByRole("link", { name: "Year in Review" });
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });

    expect(yearLink).toHaveClass("text-accent");
    expect(dashboardLink).toHaveClass("text-accent"); // isActive returns true for startWith match
  });

  it("handles root path active logic correctly", () => {
    mockUsePathname.mockReturnValue("/some-other-path");
    render(<Header />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveClass("text-muted");
    expect(homeLink).not.toHaveClass("text-accent");
  });
});
