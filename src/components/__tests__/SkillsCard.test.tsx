// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import SkillsCard from "@/components/SkillsCard";
import { RepositoryData } from "@/lib/types";
import { getTopicSizeClass } from "@/lib/topicUtils";

vi.mock("@/components/LanguageChart", () => ({
  default: vi.fn(() => <div data-testid="language-chart">Mocked Language Chart</div>),
}));

vi.mock("@/lib/topicUtils", () => ({
  getTopicSizeClass: vi.fn(() => "mocked-topic-class"),
}));

const mockRepositoryData = (overrides?: Partial<RepositoryData>): RepositoryData => ({
  languages: [],
  topics: [],
  topRepos: [],
  totalCount: 0,
  ...overrides,
});

describe("SkillsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when languages and topics are empty", () => {
    const { container } = render(<SkillsCard repositories={mockRepositoryData()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders languages list and chart correctly", () => {
    const data = mockRepositoryData({
      languages: [
        { name: "TypeScript", bytes: 1000, percentage: 80, color: "#2b7489" },
        { name: "JavaScript", bytes: 250, percentage: 20, color: "#f1e05a" },
      ],
    });

    render(<SkillsCard repositories={data} />);

    expect(screen.getByTestId("language-chart")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("20.0%")).toBeInTheDocument();
  });

  it("renders top languages only (max 10 for progress and max 5 for text list)", () => {
    const languages = Array.from({ length: 15 }, (_, i) => ({
      name: `Lang${i}`,
      bytes: 100,
      percentage: 100 / 15,
      color: "#000000",
    }));

    const data = mockRepositoryData({ languages });
    render(<SkillsCard repositories={data} />);

    expect(screen.getByTitle("Lang0: 6.7%")).toBeInTheDocument();
    expect(screen.getByTitle("Lang9: 6.7%")).toBeInTheDocument();
    expect(screen.queryByTitle("Lang10: 6.7%")).not.toBeInTheDocument();

    expect(screen.getByText("Lang0")).toBeInTheDocument();
    expect(screen.getByText("Lang4")).toBeInTheDocument();
    expect(screen.queryByText("Lang5")).not.toBeInTheDocument();
  });

  it("renders topics list correctly", () => {
    const data = mockRepositoryData({
      topics: [
        { name: "react", count: 10 },
        { name: "nextjs", count: 5 },
      ],
    });

    render(<SkillsCard repositories={data} />);

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("nextjs")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(getTopicSizeClass).toHaveBeenCalledWith(10, 10);
    expect(getTopicSizeClass).toHaveBeenCalledWith(5, 10);
  });

  it("renders top topics only (max 10)", () => {
    const topics = Array.from({ length: 15 }, (_, i) => ({
      name: `topic${i}`,
      count: 15 - i,
    }));

    const data = mockRepositoryData({ topics });
    render(<SkillsCard repositories={data} />);

    expect(screen.getByText("topic0")).toBeInTheDocument();
    expect(screen.getByText("topic9")).toBeInTheDocument();
    expect(screen.queryByText("topic10")).not.toBeInTheDocument();
  });

  it("renders topics with border when both languages and topics exist", () => {
    const data = mockRepositoryData({
      languages: [
        { name: "TypeScript", bytes: 1000, percentage: 80, color: "#2b7489" },
      ],
      topics: [
        { name: "react", count: 10 },
      ],
    });

    render(<SkillsCard repositories={data} />);

    const topicsContainer = screen.getByText("Repository Topics").parentElement;
    expect(topicsContainer).toHaveClass("pt-6");
    expect(topicsContainer).toHaveClass("border-t");
  });
});
