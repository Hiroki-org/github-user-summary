// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading from './loading';

describe('Loading Component', () => {
  it('renders loading skeleton correctly', () => {
    const { container } = render(<Loading />);

    // Check if the main container is present
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();

    // Check if the header skeleton is present
    expect(container.querySelector('header')).toBeInTheDocument();

    // Check if the main content area is present
    expect(container.querySelector('main')).toBeInTheDocument();

    // Check if we have multiple animate-pulse elements for skeletons
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
