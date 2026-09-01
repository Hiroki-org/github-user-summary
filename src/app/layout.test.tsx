// @vitest-environment jsdom
import { expect, test, vi, describe } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Geist: vi.fn().mockReturnValue({ variable: 'mock-geist-sans' }),
  Geist_Mono: vi.fn().mockReturnValue({ variable: 'mock-geist-mono' }),
}));

vi.mock('@/components/Header', () => ({
  default: () => <header>Mocked Header</header>,
}));

vi.mock('./providers', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>Mocked Providers {children}</div>,
}));

describe('layout.tsx', () => {
  test('metadata is correctly defined', async () => {
    const { metadata } = await import('./layout');
    expect(metadata).toEqual({
      title: "GitHub User Summary",
      description: "Visualize any GitHub user's profile, skills, contributions, and activity at a glance.",
    });
  });

  test('RootLayout renders correctly', async () => {
    const { default: RootLayout } = await import('./layout');
    const { getByText } = render(
      <RootLayout>
        <main>Test Children</main>
      </RootLayout>
    );

    expect(getByText('Mocked Header')).toBeInTheDocument();
    expect(getByText(/Mocked Providers/)).toBeInTheDocument();
    expect(getByText('Test Children')).toBeInTheDocument();
  });
});
