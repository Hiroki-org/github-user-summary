/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopReposBlock } from "../../BusinessCardBlocks/TopReposBlock";

describe("TopReposBlock", () => {
  it("renders repos correctly", () => {
    const repos = [
      {
        name: "test-repo",
        stargazerCount: 100,
        primaryLanguage: { name: "TypeScript", color: "blue" },
      },
    ] as any;

    render(<TopReposBlock reposToShow={repos as any} />);
    expect(screen.getByText("test-repo")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders nothing when empty", () => {
    const { container } = render(<TopReposBlock reposToShow={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
