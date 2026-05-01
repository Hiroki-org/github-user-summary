// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReadmeCardUrlSection, { generateReadmeUrl } from "../ReadmeCardUrlSection";
import type { CardLayout, CardDisplayOptions } from "@/lib/types";

describe("generateReadmeUrl", () => {
  const defaultLayout: CardLayout = {
    blocks: [
      { id: "bio", visible: true, column: "left" },
      { id: "stats", visible: true, column: "left" },
      { id: "topLanguages", visible: true, column: "left" },
    ],
  };

  const defaultOptions: CardDisplayOptions = {
    showContributionBreakdown: true,
    showActivityBreakdown: true,
  };

  const defaultProps = {
    username: "testuser",
    layout: defaultLayout,
    options: defaultOptions,
    readmeTheme: "github-dark",
    readmeCols: 1,
    includeStreak: false,
    includeHeatmap: false,
    origin: "http://localhost:3000",
  };

  it("should return empty string if username is missing", () => {
    expect(
      generateReadmeUrl({
        ...defaultProps,
        username: undefined,
      })
    ).toBe("");
  });

  it("should generate basic URL with default options", () => {
    const url = generateReadmeUrl(defaultProps);
    const parsedUrl = new URL(url);

    expect(parsedUrl.origin).toBe("http://localhost:3000");
    expect(parsedUrl.pathname).toBe("/api/card/testuser");
    expect(parsedUrl.searchParams.get("format")).toBe("png");
    expect(parsedUrl.searchParams.get("theme")).toBe("github-dark");
    expect(parsedUrl.searchParams.get("cols")).toBe("1");
    expect(parsedUrl.searchParams.get("blocks")).toBe("bio,stats,langs");
    expect(parsedUrl.searchParams.get("layout")).toBe("left:bio,left:stats,left:langs");
    expect(parsedUrl.searchParams.get("width")).toBe("600");
    expect(parsedUrl.searchParams.get("hide")).toBeNull();
  });

  it("should append streak to blocks when includeStreak is true", () => {
    const url = generateReadmeUrl({
      ...defaultProps,
      includeStreak: true,
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("blocks")).toBe("bio,stats,langs,streak");
  });

  it("should append heatmap to blocks when includeHeatmap is true", () => {
    const url = generateReadmeUrl({
      ...defaultProps,
      includeHeatmap: true,
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("blocks")).toBe("bio,stats,langs,heatmap");
  });

  it("should include hide param when showContributionBreakdown is false", () => {
    const url = generateReadmeUrl({
      ...defaultProps,
      options: { ...defaultOptions, showContributionBreakdown: false },
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("hide")).toBe("stars");
  });

  it("should include hide param when showActivityBreakdown is false", () => {
    const url = generateReadmeUrl({
      ...defaultProps,
      options: { ...defaultOptions, showActivityBreakdown: false },
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("hide")).toBe("forks");
  });

  it("should include hide param with both stars and forks", () => {
    const url = generateReadmeUrl({
      ...defaultProps,
      options: {
        showContributionBreakdown: false,
        showActivityBreakdown: false,
      },
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("hide")).toBe("stars,forks");
  });

  it("should handle custom blocks layout", () => {
    const layout: CardLayout = {
      blocks: [
        { id: "topRepos", visible: true, column: "right" },
        { id: "stats", visible: false, column: "left" },
        { id: "bio", visible: true, column: "left" },
      ],
    };
    const url = generateReadmeUrl({
      ...defaultProps,
      layout,
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("blocks")).toBe("repos,bio");
    expect(parsedUrl.searchParams.get("layout")).toBe("right:repos,left:bio");
  });

  it("should url encode username", () => {
     const url = generateReadmeUrl({
      ...defaultProps,
      username: "test user",
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.pathname).toBe("/api/card/test%20user");
  });

  it("should return default blocks when layout is empty but includeStreak is true", () => {
    const layout: CardLayout = {
      blocks: [],
    };
    const url = generateReadmeUrl({
      ...defaultProps,
      layout,
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("blocks")).toBe("bio,stats,langs");
  });

  it("should filter out blocks that map to null in blockMap", () => {
    const layout: CardLayout = {
      blocks: [
        { id: "avatar", visible: true, column: "left" },
        { id: "profile", visible: true, column: "left" },
        { id: "contributions", visible: true, column: "right" },
        { id: "heatmap", visible: true, column: "right" },
        { id: "interests", visible: true, column: "left" },
        { id: "skills", visible: true, column: "right" },
        { id: "bio", visible: true, column: "left" },
      ],
    };
    const url = generateReadmeUrl({
      ...defaultProps,
      layout,
    });
    const parsedUrl = new URL(url);

    expect(parsedUrl.searchParams.get("blocks")).toBe("bio");
    expect(parsedUrl.searchParams.get("layout")).toBe("left:bio");
  });
  it("should remove duplicate block targets in the blocks parameter", () => {
    const layout: CardLayout = {
      blocks: [
        { id: "bio", visible: true, column: "left" },
        { id: "bio", visible: true, column: "right" },
        { id: "topRepos", visible: true, column: "left" },
        { id: "repos", visible: true, column: "right" },
      ],
    };
    const url = generateReadmeUrl({
      ...defaultProps,
      layout,
    });
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("blocks")).toBe("bio,repos");
    expect(parsedUrl.searchParams.get("layout")).toBe("left:bio,right:bio,left:repos,right:repos");
  });

});

describe("ReadmeCardUrlSection", () => {
  const defaultLayout: CardLayout = {
    blocks: [
      { id: "bio", visible: true, column: "left" },
      { id: "stats", visible: true, column: "left" },
      { id: "topLanguages", visible: true, column: "left" },
    ],
  };

  const defaultOptions: CardDisplayOptions = {
    showContributionBreakdown: true,
    showActivityBreakdown: true,
  };

  const defaultProps = {
    username: "testuser",
    layout: defaultLayout,
    options: defaultOptions,
  };

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default properties", () => {
    render(<ReadmeCardUrlSection {...defaultProps} />);

    expect(screen.getByText("README Card URL")).toBeTruthy();
    expect(screen.getByText("Copy URL")).toBeTruthy();
  });

  it("shows Sign in to generate URL if username is missing", async () => {
     render(<ReadmeCardUrlSection layout={defaultLayout} options={defaultOptions} />);

     const button = screen.getByText("Copy URL");
     fireEvent.click(button);

     expect(await screen.findByText("Sign in to generate URL")).toBeTruthy();
  });

  it("handles copy failure", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Copy failed"));

    render(<ReadmeCardUrlSection {...defaultProps} />);

    const button = screen.getByText("Copy URL");
    fireEvent.click(button);

    expect(await screen.findByText("Copy failed")).toBeTruthy();
  });

  it("handles copy success", async () => {
    render(<ReadmeCardUrlSection {...defaultProps} />);

    const button = screen.getByText("Copy URL");
    fireEvent.click(button);

    expect(await screen.findByText("Copied!")).toBeTruthy();
  });

  it("can change selects and checkboxes", async () => {
    render(<ReadmeCardUrlSection {...defaultProps} />);

    const themeSelect = screen.getByRole("combobox", { name: "Theme" });
    fireEvent.change(themeSelect, { target: { value: "dark" } });

    const colsSelect = screen.getByRole("combobox", { name: "Columns" });
    fireEvent.change(colsSelect, { target: { value: "2" } });

    const streakCheckbox = screen.getByRole("checkbox", { name: "Include streak" });
    fireEvent.click(streakCheckbox);

    const heatmapCheckbox = screen.getByRole("checkbox", { name: "Include heatmap" });
    fireEvent.click(heatmapCheckbox);

    const urlContainer = screen.getByText(/theme=dark/);
    expect(urlContainer).toBeTruthy();
    expect(screen.getByText(/cols=2/)).toBeTruthy();
    expect(screen.getByText(/blocks=[^&]*streak/)).toBeTruthy();
    expect(screen.getByText(/blocks=[^&]*heatmap/)).toBeTruthy();
  });

  it("handles fallback to light theme", async () => {
    render(<ReadmeCardUrlSection {...defaultProps} />);
    const themeSelect = screen.getByRole("combobox", { name: "Theme" });
    fireEvent.change(themeSelect, { target: { value: "invalid-theme" } });

    expect(screen.getByText(/theme=light/)).toBeTruthy();
  });

  it("handles fallback to 1 column", async () => {
    render(<ReadmeCardUrlSection {...defaultProps} />);
    const colsSelect = screen.getByRole("combobox", { name: "Columns" });
    fireEvent.change(colsSelect, { target: { value: "invalid-cols" } });

    expect(screen.getByText(/cols=1/)).toBeTruthy();
  });

  it("handles undefined window during SSR", () => {
    const url = generateReadmeUrl({
      ...defaultProps,
      origin: "",
    });
    const parsedUrl = new URL(url, "http://localhost");
    expect(parsedUrl.pathname).toBe("/api/card/testuser");


  });
});
