import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SkillsCard from "../SkillsCard";
import type { RepositoryData, LanguageStats } from "@/lib/types";

// Mock the child component to simplify testing
vi.mock("../LanguageChart", () => ({
  default: () => <div data-testid="mock-language-chart">Mocked Language Chart</div>,
}));

describe("SkillsCard", () => {
  const mockLanguage: LanguageStats = {
    name: "TypeScript",
    bytes: 1000,
    percentage: 100,
    color: "#3178c6",
  };

  const mockTopic = {
    name: "react",
    count: 5,
  };

  const emptyRepositories: RepositoryData = {
    languages: [],
    topics: [],
    topRepos: [],
    totalCount: 0,
  };

  it("renders null when both languages and topics are empty", () => {
    const { container } = render(<SkillsCard repositories={emptyRepositories} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders only languages when topics is empty", () => {
    const repositories: RepositoryData = {
      ...emptyRepositories,
      languages: [mockLanguage],
    };

    render(<SkillsCard repositories={repositories} />);

    // Header should be present
    expect(screen.getByText("Skills & Languages")).toBeDefined();

    // Language should be displayed
    expect(screen.getByText("TypeScript")).toBeDefined();
    expect(screen.getByText("100.0%")).toBeDefined();
    expect(screen.getByTestId("mock-language-chart")).toBeDefined();

    // Topics should not be displayed
    expect(screen.queryByText("Repository Topics")).toBeNull();
  });

  it("renders only topics when languages is empty", () => {
    const repositories: RepositoryData = {
      ...emptyRepositories,
      topics: [mockTopic],
    };

    render(<SkillsCard repositories={repositories} />);

    // Header should be present
    expect(screen.getByText("Skills & Languages")).toBeDefined();

    // Topics should be displayed
    expect(screen.getByText("Repository Topics")).toBeDefined();
    expect(screen.getByText("react")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined(); // The count span

    // Languages should not be displayed
    expect(screen.queryByTestId("mock-language-chart")).toBeNull();
  });

  it("renders both languages and topics", () => {
    const repositories: RepositoryData = {
      ...emptyRepositories,
      languages: [mockLanguage],
      topics: [mockTopic],
    };

    render(<SkillsCard repositories={repositories} />);

    expect(screen.getByText("Skills & Languages")).toBeDefined();
    expect(screen.getByText("TypeScript")).toBeDefined();
    expect(screen.getByTestId("mock-language-chart")).toBeDefined();
    expect(screen.getByText("Repository Topics")).toBeDefined();
    expect(screen.getByText("react")).toBeDefined();
  });

  it("truncates languages to the top 10", () => {
    // Create 15 languages
    const manyLanguages: LanguageStats[] = Array.from({ length: 15 }).map((_, i) => ({
      name: `Lang-${i}`,
      bytes: 100 - i,
      percentage: 100 / 15,
      color: "#000000",
    }));

    const repositories: RepositoryData = {
      ...emptyRepositories,
      languages: manyLanguages,
    };

    const { container } = render(<SkillsCard repositories={repositories} />);

    // The language bars at the top (topLanguages.map)
    const languageBars = container.querySelectorAll('.bg-card-bg\\/50.ring-1 > div');
    expect(languageBars.length).toBe(10);

    // The detailed list below it only shows top 5 according to the component logic
    // We check that Lang-0 is there, but Lang-10 is not in the detailed list
    expect(screen.getByText("Lang-0")).toBeDefined();
    expect(screen.queryByText("Lang-10")).toBeNull();
  });

  it("truncates topics to the top 10", () => {
    // Create 15 topics
    const manyTopics = Array.from({ length: 15 }).map((_, i) => ({
      name: `topic-${i}`,
      count: 15 - i,
    }));

    const repositories: RepositoryData = {
      ...emptyRepositories,
      topics: manyTopics,
    };

    render(<SkillsCard repositories={repositories} />);

    expect(screen.getByText("topic-0")).toBeDefined();
    expect(screen.getByText("topic-9")).toBeDefined();

    // Since it's truncated to 10, topic-10 shouldn't be there
    expect(screen.queryByText("topic-10")).toBeNull();
  });
});
