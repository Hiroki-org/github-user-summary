// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import InterestsCard from "./InterestsCard";
import "@testing-library/jest-dom";

describe("InterestsCard", () => {
  it("returns null when totalStarred is 0", () => {
    const { container } = render(
      <InterestsCard
        interests={{
          totalStarred: 0,
          topTopics: [{ name: "react", count: 1 }],
          topLanguages: [{ name: "TypeScript", count: 1 }],
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when both topTopics and topLanguages are empty", () => {
    const { container } = render(
      <InterestsCard
        interests={{
          totalStarred: 10,
          topTopics: [],
          topLanguages: [],
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the component correctly when valid interests data is provided", () => {
    render(
      <InterestsCard
        interests={{
          totalStarred: 42,
          topTopics: [{ name: "react", count: 5 }],
          topLanguages: [{ name: "TypeScript", count: 10 }],
        }}
      />
    );
    expect(screen.getByText("Interests")).toBeInTheDocument();
    expect(screen.getByText("42 starred")).toBeInTheDocument();
  });

  it("renders topics and their counts correctly under 'Top Topics'", () => {
    render(
      <InterestsCard
        interests={{
          totalStarred: 10,
          topTopics: [
            { name: "react", count: 5 },
            { name: "nextjs", count: 3 },
          ],
          topLanguages: [],
        }}
      />
    );
    expect(screen.getByText("Top Topics")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("nextjs")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders languages and their counts correctly under 'Interest Languages'", () => {
    render(
      <InterestsCard
        interests={{
          totalStarred: 10,
          topTopics: [],
          topLanguages: [
            { name: "TypeScript", count: 10 },
            { name: "JavaScript", count: 8 },
          ],
        }}
      />
    );
    expect(screen.getByText("Interest Languages")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("limits 'Interest Languages' to 8 items if more than 8 are provided", () => {
    const topLanguages = Array.from({ length: 10 }, (_, i) => ({
      name: `Lang${i}`,
      count: 10 - i,
    }));

    render(
      <InterestsCard
        interests={{
          totalStarred: 10,
          topTopics: [],
          topLanguages,
        }}
      />
    );

    // Lang0 to Lang7 should be in the document
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(`Lang${i}`)).toBeInTheDocument();
    }

    // Lang8 and Lang9 should NOT be in the document
    expect(screen.queryByText("Lang8")).not.toBeInTheDocument();
    expect(screen.queryByText("Lang9")).not.toBeInTheDocument();
  });
});
