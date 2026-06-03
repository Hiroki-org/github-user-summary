// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import NotFoundPage from './not-found';

describe('NotFoundPage', () => {
  it('renders the 404/Not Found content correctly', () => {
    render(<NotFoundPage />);

    // Check for the search icon/emoji
    expect(screen.getByText('🔍')).toBeInTheDocument();

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /user not found/i })).toBeInTheDocument();

    // Check for the descriptive text
    expect(
      screen.getByText(/the github user you're looking for doesn't exist/i)
    ).toBeInTheDocument();

    // Check for the Go Home link
    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
