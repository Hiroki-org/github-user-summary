import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import RootLayout, { metadata } from './layout';
import React from 'react';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Geist: vi.fn().mockReturnValue({ variable: '--font-geist-sans' }),
  Geist_Mono: vi.fn().mockReturnValue({ variable: '--font-geist-mono' }),
}));

// Mock Header
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="mock-header" />
}));

// Mock Providers
vi.mock('./providers', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-providers">{children}</div>
}));

// Suppress console.error about <html> in <div> during testing
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('cannot be a child of')) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('RootLayout', () => {
  it('renders the layout children correctly', () => {
    // In React testing library, components are wrapped in a div.
    // This causes warnings for <html> and <body>, and JSDOM might strip/modify them.
    // Let's render the layout and verify it renders children properly.
    const { container } = render(
      <RootLayout>
        <div data-testid="child-element">Test Child</div>
      </RootLayout>
    );

    expect(container.querySelector('[data-testid="mock-providers"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="mock-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="child-element"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="child-element"]')).toHaveTextContent('Test Child');
  });

  it('has the correct html and body classes when rendered statically', () => {
     // A trick to test the actual props of html and body without rendering into a div in jsdom
     // is to call RootLayout as a plain function if it doesn't use hooks, but it has Providers which has use client.
     // Let's just check the returned React element tree directly.
     const layoutElement = RootLayout({ children: <div /> });

     expect(layoutElement.type).toBe('html');
     expect(layoutElement.props.lang).toBe('en');
     expect(layoutElement.props.className).toBe('dark');

     const bodyElement = layoutElement.props.children;
     expect(bodyElement.type).toBe('body');
     expect(bodyElement.props.className).toContain('--font-geist-sans');
     expect(bodyElement.props.className).toContain('--font-geist-mono');
     expect(bodyElement.props.className).toContain('antialiased');
     expect(bodyElement.props.className).toContain('bg-[var(--background)]');
     expect(bodyElement.props.className).toContain('text-[var(--foreground)]');
     expect(bodyElement.props.className).toContain('min-h-screen');
  });

  it('exports metadata correctly', () => {
    expect(metadata).toEqual({
      title: "GitHub User Summary",
      description: "Visualize any GitHub user's profile, skills, contributions, and activity at a glance.",
    });
  });
});
