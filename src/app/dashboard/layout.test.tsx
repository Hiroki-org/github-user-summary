// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "./layout";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Session } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid="mock-image" />
  ),
}));

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to '/' if session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    await expect(DashboardLayout({ children: <div>Test Content</div> })).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to '/' if session has no accessToken", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "Test User", email: "test@example.com" },
    } as unknown as Session);

    await expect(DashboardLayout({ children: <div>Test Content</div> })).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders layout correctly when authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      accessToken: "mock-token",
      user: { name: "Test User", email: "test@example.com", image: "https://example.com/image.png" },
    } as unknown as Session);

    render(await DashboardLayout({ children: <div data-testid="test-child">Test Content</div> }));

    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByTestId("mock-image")).toHaveAttribute("src", "https://example.com/image.png");
    expect(screen.getByTestId("test-child")).toBeInTheDocument();

    // Check navigation links
    expect(screen.getByText("Overview")).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Year")).toHaveAttribute("href", "/dashboard/year");
    expect(screen.getByText("Stats")).toHaveAttribute("href", "/dashboard/stats");
    expect(screen.getByText("Settings")).toHaveAttribute("href", "/dashboard/settings");
  });

  it("falls back to email if user name is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      accessToken: "mock-token",
      user: { email: "test@example.com", image: "https://example.com/image.png" },
    } as unknown as Session);

    render(await DashboardLayout({ children: <div data-testid="test-child">Test Content</div> }));

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });
});
