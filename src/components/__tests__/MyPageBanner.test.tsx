// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import MyPageBanner from "../MyPageBanner";
import { useSession } from "next-auth/react";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

describe("MyPageBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when status is unauthenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { container } = render(<MyPageBanner username="testuser" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when status is loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { container } = render(<MyPageBanner username="testuser" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when user login is missing", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: {} },
      status: "authenticated",
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { container } = render(<MyPageBanner username="testuser" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when viewer does not match username", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { login: "otheruser" } },
      status: "authenticated",
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { container } = render(<MyPageBanner username="testuser" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the banner when viewer matches username exactly", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { login: "testuser" } },
      status: "authenticated",
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<MyPageBanner username="testuser" />);

    expect(screen.getByText(/This is your profile/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Go to My Dashboard/i })).toHaveAttribute("href", "/dashboard");
  });

  it("renders the banner when viewer matches username case-insensitively", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { login: "TestUser" } },
      status: "authenticated",
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<MyPageBanner username="tEsTuSeR" />);

    expect(screen.getByText(/This is your profile/i)).toBeInTheDocument();
  });
});
