// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import LoginButton from "../LoginButton";
import "@testing-library/jest-dom";

// Mock next-auth/react
const mockUseSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("LoginButton", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders a loading skeleton when status is 'loading'", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });

    render(<LoginButton />);

    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders user information and a Sign out button when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          image: "https://example.com/avatar.jpg",
        },
      },
      status: "authenticated",
    });

    render(<LoginButton />);

    // Check if image is rendered correctly
    const avatar = screen.getByRole("img", { name: "Test User" });
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");

    // Check if name is rendered
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Check if Sign out button is rendered
    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    expect(signOutButton).toBeInTheDocument();
  });

  it("calls signOut when the Sign out button is clicked", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          image: "https://example.com/avatar.jpg",
        },
      },
      status: "authenticated",
    });

    render(<LoginButton />);

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    await userEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("renders 'Sign in with GitHub' button when unauthenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<LoginButton />);

    const signInButton = screen.getByRole("button", { name: /sign in with github/i });
    expect(signInButton).toBeInTheDocument();
  });

  it("calls signIn with 'github' provider when the Sign in button is clicked", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<LoginButton />);

    const signInButton = screen.getByRole("button", { name: /sign in with github/i });
    await userEvent.click(signInButton);

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith("github");
  });

  it("renders correctly with partial user data", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {}, // No name or image
      },
      status: "authenticated",
    });

    render(<LoginButton />);

    // Check if fallback image alt is handled
    const avatar = screen.getByRole("img", { name: "User" });
    expect(avatar).toBeInTheDocument();

    // Verify that src is not present (it should be undefined, not "")
    expect(avatar).not.toHaveAttribute("src");

    // Sign out button should still be present
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
