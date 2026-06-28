/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvatarBlock } from "../../BusinessCardBlocks/AvatarBlock";

describe("AvatarBlock", () => {
  it("renders correctly with full profile", () => {
    const profile = {
      login: "testuser",
      name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
    } as any;

    render(<AvatarBlock profile={profile as any} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();

    const img = screen.getByAltText("testuser");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders correctly with missing name", () => {
    const profile = {
      login: "testuser2",
      name: null,
      avatar_url: "https://example.com/avatar2.jpg",
    } as any;

    render(<AvatarBlock profile={profile as any} />);
    expect(screen.getByText("testuser2")).toBeInTheDocument();
    expect(screen.getByText("@testuser2")).toBeInTheDocument();
  });
});
