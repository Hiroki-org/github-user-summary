// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardStatsClient, { buildEventSeries } from "../DashboardStatsClient";
import { useDashboardData, useDashboardStats } from "@/hooks/useDashboardData";
import "@testing-library/jest-dom";

// Mock recharts to avoid rendering errors in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

vi.mock("@/components/ActivityHeatmapGrid", () => ({
  default: () => <div data-testid="heatmap-grid" />,
}));

vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: vi.fn(),
  useDashboardStats: vi.fn(),
}));

describe("buildEventSeries", () => {
  it("should return an empty array when given an empty array", () => {
    expect(buildEventSeries([])).toEqual([]);
  });

  it("should replace 'Event' with an empty string in the name property", () => {
    const input = [
      { type: "PushEvent", count: 10 },
      { type: "PullRequestEvent", count: 5 },
      { type: "IssuesEvent", count: 2 },
    ];
    const expected = [
      { name: "Push", count: 10 },
      { name: "PullRequest", count: 5 },
      { name: "Issues", count: 2 },
    ];
    expect(buildEventSeries(input)).toEqual(expected);
  });

  it("should return at most 6 elements", () => {
    const input = Array.from({ length: 10 }, (_, i) => ({
      type: `Type${i}Event`,
      count: i,
    }));
    const result = buildEventSeries(input);
    expect(result.length).toBe(6);
    expect(result).toEqual([
      { name: "Type0", count: 0 },
      { name: "Type1", count: 1 },
      { name: "Type2", count: 2 },
      { name: "Type3", count: 3 },
      { name: "Type4", count: 4 },
      { name: "Type5", count: 5 },
    ]);
  });

  it("should correctly map the count property", () => {
    const input = [
      { type: "PushEvent", count: 42 },
      { type: "CreateEvent", count: 1 },
    ];
    const expected = [
      { name: "Push", count: 42 },
      { name: "Create", count: 1 },
    ];
    expect(buildEventSeries(input)).toEqual(expected);
  });

  it("should not modify type if it does not contain 'Event'", () => {
    const input = [{ type: "Push", count: 10 }];
    const expected = [{ name: "Push", count: 10 }];
    expect(buildEventSeries(input)).toEqual(expected);
  });
});

describe("DashboardStatsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state when data is loading", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
    } as any);
    vi.mocked(useDashboardStats).mockReturnValue({
      heatmap: null,
      isLoading: false,
      error: null,
    } as any);

    render(<DashboardStatsClient />);
    expect(screen.getByText("Loading stats...")).toBeInTheDocument();
  });

  it("should render error state when there is an error", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      summary: null,
      isLoading: false,
      error: new Error("Failed to load"),
    } as any);
    vi.mocked(useDashboardStats).mockReturnValue({
      heatmap: null,
      isLoading: false,
      error: null,
    } as any);

    render(<DashboardStatsClient />);
    expect(screen.getByText("Failed to load stats.")).toBeInTheDocument();
  });

  it("should render charts and heatmap when data is loaded successfully", () => {
    const mockSummary = {
      activity: {
        eventBreakdown: [
          { type: "PushEvent", count: 10 },
        ],
      },
      contributions: {
        calendar: [
          { date: "2023-01-01", count: 5 },
        ],
      },
    };

    vi.mocked(useDashboardData).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useDashboardStats).mockReturnValue({
      heatmap: [[1, 2, 3]],
      isLoading: false,
      error: null,
    } as any);

    render(<DashboardStatsClient />);

    expect(screen.getByText("Activity Stats")).toBeInTheDocument();
    expect(screen.getByText("Recent Event Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Monthly Contributions")).toBeInTheDocument();
    expect(screen.getByTestId("heatmap-grid")).toBeInTheDocument();
  });
});
