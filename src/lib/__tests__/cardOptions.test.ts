import { describe, it, expect } from 'vitest';
import {
  resolveBlockLayout,
  parseCardQueryParams,
  CardRenderOptions,
  CardBlockType,
  DEFAULT_BLOCKS
} from '../cardOptions';

describe('cardOptions', () => {
  describe('resolveBlockLayout', () => {
    const baseOptions: Omit<CardRenderOptions, 'cols' | 'layout' | 'blocks'> = {
      format: 'svg',
      theme: 'light',
      hide: new Set(),
      width: 600,
    };

    it('should assign all blocks to full in 1-column layout, ignoring explicit assignments', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 1,
        blocks: ['bio', 'stats', 'langs'],
        layout: {
          bio: 'left',
          stats: 'right',
          langs: 'full'
        },
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: ['bio', 'stats', 'langs'],
        left: [],
        right: [],
      });
    });

    it('should assign all blocks to full in 1-column layout without explicit assignments', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 1,
        blocks: ['bio', 'stats', 'langs'],
        layout: {},
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: ['bio', 'stats', 'langs'],
        left: [],
        right: [],
      });
    });

    it('should respect explicit left/right assignments in 2-column layout', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: ['bio', 'stats', 'langs', 'repos'],
        layout: {
          bio: 'left',
          stats: 'right',
          langs: 'full',
        },
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: ['langs'],
        left: ['bio', 'repos'],
        right: ['stats'],
      });
    });

    it('should distribute unassigned blocks evenly in 2-column layout', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: ['bio', 'stats', 'langs', 'repos', 'streak'],
        layout: {},
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: [],
        left: ['bio', 'langs', 'streak'],
        right: ['stats', 'repos'],
      });
    });

    it('should balance unassigned blocks based on explicit assignments', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: ['bio', 'stats', 'langs', 'repos', 'streak'],
        layout: {
          bio: 'left',
          stats: 'left',
        },
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: [],
        left: ['bio', 'stats', 'streak'],
        right: ['langs', 'repos'],
      });
    });

    it('should assign explicit full blocks to full in 2-column layout', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: ['bio', 'stats', 'langs'],
        layout: {
          bio: 'full',
        },
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: ['bio'],
        left: ['stats'],
        right: ['langs'],
      });
    });

    it('should ignore invalid slots in explicit layout assignments', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: ['bio', 'stats'],
        layout: {
          // @ts-ignore: testing invalid value at runtime
          bio: 'invalid_slot',
        },
      };

      const result = resolveBlockLayout(options);

      // 'bio' gets assigned to 'invalid_slot', so it falls into the 'else' block
      // of 'if (slot === "left") { ... } else if (slot === "right") { ... } else { full.push(block) }'
      // Thus 'bio' goes to 'full'.
      // 'stats' has no assignment, remaining blocks go left then right.
      expect(result).toEqual({
        full: ['bio'],
        left: ['stats'],
        right: [],
      });
    });

    it('should ignore unrequested blocks in layout assignments', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: ['bio'],
        layout: {
          bio: 'left',
          stats: 'right', // Not requested in blocks
        },
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: [],
        left: ['bio'],
        right: [],
      });
    });

    it('should handle empty blocks array', () => {
      const options: CardRenderOptions = {
        ...baseOptions,
        cols: 2,
        blocks: [],
        layout: {},
      };

      const result = resolveBlockLayout(options);

      expect(result).toEqual({
        full: [],
        left: [],
        right: [],
      });
    });
  });

  describe('parseCardQueryParams', () => {
    it('should return default options for empty URLSearchParams', () => {
      const searchParams = new URLSearchParams();
      const options = parseCardQueryParams(searchParams);

      expect(options).toEqual({
        format: 'png',
        theme: 'light',
        blocks: DEFAULT_BLOCKS,
        cols: 1,
        layout: {},
        hide: new Set(),
        width: 600,
      });
    });

    it('should parse format correctly', () => {
      let options = parseCardQueryParams(new URLSearchParams('format=svg'));
      expect(options.format).toBe('svg');

      options = parseCardQueryParams(new URLSearchParams('format=png'));
      expect(options.format).toBe('png');

      options = parseCardQueryParams(new URLSearchParams('format=invalid'));
      expect(options.format).toBe('png');
    });

    it('should parse theme correctly', () => {
      let options = parseCardQueryParams(new URLSearchParams('theme=dark'));
      expect(options.theme).toBe('dark');

      options = parseCardQueryParams(new URLSearchParams('theme=light'));
      expect(options.theme).toBe('light');

      options = parseCardQueryParams(new URLSearchParams('theme=invalid'));
      expect(options.theme).toBe('light');
    });

    it('should parse cols correctly', () => {
      let options = parseCardQueryParams(new URLSearchParams('cols=2'));
      expect(options.cols).toBe(2);

      options = parseCardQueryParams(new URLSearchParams('cols=1'));
      expect(options.cols).toBe(1);

      options = parseCardQueryParams(new URLSearchParams('cols=invalid'));
      expect(options.cols).toBe(1);
    });

    it('should parse blocks correctly', () => {
      // Valid blocks
      let options = parseCardQueryParams(new URLSearchParams('blocks=bio,streak'));
      expect(options.blocks).toEqual(['bio', 'streak']);

      // Invalid blocks are filtered out
      options = parseCardQueryParams(new URLSearchParams('blocks=bio,invalid,streak'));
      expect(options.blocks).toEqual(['bio', 'streak']);

      // All invalid blocks fallback to default
      options = parseCardQueryParams(new URLSearchParams('blocks=invalid'));
      expect(options.blocks).toEqual(DEFAULT_BLOCKS);

      // Empty string falls back to default
      options = parseCardQueryParams(new URLSearchParams('blocks='));
      expect(options.blocks).toEqual(DEFAULT_BLOCKS);
    });

    it('should parse layout correctly', () => {
      // Valid layout
      let options = parseCardQueryParams(new URLSearchParams('layout=left:bio,right:streak,full:langs'));
      expect(options.layout).toEqual({
        bio: 'left',
        streak: 'right',
        langs: 'full'
      });

      // Invalid slots or blocks are ignored
      options = parseCardQueryParams(new URLSearchParams('layout=invalid:bio,left:invalid_block,right:streak'));
      expect(options.layout).toEqual({
        streak: 'right'
      });

      // Malformed layout is ignored
      options = parseCardQueryParams(new URLSearchParams('layout=bio,streak'));
      expect(options.layout).toEqual({});
    });

    it('should parse hide correctly', () => {
      let options = parseCardQueryParams(new URLSearchParams('hide=stars,forks'));
      expect(options.hide).toEqual(new Set(['stars', 'forks']));

      options = parseCardQueryParams(new URLSearchParams('hide='));
      expect(options.hide).toEqual(new Set());
    });

    it('should parse width correctly', () => {
      // Valid width
      let options = parseCardQueryParams(new URLSearchParams('width=800'));
      expect(options.width).toBe(800);

      // Width below minimum falls back to 600
      options = parseCardQueryParams(new URLSearchParams('width=100'));
      expect(options.width).toBe(600);

      // Width above maximum falls back to 600
      options = parseCardQueryParams(new URLSearchParams('width=2000'));
      expect(options.width).toBe(600);

      // Invalid number falls back to 600
      options = parseCardQueryParams(new URLSearchParams('width=invalid'));
      expect(options.width).toBe(600);

      // NaN falls back to 600
      options = parseCardQueryParams(new URLSearchParams('width=NaN'));
      expect(options.width).toBe(600);
    });
  });
});
