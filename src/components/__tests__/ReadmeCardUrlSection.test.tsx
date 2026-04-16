// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ReadmeCardUrlSection, { generateReadmeUrl } from '../ReadmeCardUrlSection';
import { DEFAULT_CARD_LAYOUT } from '@/lib/types';

describe('generateReadmeUrl', () => {
  const baseOptions = {
    showAvatar: true,
    showBio: true,
    showStats: true,
    showLanguage: true,
    showRepos: true,
    showContributionBreakdown: true,
    showActivityBreakdown: true,
  };

  it('returns empty string if username is missing', () => {
    expect(
      generateReadmeUrl({
        username: null,
        layout: DEFAULT_CARD_LAYOUT,
        options: baseOptions,
        readmeTheme: 'light',
        readmeCols: 1,
        includeStreak: false,
        includeHeatmap: false,
        origin: 'http://localhost:3000',
      })
    ).toBe('');
  });

  it('generates basic URL correctly', () => {
    const url = generateReadmeUrl({
      username: 'testuser',
      layout: DEFAULT_CARD_LAYOUT,
      options: baseOptions,
      readmeTheme: 'dark',
      readmeCols: 2,
      includeStreak: false,
      includeHeatmap: false,
      origin: 'https://example.com',
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://example.com');
    expect(parsed.pathname).toBe('/api/card/testuser');
    expect(parsed.searchParams.get('format')).toBe('png');
    expect(parsed.searchParams.get('theme')).toBe('dark');
    expect(parsed.searchParams.get('cols')).toBe('2');
    expect(parsed.searchParams.get('blocks')).toBe('bio,stats,langs,repos');
    expect(parsed.searchParams.get('width')).toBe('600');
    // Ensure layout parts contains correct formatted values for full, left and right
    const layout = parsed.searchParams.get('layout');
    expect(layout).toContain('left:bio');
    expect(layout).toContain('left:stats');
    expect(layout).toContain('right:langs');
    expect(layout).toContain('right:repos');
  });

  it('includes streak and heatmap when requested', () => {
    const url = generateReadmeUrl({
      username: 'testuser',
      layout: DEFAULT_CARD_LAYOUT,
      options: baseOptions,
      readmeTheme: 'light',
      readmeCols: 1,
      includeStreak: true,
      includeHeatmap: true,
      origin: 'https://example.com',
    });

    const parsed = new URL(url);
    const blocks = parsed.searchParams.get('blocks')?.split(',') || [];
    expect(blocks).toContain('streak');
    expect(blocks).toContain('heatmap');
  });

  it('adds hide parameters when breakdowns are disabled', () => {
    const url = generateReadmeUrl({
      username: 'testuser',
      layout: DEFAULT_CARD_LAYOUT,
      options: {
        ...baseOptions,
        showContributionBreakdown: false,
        showActivityBreakdown: false,
      },
      readmeTheme: 'light',
      readmeCols: 1,
      includeStreak: false,
      includeHeatmap: false,
      origin: 'https://example.com',
    });

    const parsed = new URL(url);
    const hide = parsed.searchParams.get('hide')?.split(',') || [];
    expect(hide).toContain('stars');
    expect(hide).toContain('forks');
  });
});

describe('ReadmeCardUrlSection', () => {
  const baseOptions = {
    showAvatar: true,
    showBio: true,
    showStats: true,
    showLanguage: true,
    showRepos: true,
    showContributionBreakdown: true,
    showActivityBreakdown: true,
  };

  const defaultProps = {
    username: 'testuser',
    layout: DEFAULT_CARD_LAYOUT,
    options: baseOptions,
  };

  beforeEach(() => {
    // Mock window.location.origin
    vi.stubGlobal('window', {
      ...globalThis.window,
      location: {
        ...globalThis.window?.location,
        origin: 'http://localhost:3000',
      },
    });

    // Mock navigator.clipboard
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders sign in prompt when username is null', () => {
    render(<ReadmeCardUrlSection {...defaultProps} username={null} />);
    expect(screen.getByText('Sign in to generate your README URL')).toBeInTheDocument();
  });

  it('renders default generated URL', () => {
    render(<ReadmeCardUrlSection {...defaultProps} />);

    const urlContainer = screen.getByText(/http:\/\/localhost:3000\/api\/card\/testuser\?format=png/);
    expect(urlContainer).toBeInTheDocument();

    const urlText = urlContainer.textContent || '';
    expect(urlText).toContain('theme=light');
    expect(urlText).toContain('cols=1');
  });

  it('updates URL when Theme and Columns are changed', async () => {
    const user = userEvent.setup();
    render(<ReadmeCardUrlSection {...defaultProps} />);

    const themeSelect = screen.getByRole('combobox', { name: /theme/i });
    await user.selectOptions(themeSelect, 'dark');

    const colsSelect = screen.getByRole('combobox', { name: /columns/i });
    await user.selectOptions(colsSelect, '2');

    const urlContainer = screen.getByText(/http:\/\/localhost:3000\/api\/card\/testuser\?format=png/);
    const urlText = urlContainer.textContent || '';

    expect(urlText).toContain('theme=dark');
    expect(urlText).toContain('cols=2');
  });

  it('updates URL when streak and heatmap options are checked', async () => {
    const user = userEvent.setup();
    render(<ReadmeCardUrlSection {...defaultProps} />);

    const streakCheckbox = screen.getByRole('checkbox', { name: /include streak/i });
    await user.click(streakCheckbox);

    const heatmapCheckbox = screen.getByRole('checkbox', { name: /include heatmap/i });
    await user.click(heatmapCheckbox);

    const urlContainer = screen.getByText(/http:\/\/localhost:3000\/api\/card\/testuser\?format=png/);
    const urlText = urlContainer.textContent || '';

    expect(urlText).toContain('streak');
    expect(urlText).toContain('heatmap');
  });

  it('handles copy to clipboard success', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: mockWriteText }, configurable: true });
    render(<ReadmeCardUrlSection {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy url/i });
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('handles copy to clipboard failure', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Failed to copy'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: mockWriteText }, configurable: true });

    render(<ReadmeCardUrlSection {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy url/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copy failed')).toBeInTheDocument();
  });
});
