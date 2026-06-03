import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BackgroundDecoration from "./BackgroundDecoration";

describe("BackgroundDecoration", () => {
  it("renders correctly", () => {
    const { container } = render(<BackgroundDecoration />);

    // Check if the main wrapper exists
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("absolute", "inset-0", "overflow-hidden", "pointer-events-none", "fixed");

    // Check if it renders exactly two decorative circles
    const circles = wrapper.children;
    expect(circles).toHaveLength(2);

    // Verify first circle classes
    expect(circles[0]).toHaveClass("absolute", "-top-[10%]", "-right-[10%]", "w-[60%]", "h-[60%]", "rounded-full", "bg-accent", "opacity-5", "blur-[120px]", "animate-pulse-slow");

    // Verify second circle classes and specific style
    expect(circles[1]).toHaveClass("absolute", "top-[40%]", "-left-[10%]", "w-[50%]", "h-[50%]", "rounded-full", "bg-success", "opacity-5", "blur-[120px]", "animate-pulse-slow");
    expect(circles[1]).toHaveStyle({ animationDelay: "2s" });
  });
});
