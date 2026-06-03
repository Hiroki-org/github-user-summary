import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardYearPage from './page';

vi.mock('@/components/DashboardYearClient', () => {
  return {
    default: () => <div data-testid="dashboard-year-client">Mocked DashboardYearClient</div>
  };
});

describe('DashboardYearPage', () => {
  it('renders DashboardYearClient component', () => {
    render(<DashboardYearPage />);
    expect(screen.getByTestId('dashboard-year-client')).toBeInTheDocument();
  });
});
