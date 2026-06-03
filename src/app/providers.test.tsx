import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Providers from "./providers";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe("Providers Component", () => {
  it("renders children inside SessionProvider", () => {
    const testMessage = "Test Child Content";
    render(
      <Providers>
        <div data-testid="test-child">{testMessage}</div>
      </Providers>
    );

    // Verify SessionProvider is rendered
    const sessionProvider = screen.getByTestId("session-provider");
    expect(sessionProvider).toBeInTheDocument();

    // Verify child is rendered inside SessionProvider
    const child = screen.getByTestId("test-child");
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent(testMessage);
    expect(sessionProvider).toContainElement(child);
  });
});
