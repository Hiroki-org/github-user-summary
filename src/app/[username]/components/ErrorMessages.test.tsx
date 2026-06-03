import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorMessages from './ErrorMessages';

describe('ErrorMessages', () => {
  it('returns null when errors array is undefined', () => {
    // @ts-expect-error Testing invalid input for robustness
    const { container } = render(<ErrorMessages errors={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when errors array is empty', () => {
    const { container } = render(<ErrorMessages errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a single error message correctly', () => {
    const errors = [{ section: 'Test Section', message: 'Test message' }];
    render(<ErrorMessages errors={errors} />);

    expect(screen.getByText('Test Section:')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders multiple error messages correctly', () => {
    const errors = [
      { section: 'Section 1', message: 'Message 1' },
      { section: 'Section 2', message: 'Message 2' },
    ];
    render(<ErrorMessages errors={errors} />);

    expect(screen.getByText('Section 1:')).toBeInTheDocument();
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2:')).toBeInTheDocument();
    expect(screen.getByText('Message 2')).toBeInTheDocument();
  });
});
