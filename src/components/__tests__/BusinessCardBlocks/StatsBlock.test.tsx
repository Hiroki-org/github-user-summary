
import { render, screen, within } from "@testing-library/react";
import { StatsBlock } from "../../BusinessCardBlocks/StatsBlock";

describe("StatsBlock", () => {
  const profile = { followers: 100, public_repos: 55 } as any;
  const contributions = {
    totalContributions: 500,
    totalCommits: 400,
    totalPRs: 50,
    totalIssues: 30,
    totalReviews: 20,
    longestStreak: 10,
    currentStreak: 5,
  } as any;

  it("renders basic stats", () => {
    render(<StatsBlock profile={profile} contributions={contributions} options={{}} />);
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("renders basic stats with null contributions", () => {
    render(<StatsBlock profile={profile} contributions={null} options={{}} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("renders contribution breakdown", () => {
    render(<StatsBlock profile={profile} contributions={contributions} options={{ showContributionBreakdown: true }} />);
    expect(screen.getByText("Commits")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("Pull Requests")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Code Reviews")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders streaks", () => {
    render(<StatsBlock profile={profile} contributions={contributions} options={{ showStreaks: true }} />);
    expect(screen.getByText("Longest Streak")).toBeInTheDocument();
    expect(screen.getByText("10 days")).toBeInTheDocument();
    expect(screen.getByText("Current Streak")).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });
});
