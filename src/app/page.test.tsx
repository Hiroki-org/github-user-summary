/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HomePage from "./page";
import * as React from "react";

// Mock the SearchForm component
vi.mock("@/components/SearchForm", () => {
  return {
    default: () => <div data-testid="mock-search-form">SearchForm Mock</div>,
  };
});

describe("HomePage", () => {
  it("renders the main heading correctly", () => {
    render(<HomePage />);
    expect(screen.getByText("Unlock Your")).toBeDefined();
    expect(screen.getByText("GitHub Profile")).toBeDefined();
  });

  it("renders the description text", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Explore user profiles, visualize contributions/i)
    ).toBeDefined();
  });

  it("renders the SearchForm component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("mock-search-form")).toBeDefined();
  });

  it("renders the sign in instruction text", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Sign in with GitHub to access detailed insights/i)
    ).toBeDefined();
  });

  it("renders the footer correctly", () => {
    render(<HomePage />);
    expect(screen.getByText(/Built with Next.js & GitHub API/i)).toBeDefined();
  });
});
