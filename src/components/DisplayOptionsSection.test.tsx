// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import DisplayOptionsSection from "./DisplayOptionsSection";
import type { CardDisplayOptions } from "@/lib/types";
import { useState } from "react";
import "@testing-library/jest-dom";

describe("DisplayOptionsSection", () => {
  const defaultOptions: CardDisplayOptions = {
    showCompany: true,
    showLocation: false,
    showWebsite: true,
    showTwitter: false,
    showJoinedDate: true,
    showTopics: false,
    showContributionBreakdown: true,
    showStreaks: false,
    showInterests: true,
    showActivityBreakdown: false,
  };

  it("renders the 'Display Options' header", () => {
    const setOptions = vi.fn();
    render(<DisplayOptionsSection options={defaultOptions} setOptions={setOptions} />);
    expect(screen.getByRole("heading", { name: "Display Options" })).toBeInTheDocument();
  });

  it("renders all toggle labels", () => {
    const setOptions = vi.fn();
    render(<DisplayOptionsSection options={defaultOptions} setOptions={setOptions} />);
    const labels = [
      "Company",
      "Location",
      "Website",
      "Twitter",
      "Joined date",
      "Topics",
      "Contribution breakdown",
      "Streaks",
      "Interests",
      "Activity breakdown",
    ];

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("correctly sets initial checkbox states based on options prop", () => {
    const setOptions = vi.fn();
    render(<DisplayOptionsSection options={defaultOptions} setOptions={setOptions} />);

    // Check elements based on boolean values in defaultOptions
    const companyCheckbox = screen.getByLabelText("Company") as HTMLInputElement;
    expect(companyCheckbox.checked).toBe(true);

    const locationCheckbox = screen.getByLabelText("Location") as HTMLInputElement;
    expect(locationCheckbox.checked).toBe(false);

    const websiteCheckbox = screen.getByLabelText("Website") as HTMLInputElement;
    expect(websiteCheckbox.checked).toBe(true);

    const twitterCheckbox = screen.getByLabelText("Twitter") as HTMLInputElement;
    expect(twitterCheckbox.checked).toBe(false);
  });

  it("updates options state when checkboxes are toggled", async () => {
    const user = userEvent.setup();

    const Wrapper = () => {
      const [options, setOptions] = useState<CardDisplayOptions>({
        showCompany: false,
        showLocation: false,
      });
      return <DisplayOptionsSection options={options} setOptions={setOptions} />;
    };

    render(<Wrapper />);

    const companyCheckbox = screen.getByLabelText("Company") as HTMLInputElement;
    expect(companyCheckbox.checked).toBe(false);

    // Toggle on
    await user.click(companyCheckbox);
    expect(companyCheckbox.checked).toBe(true);

    // Toggle off
    await user.click(companyCheckbox);
    expect(companyCheckbox.checked).toBe(false);
  });
});
