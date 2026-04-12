import { describe, expect, it } from 'vitest';
import { generateReadmeUrl } from '../ReadmeCardUrlSection';
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
