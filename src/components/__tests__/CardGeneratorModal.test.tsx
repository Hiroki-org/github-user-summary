// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import CardGeneratorModal from "../CardGeneratorModal";
import type { UserSummary } from "@/lib/types";

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,fake-preview-url"),
  toBlob: vi.fn().mockResolvedValue(new Blob(["fake"], { type: "image/png" })),
}));

vi.mock("../BusinessCard", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="business-card" />),
}));

vi.mock("../LayoutEditor", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="layout-editor" />),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <img alt="Mocked Next Image" {...props} data-testid="next-image" />,
}));

const mockSummary: UserSummary = {
  profile: {
    login: "testuser",
    name: "Test User",
    avatar_url: "https://example.com/avatar.png",
    bio: "Test bio",
    company: null,
    location: null,
    blog: null,
    twitter_username: null,
    followers: 10,
    following: 5,
    public_repos: 20,
    created_at: "2020-01-01T00:00:00Z",
    orgs: [],
    pinnedRepos: [],
  },
  repositories: {
    languages: [],
    topics: [],
    topRepos: [],
    totalCount: 20,
  },
  contributions: {
    totalCommits: 500,
    totalPRs: 50,
    totalIssues: 30,
    totalReviews: 20,
    totalContributions: 600,
    longestStreak: 10,
    currentStreak: 2,
    mostActiveDay: "Friday",
    calendar: [],
  },
  activity: {
    heatmap: [],
    eventBreakdown: [],
    totalEvents: 10,
  },
  interests: {
    topTopics: [],
    topLanguages: [],
    totalStarred: 5,
  },
  errors: [],
};

describe("CardGeneratorModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <CardGeneratorModal
        isOpen={false}
        onClose={vi.fn()}
        summary={mockSummary}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders correctly when isOpen is true", async () => {
    render(
      <CardGeneratorModal
        isOpen={true}
        onClose={vi.fn()}
        summary={mockSummary}
      />
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByText("Profile Card")).toBeInTheDocument();
  });

  it("switches tabs between Settings and Layout", async () => {
    const user = userEvent.setup();
    render(
      <CardGeneratorModal
        isOpen={true}
        onClose={vi.fn()}
        summary={mockSummary}
      />
    );

    // Default tab is Settings
    expect(await screen.findByText("Avatar")).toBeInTheDocument(); // part of Detail Options
    expect(screen.queryByTestId("layout-editor")).not.toBeInTheDocument();

    // Click Edit Layout tab
    await user.click(screen.getByText("Edit Layout"));
    expect(screen.queryByText("Avatar")).not.toBeInTheDocument();
    expect(screen.getByTestId("layout-editor")).toBeInTheDocument();

    // Click Display Settings tab
    await user.click(screen.getByText("Display Settings"));
    expect(screen.getByText("Avatar")).toBeInTheDocument();
    expect(screen.queryByTestId("layout-editor")).not.toBeInTheDocument();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <CardGeneratorModal
        isOpen={true}
        onClose={handleClose}
        summary={mockSummary}
      />
    );

    // Wait for the modal to be fully mounted
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
