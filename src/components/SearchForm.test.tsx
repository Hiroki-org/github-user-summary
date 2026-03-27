/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SearchForm from "./SearchForm";
import * as React from "react";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Provide a mock implementation that we can spy on later
const useTransitionMock = vi.fn<() => [boolean, (cb: () => void) => void]>();

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useTransition: () => useTransitionMock(),
  };
});

describe("SearchForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTransitionMock.mockReturnValue([false, (cb: () => void) => cb()]);
  });

  it("renders the input and search button", () => {
    render(<SearchForm />);
    expect(screen.getByPlaceholderText("GitHub username")).toBeDefined();
    expect(screen.getByRole("button", { name: "Search" })).toBeDefined();
  });

  it("updates input value when typing", () => {
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("GitHub username") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "johndoe" } });
    expect(input.value).toBe("johndoe");
  });

  it("disables the search button when input is empty", () => {
    render(<SearchForm />);
    const button = screen.getByRole("button", { name: "Search" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("enables the search button when input has text", () => {
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("GitHub username");
    const button = screen.getByRole("button", { name: "Search" }) as HTMLButtonElement;

    fireEvent.change(input, { target: { value: "johndoe" } });
    expect(button.disabled).toBe(false);
  });

  it("calls router.push with the username on form submission", async () => {
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("GitHub username");
    const button = screen.getByRole("button", { name: "Search" });

    fireEvent.change(input, { target: { value: "johndoe" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/johndoe");
    });
  });

  it("trims the username and URI encodes it before submission", async () => {
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("GitHub username");
    const button = screen.getByRole("button", { name: "Search" });

    // Using a username with spaces and special characters
    fireEvent.change(input, { target: { value: "  john doe/test  " } });
    fireEvent.click(button);

    await waitFor(() => {
      // "john doe/test" encoded is "john%20doe%2Ftest"
      expect(pushMock).toHaveBeenCalledWith("/john%20doe%2Ftest");
    });
  });

  it("does not call router.push if input is only whitespace", () => {
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("GitHub username");

    fireEvent.change(input, { target: { value: "   " } });

    // The button should be disabled, but we can also trigger submit on the form directly
    // to ensure the internal check `if (trimmed)` works
    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables button and shows 'Loading...' when isPending is true", () => {
    // Mock useTransition to return [true, startTransition]
    useTransitionMock.mockReturnValue([
      true, // isPending
      vi.fn() as unknown as React.TransitionStartFunction, // startTransition
    ]);

    render(<SearchForm />);
    const button = screen.getByRole("button", { name: "Loading..." }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
