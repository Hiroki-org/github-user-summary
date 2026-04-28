// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import {
  BuildingIcon,
  MapPinIcon,
  LinkIcon,
  TwitterIcon,
  CalendarIcon,
} from "../Icons";

describe("Icons", () => {
  const icons = [
    { name: "BuildingIcon", Component: BuildingIcon },
    { name: "MapPinIcon", Component: MapPinIcon },
    { name: "LinkIcon", Component: LinkIcon },
    { name: "TwitterIcon", Component: TwitterIcon },
    { name: "CalendarIcon", Component: CalendarIcon },
  ];

  describe("Rendering", () => {
    it.each(icons)("renders $name without crashing", ({ Component }) => {
      render(<Component data-testid="icon" />);
      const svg = screen.getByTestId("icon");
      expect(svg).toBeInTheDocument();
      expect(svg.tagName).toBe("svg");
    });
  });

  describe("Props passing", () => {
    it.each(icons)(
      "passes custom props to the underlying svg element for $name",
      ({ Component }) => {
        render(
          <Component
            data-testid="icon"
            className="text-red-500"
            aria-label="custom-label"
          />
        );
        const svg = screen.getByTestId("icon");
        expect(svg).toHaveClass("text-red-500");
        expect(svg).toHaveAttribute("aria-label", "custom-label");
      }
    );
  });
});
