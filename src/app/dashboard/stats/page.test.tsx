import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardStatsPage from './page';

vi.mock('@/components/DashboardStatsClient', () => ({
  default: () => <div data-testid="mock-dashboard-stats-client">Stats Client</div>
}));

describe('DashboardStatsPage', () => {
  it('renders the DashboardStatsClient component', () => {
    render(<DashboardStatsPage />);
    expect(screen.getByTestId('mock-dashboard-stats-client')).toBeInTheDocument();
  });
});
