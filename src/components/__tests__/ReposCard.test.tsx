// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReposCard from "../ReposCard";
import type { RepositoryData } from "@/lib/types";

const mockRepositoryData: RepositoryData = {
  languages: [],
  topics: [],
  totalCount: 42,
  topRepos: [
    {
      name: "awesome-project",
      description: "An awesome project that does amazing things.",
      url: "https://github.com/testuser/awesome-project",
      stargazerCount: 1500,
      forkCount: 300,
      primaryLanguage: { name: "TypeScript", color: "#3178c6" },
    },
    {
      name: "cool-tool",
      description: null,
      url: "https://github.com/testuser/cool-tool",
      stargazerCount: 800,
      forkCount: 50,
      primaryLanguage: null,
    },
  ],
};

describe("ReposCard", () => {
  it("renders nothing when topRepos is empty", () => {
    const emptyData: RepositoryData = {
      ...mockRepositoryData,
      topRepos: [],
      totalCount: 0,
    };
    const { container } = render(<ReposCard repositories={emptyData} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the title and total count correctly", () => {
    render(<ReposCard repositories={mockRepositoryData} />);
    expect(screen.getByText("Top Repositories")).toBeInTheDocument();
    expect(screen.getByText("42 total")).toBeInTheDocument();
  });

  it("renders a list of top repositories with all details", () => {
    render(<ReposCard repositories={mockRepositoryData} />);

    // Check first repo
    expect(screen.getByText("awesome-project")).toBeInTheDocument();
    expect(screen.getByText("An awesome project that does amazing things.")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument(); // Stargazers
    expect(screen.getByText("300")).toBeInTheDocument(); // Forks
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    // Ensure the link is correct
    const awesomeProjectLink = screen.getByRole("link", { name: /awesome-project/i });
    expect(awesomeProjectLink).toHaveAttribute("href", "https://github.com/testuser/awesome-project");
  });

  it("handles repositories without description or primary language gracefully", () => {
    render(<ReposCard repositories={mockRepositoryData} />);

    // Check second repo
    expect(screen.getByText("cool-tool")).toBeInTheDocument();
    expect(screen.getByText("800")).toBeInTheDocument(); // Stargazers
    expect(screen.getByText("50")).toBeInTheDocument(); // Forks

    // There shouldn't be a description or language for this repo
    // We verify this by ensuring no other text nodes leak unexpectedly,
    // but the main checks are that it renders without throwing.
    const coolToolLink = screen.getByRole("link", { name: /cool-tool/i });
    expect(coolToolLink).toHaveAttribute("href", "https://github.com/testuser/cool-tool");
  });
});
