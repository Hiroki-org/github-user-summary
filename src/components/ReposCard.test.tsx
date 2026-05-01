import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReposCard from "./ReposCard";
import type { RepositoryData } from "@/lib/types";
import "@testing-library/jest-dom";

describe("ReposCard", () => {
  it("returns null when topRepos is empty", () => {
    const emptyRepoData: RepositoryData = {
      languages: [],
      topics: [],
      topRepos: [],
      totalCount: 0,
    };
    const { container } = render(<ReposCard repositories={emptyRepoData} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders total count and repo details correctly", () => {
    const repoData: RepositoryData = {
      languages: [],
      topics: [],
      totalCount: 42,
      topRepos: [
        {
          name: "awesome-project",
          description: "An awesome project",
          url: "https://github.com/test/awesome-project",
          stargazerCount: 1500,
          forkCount: 300,
          primaryLanguage: { name: "TypeScript", color: "#3178c6" },
        },
      ],
    };

    render(<ReposCard repositories={repoData} />);

    // Check header and total count
    expect(screen.getByText("Top Repositories")).toBeInTheDocument();
    expect(screen.getByText("42 total")).toBeInTheDocument();

    // Check repo details
    expect(screen.getByText("awesome-project")).toBeInTheDocument();
    expect(screen.getByText("An awesome project")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    // Check link URL
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/test/awesome-project");
  });

  it("renders correctly when description and primary language are missing", () => {
    const repoData: RepositoryData = {
      languages: [],
      topics: [],
      totalCount: 1,
      topRepos: [
        {
          name: "minimal-repo",
          description: null,
          url: "https://github.com/test/minimal-repo",
          stargazerCount: 10,
          forkCount: 2,
          primaryLanguage: null,
        },
      ],
    };

    render(<ReposCard repositories={repoData} />);

    expect(screen.getByText("minimal-repo")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // The description "An awesome project" from the other test should not be here,
    // and there is no description paragraph anyway for this repo.
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });
});
