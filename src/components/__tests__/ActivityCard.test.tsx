// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import ActivityCard from "../ActivityCard";
import type { ActivityData } from "@/lib/types";

// Mock the inner heatmap component to keep tests focused on the card's logic
vi.mock("../ActivityHeatmap", () => ({
  default: () => <div data-testid="mock-heatmap" />,
}));

const mockActivity: ActivityData = {
  heatmap: Array(7).fill(Array(24).fill(0)),
  totalEvents: 100,
  eventBreakdown: [
    { type: "PushEvent", count: 45 },
    { type: "PullRequestEvent", count: 20 },
    { type: "IssuesEvent", count: 15 },
    { type: "IssueCommentEvent", count: 10 },
    { type: "CreateEvent", count: 5 },
    { type: "DeleteEvent", count: 2 },
    { type: "WatchEvent", count: 1 },
    { type: "ForkEvent", count: 1 },
    { type: "PullRequestReviewEvent", count: 1 },
  ],
};

describe("ActivityCard", () => {
  it("renders null when totalEvents is 0", () => {
    const { container } = render(
      <ActivityCard activity={{ ...mockActivity, totalEvents: 0 }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the total events count", () => {
    render(<ActivityCard activity={mockActivity} />);
    expect(screen.getByText("100 events (last 90 days)")).toBeInTheDocument();
  });

  it("renders up to 8 event types in the breakdown", () => {
    render(<ActivityCard activity={mockActivity} />);
    // The mock has 9 items, so only 8 should be rendered.
    expect(screen.getByText("Pushes")).toBeInTheDocument();
    expect(screen.getByText("Pull Requests")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByText("Creates")).toBeInTheDocument();
    expect(screen.getByText("Deletes")).toBeInTheDocument();
    expect(screen.getByText("Stars")).toBeInTheDocument();
    expect(screen.getByText("Forks")).toBeInTheDocument();

    // The 9th item should not be rendered
    expect(screen.queryByText("Reviews")).not.toBeInTheDocument();
  });

  it("renders correct percentages for events", () => {
    render(<ActivityCard activity={mockActivity} />);
    // 45 out of 100 is 45.0%
    expect(screen.getByText("(45.0%)")).toBeInTheDocument();
    // 2 out of 100 is 2.0%
    expect(screen.getByText("(2.0%)")).toBeInTheDocument();
  });

  it("falls back to removing 'Event' from unknown event types", () => {
    const customActivity = {
      ...mockActivity,
      eventBreakdown: [{ type: "UnknownEvent", count: 10 }],
      totalEvents: 10,
    };
    render(<ActivityCard activity={customActivity} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("(100.0%)")).toBeInTheDocument();
  });

  it("does not render Event Breakdown section when eventBreakdown is empty but totalEvents > 0", () => {
    // Edge case where total events > 0 but breakdown is empty
    const customActivity = {
      ...mockActivity,
      eventBreakdown: [],
      totalEvents: 10,
    };
    render(<ActivityCard activity={customActivity} />);
    expect(screen.queryByText("Event Breakdown")).not.toBeInTheDocument();
    // The card itself should still render
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });
});
