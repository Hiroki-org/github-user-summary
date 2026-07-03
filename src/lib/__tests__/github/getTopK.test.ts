import { describe, it, expect } from 'vitest';
import { getTopK } from '../../github';

describe('getTopK', () => {
  it('returns correctly sorted array when exact k elements are present', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    const top = getTopK(map, 3);
    expect(top).toEqual([
      { name: 'c', count: 3 },
      { name: 'b', count: 2 },
      { name: 'a', count: 1 },
    ]);
  });

  it('returns correctly sorted array when fewer than k elements are present', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const top = getTopK(map, 3);
    expect(top).toEqual([
      { name: 'b', count: 2 },
      { name: 'a', count: 1 },
    ]);
  });

  it('returns correctly sorted array when more than k elements are present', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 5],
      ['d', 4],
      ['e', 3],
    ]);
    const top = getTopK(map, 3);
    expect(top).toEqual([
      { name: 'c', count: 5 },
      { name: 'd', count: 4 },
      { name: 'e', count: 3 },
    ]);
  });

  it('handles empty map', () => {
    const map = new Map();
    const top = getTopK(map, 3);
    expect(top).toEqual([]);
  });

  it('handles same counts', () => {
    const map = new Map([
      ['a', 2],
      ['b', 2],
      ['c', 2],
      ['d', 1],
    ]);
    const top = getTopK(map, 3);
    // The elements with the same count should just be preserved, we just verify count descending
    expect(top.length).toBe(3);
    expect(top[0].count).toBe(2);
    expect(top[1].count).toBe(2);
    expect(top[2].count).toBe(2);
  });
});
