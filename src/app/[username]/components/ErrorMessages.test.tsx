// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ErrorMessages from "./ErrorMessages";
import "@testing-library/jest-dom";

describe("ErrorMessages", () => {
  it("returns null when errors array is empty", () => {
    const { container } = render(<ErrorMessages errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when errors is undefined", () => {
    // Typecast to any to test the falsy condition handled in the component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<ErrorMessages errors={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single error message", () => {
    const errors = [{ section: "API", message: "Failed to fetch data" }];
    render(<ErrorMessages errors={errors} />);

    expect(screen.getByText(/API:/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
  });

  it("renders multiple error messages", () => {
    const errors = [
      { section: "API", message: "Failed to fetch data" },
      { section: "Database", message: "Connection timeout" }
    ];
    render(<ErrorMessages errors={errors} />);

    expect(screen.getByText(/API:/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    expect(screen.getByText(/Database:/)).toBeInTheDocument();
    expect(screen.getByText(/Connection timeout/)).toBeInTheDocument();
  });
});
