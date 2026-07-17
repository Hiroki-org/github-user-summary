import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorMessages from './ErrorMessages';

describe('ErrorMessages', () => {
  it('renders nothing when errors array is empty', () => {
    const { container } = render(<ErrorMessages errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when errors is undefined', () => {
    // @ts-expect-error Testing invalid input
    const { container } = render(<ErrorMessages errors={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error messages when provided', () => {
    const errors = [
      { section: 'Profile', message: 'Failed to load profile' },
      { section: 'Repositories', message: 'Rate limit exceeded' },
    ];

    render(<ErrorMessages errors={errors} />);

    // Check if the messages are rendered
    expect(screen.getByText('Profile:')).toBeInTheDocument();
    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();

    expect(screen.getByText('Repositories:')).toBeInTheDocument();
    expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
  });
});
