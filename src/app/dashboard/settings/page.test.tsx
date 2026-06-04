import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardSettingsPage from './page';

// Mock the client component to simplify testing of the server component
vi.mock('@/components/DashboardSettingsClient', () => ({
  default: () => <div data-testid="mock-dashboard-settings-client">Settings Client Mock</div>
}));

describe('DashboardSettingsPage', () => {
  it('renders without crashing', () => {
    render(<DashboardSettingsPage />);
    expect(screen.getByTestId('mock-dashboard-settings-client')).toBeInTheDocument();
  });

  it('renders the DashboardSettingsClient component', () => {
    render(<DashboardSettingsPage />);
    expect(screen.getByTestId('mock-dashboard-settings-client')).toBeInTheDocument();
    expect(screen.getByText('Settings Client Mock')).toBeInTheDocument();
  });
});
