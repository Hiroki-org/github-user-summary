// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ThemeController from "../ThemeController";
import { useThemeColor } from "@/hooks/useThemeColor";

vi.mock("@/hooks/useThemeColor", () => ({
  useThemeColor: vi.fn(),
}));

describe("ThemeController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useThemeColor with the provided props", () => {
    const props = {
      avatarUrl: "https://example.com/avatar.png",
      topLanguageColor: "#ff0000",
    };

    render(<ThemeController {...props} />);

    expect(useThemeColor).toHaveBeenCalledTimes(1);
    expect(useThemeColor).toHaveBeenCalledWith(props);
  });

  it("renders null", () => {
    const { container } = render(<ThemeController />);

    expect(container.firstChild).toBeNull();
  });

  it("handles missing props correctly", () => {
    render(<ThemeController />);

    expect(useThemeColor).toHaveBeenCalledWith({
      avatarUrl: undefined,
      topLanguageColor: undefined,
    });
  });
});
