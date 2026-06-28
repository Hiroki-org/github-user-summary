
import { render, screen } from "@testing-library/react";
import { TopLanguagesBlock } from "../../BusinessCardBlocks/TopLanguagesBlock";

describe("TopLanguagesBlock", () => {
  const topLanguages = [{ name: "TypeScript", percentage: 50, color: "blue", bytes: 100 }];
  const topTopics = [{ name: "react", count: 10 }];
  const interests = { topTopics: [{ name: "web", count: 5 }] } as any;
  const activity = { eventBreakdown: [{ type: "PushEvent", count: 20 }] } as any;

  it("renders top languages with undefined options", () => {
    render(<TopLanguagesBlock topLanguages={topLanguages} topTopics={[]} interests={null} activity={null} options={undefined as any} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
  });

  it("renders top topics", () => {
    render(<TopLanguagesBlock topLanguages={[]} topTopics={topTopics} interests={null} activity={null} options={{ showTopics: true }} />);
    expect(screen.getByText("#react")).toBeInTheDocument();
  });

  it("renders interests", () => {
    render(<TopLanguagesBlock topLanguages={[]} topTopics={[]} interests={interests} activity={null} options={{ showInterests: true }} />);
    expect(screen.getByText("#web")).toBeInTheDocument();
  });

  it("renders activity", () => {
    render(<TopLanguagesBlock topLanguages={[]} topTopics={[]} interests={null} activity={activity} options={{ showActivityBreakdown: true }} />);
    expect(screen.getByText("PushEvent")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });
});
