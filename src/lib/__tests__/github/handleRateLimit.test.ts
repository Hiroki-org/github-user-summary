import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleRateLimit } from "../../github";
import { RateLimitError } from "../../types";

describe("handleRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z")); // 1704067200 in seconds
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws RateLimitError with valid X-RateLimit-Reset header", () => {
    const validTimestamp = 1704070800; // 1 hour later
    const res = {
      headers: new Headers({ "X-RateLimit-Reset": validTimestamp.toString() })
    } as unknown as Response;

    try {
      handleRateLimit(res);
      expect.fail("Should throw RateLimitError");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).resetAt.getTime()).toBe(validTimestamp * 1000);
    }
  });

  it("throws RateLimitError with fallback timestamp when header is missing", () => {
    const res = {
      headers: new Headers() // Empty headers
    } as unknown as Response;

    const currentSeconds = Math.floor(Date.now() / 1000);
    const expectedFallback = currentSeconds + 3600;

    try {
      handleRateLimit(res);
      expect.fail("Should throw RateLimitError");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).resetAt.getTime()).toBe(expectedFallback * 1000);
    }
  });

  it("throws RateLimitError with fallback timestamp when header is invalid", () => {
    const res = {
      headers: new Headers({ "X-RateLimit-Reset": "invalid_timestamp" })
    } as unknown as Response;

    const currentSeconds = Math.floor(Date.now() / 1000);
    const expectedFallback = currentSeconds + 3600;

    try {
      handleRateLimit(res);
      expect.fail("Should throw RateLimitError");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).resetAt.getTime()).toBe(expectedFallback * 1000);
    }
  });
});
