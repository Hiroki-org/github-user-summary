import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRateLimit } from '../../github';

describe('handleRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000)); // Timestamp: 1700000000
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throw RateLimitError with the reset timestamp from the header', () => {
    const headers = new Headers();
    headers.set('X-RateLimit-Reset', '1700003600');
    const res = new Response(null, { headers });

    expect(() => handleRateLimit(res)).toThrowError(
      expect.objectContaining({
        message: 'GitHub API rate limit exceeded. Resets at 2023-11-14T23:13:20.000Z',
        resetAt: new Date(1700003600 * 1000),
        name: 'RateLimitError'
      })
    );
  });

  it('should throw RateLimitError with a fallback timestamp (1 hour from now) if header is missing', () => {
    const headers = new Headers();
    const res = new Response(null, { headers });

    // 1700000000 + 3600 = 1700003600
    expect(() => handleRateLimit(res)).toThrowError(
      expect.objectContaining({
        message: 'GitHub API rate limit exceeded. Resets at 2023-11-14T23:13:20.000Z',
        resetAt: new Date(1700003600 * 1000),
        name: 'RateLimitError'
      })
    );
  });

  it('should throw RateLimitError with a fallback timestamp if header is invalid', () => {
    const headers = new Headers();
    headers.set('X-RateLimit-Reset', 'invalid_timestamp');
    const res = new Response(null, { headers });

    // Number.parseInt('invalid_timestamp', 10) returns NaN, which fails Number.isFinite()
    // Fallback: 1700000000 + 3600 = 1700003600
    expect(() => handleRateLimit(res)).toThrowError(
      expect.objectContaining({
        message: 'GitHub API rate limit exceeded. Resets at 2023-11-14T23:13:20.000Z',
        resetAt: new Date(1700003600 * 1000),
        name: 'RateLimitError'
      })
    );
  });
});
