import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

// Mock the SearchForm component to isolate HomePage testing
vi.mock('@/components/SearchForm', () => {
  return {
    default: () => <div data-testid="mock-search-form">Mocked Search Form</div>,
  };
});

describe('HomePage', () => {
  it('renders the main headings and description', () => {
    render(<HomePage />);

    // Check for main headings
    expect(screen.getByText('Unlock Your')).toBeInTheDocument();
    expect(screen.getByText('GitHub Profile')).toBeInTheDocument();

    // Check for description text
    expect(screen.getByText(/Explore user profiles, visualize contributions/)).toBeInTheDocument();
  });

  it('renders the SearchForm component', () => {
    render(<HomePage />);

    // Check that our mocked SearchForm is rendered
    expect(screen.getByTestId('mock-search-form')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<HomePage />);

    // Check for footer content
    expect(screen.getByText(/Built with Next.js & GitHub API/)).toBeInTheDocument();
  });
});
