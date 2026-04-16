// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DashboardSettingsClient from '../DashboardSettingsClient';
import * as nextAuth from 'next-auth/react';
import * as cardSettings from '@/lib/cardSettings';
import type { CardLayout, CardDisplayOptions } from '@/lib/types';

// Mocks
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/components/LayoutEditor', () => ({
  default: ({ onToggleBlockVisibility, layout }: { onToggleBlockVisibility: (id: string) => void, layout: CardLayout }) => (
    <div data-testid="layout-editor" data-layout={JSON.stringify(layout)}>
      <button onClick={() => onToggleBlockVisibility('avatar')}>Toggle Avatar</button>
    </div>
  ),
}));

vi.mock('@/components/DisplayOptionsSection', () => ({
  default: ({ options, setOptions }: { options: CardDisplayOptions, setOptions: (updater: (prev: CardDisplayOptions) => CardDisplayOptions) => void }) => (
    <div data-testid="display-options" data-options={JSON.stringify(options)}>
      <button onClick={() => setOptions((prev) => ({ ...prev, showCompany: false }))}>Toggle Company</button>
    </div>
  ),
}));

vi.mock('@/components/ReadmeCardUrlSection', () => ({
  default: ({ username }: { username?: string | null }) => <div data-testid="readme-card-url" data-username={username || ''} />,
}));

vi.mock('@/lib/cardSettings', () => ({
  getDefaultCardSettings: vi.fn(),
  loadCardSettings: vi.fn(),
  saveCardSettings: vi.fn(),
}));

describe('DashboardSettingsClient', () => {
  const mockSession = {
    data: {
      user: {
        login: 'testuser',
      },
    },
    status: 'authenticated',
  };

  const defaultLayout: CardLayout = {
    blocks: [
      { id: 'avatar', visible: true, column: 'left' },
      { id: 'bio', visible: true, column: 'left' },
    ]
  };

  const defaultOptions: CardDisplayOptions = {
    showCompany: true,
  };

  const defaultSettings = {
    layout: defaultLayout,
    options: defaultOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nextAuth.useSession).mockReturnValue(mockSession as unknown as never);
    vi.mocked(cardSettings.loadCardSettings).mockReturnValue(defaultSettings);
    vi.mocked(cardSettings.getDefaultCardSettings).mockReturnValue({
      layout: {
        blocks: [
          { id: 'avatar', visible: false, column: 'left' },
          { id: 'bio', visible: false, column: 'left' },
        ]
      },
      options: {
        showCompany: false,
      }
    });
  });

  it('renders correctly with loaded settings', () => {
    render(<DashboardSettingsClient />);

    expect(screen.getByText('Card Settings')).toBeInTheDocument();
    expect(screen.getByTestId('layout-editor')).toBeInTheDocument();
    expect(screen.getByTestId('display-options')).toBeInTheDocument();
    expect(screen.getByTestId('readme-card-url')).toBeInTheDocument();
    expect(screen.getByTestId('readme-card-url')).toHaveAttribute('data-username', 'testuser');

    // Check if initialized with loadCardSettings
    expect(cardSettings.loadCardSettings).toHaveBeenCalledTimes(2); // called in two useState initializers
  });

  it('handles save action', () => {
    render(<DashboardSettingsClient />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(cardSettings.saveCardSettings).toHaveBeenCalledWith(
      defaultSettings.layout,
      defaultSettings.options
    );
    expect(screen.getByText('Saved to local settings.')).toBeInTheDocument();
  });

  it('handles reset action', () => {
    render(<DashboardSettingsClient />);

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    const defaults = cardSettings.getDefaultCardSettings();

    expect(cardSettings.saveCardSettings).toHaveBeenCalledWith(
      defaults.layout,
      defaults.options
    );
    expect(screen.getByText('Reset to defaults.')).toBeInTheDocument();
  });

  it('handles layout block visibility toggle', () => {
    render(<DashboardSettingsClient />);

    const toggleAvatarButton = screen.getByText('Toggle Avatar');
    fireEvent.click(toggleAvatarButton);

    // layout should be updated. the new layout's avatar block visible property should be toggled
    const layoutEditor = screen.getByTestId('layout-editor');
    const updatedLayout = JSON.parse(layoutEditor.getAttribute('data-layout') || '{}');

    expect(updatedLayout.blocks[0].id).toBe('avatar');
    expect(updatedLayout.blocks[0].visible).toBe(false); // originally true, so it becomes false
    expect(updatedLayout.blocks[1].visible).toBe(true); // untouched
  });

  it('handles display options change', () => {
    render(<DashboardSettingsClient />);

    const toggleCompanyButton = screen.getByText('Toggle Company');
    fireEvent.click(toggleCompanyButton);

    const displayOptions = screen.getByTestId('display-options');
    const updatedOptions = JSON.parse(displayOptions.getAttribute('data-options') || '{}');

    expect(updatedOptions.showCompany).toBe(false);
  });
});
