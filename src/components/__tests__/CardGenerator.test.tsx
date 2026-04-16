// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import CardGenerator from "../CardGenerator";
import type { UserSummary } from "@/lib/types";

// Mock the CardGeneratorModal to simplify testing
vi.mock("../CardGeneratorModal", () => {
  return {
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="mock-modal">
          Modal is open
          <button onClick={onClose} data-testid="close-modal-btn">Close</button>
        </div>
      );
    }
  };
});

describe("CardGenerator", () => {
  it("renders null if summary.profile is missing", () => {
    // Create a mock summary without profile
    const summaryWithoutProfile = {
      repositories: [],
      languages: {},
    } as unknown as UserSummary;

    const { container } = render(<CardGenerator summary={summaryWithoutProfile} />);

    // The component should render nothing (empty container)
    expect(container.firstChild).toBeNull();
  });

  it("renders a button and opens the modal when clicked if summary.profile exists", () => {
    // Create a mock summary with profile
    const summaryWithProfile = {
      profile: {
        login: "testuser",
      },
      repositories: [],
      languages: {},
    } as unknown as UserSummary;

    render(<CardGenerator summary={summaryWithProfile} />);

    // The button should be rendered
    const button = screen.getByRole("button", { name: /card/i });
    expect(button).toBeInTheDocument();

    // Modal should not be open initially
    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();

    // Click the button to open the modal
    fireEvent.click(button);

    // Modal should now be open
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();

    // Test closing the modal
    const closeBtn = screen.getByTestId("close-modal-btn");
    fireEvent.click(closeBtn);

    // Modal should be closed again
    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });
});
