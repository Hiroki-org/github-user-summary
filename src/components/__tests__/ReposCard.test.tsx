// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import ReposCard from "../ReposCard";
import type { RepositoryData } from "@/lib/types";

describe("ReposCard", () => {
  const emptyMockData: RepositoryData = {
    languages: [],
    topics: [],
    topRepos: [],
    totalCount: 0,
  };

  const populatedMockData: RepositoryData = {
    languages: [],
    topics: [],
    totalCount: 42,
    topRepos: [
      {
        name: "test-repo",
        description: "A test repository",
        url: "https://github.com/test/test-repo",
        stargazerCount: 1500,
        forkCount: 300,
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      },
      {
        name: "no-description-repo",
        description: null,
        url: "https://github.com/test/no-desc",
        stargazerCount: 10,
        forkCount: 2,
        primaryLanguage: null,
      },
    ],
  };

  it("renders null when topRepos is empty", () => {
    const { container } = render(<ReposCard repositories={emptyMockData} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the total count and top repos when data is available", () => {
    render(<ReposCard repositories={populatedMockData} />);

    // Header
    expect(screen.getByText("Top Repositories")).toBeInTheDocument();
    expect(screen.getByText("42 total")).toBeInTheDocument();

    // First repo
    expect(screen.getByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText("A test repository")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    // Second repo (missing description and language)
    expect(screen.getByText("no-description-repo")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Ensure links are sanitized correctly
    const repoLinks = screen.getAllByRole("link");
    expect(repoLinks).toHaveLength(2);
    expect(repoLinks[0]).toHaveAttribute("href", "https://github.com/test/test-repo");
    expect(repoLinks[1]).toHaveAttribute("href", "https://github.com/test/no-desc");
  });
});
