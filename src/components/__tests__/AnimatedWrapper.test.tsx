// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AnimatedWrapper from "../AnimatedWrapper";
import "@testing-library/jest-dom";

describe("AnimatedWrapper", () => {
  it("renders its children correctly", () => {
    render(
      <AnimatedWrapper delay="0s">
        <div data-testid="child">Child Content</div>
      </AnimatedWrapper>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("applies the delay prop to the style attribute", () => {
    render(
      <AnimatedWrapper delay="0.5s">
        <div>Child Content</div>
      </AnimatedWrapper>
    );

    const wrapper = screen.getByText("Child Content").parentElement;
    expect(wrapper).toHaveStyle({ animationDelay: "0.5s" });
  });

  it("applies the animate-slide-up class", () => {
    render(
      <AnimatedWrapper delay="0s">
        <div>Child Content</div>
      </AnimatedWrapper>
    );

    const wrapper = screen.getByText("Child Content").parentElement;
    expect(wrapper).toHaveClass("animate-slide-up");
  });
});
