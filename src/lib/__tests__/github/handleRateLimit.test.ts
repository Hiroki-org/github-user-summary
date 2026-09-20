import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleRateLimit } from "../../github";
import { RateLimitError } from "../../types";

describe("handleRateLimit", () => {
  beforeEach(() => {
    // 2024-01-01T00:00:00.000Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws RateLimitError with the reset date when X-RateLimit-Reset header is present and valid", () => {
    // Set a valid timestamp: 1 hour later (3600 seconds)
    // 2024-01-01T01:00:00.000Z => 1704070800
    const resetTimestamp = "1704070800";

    const res = {
      headers: {
        get: vi.fn().mockReturnValue(resetTimestamp),
      },
    } as unknown as Response;

    try {
      handleRateLimit(res);
      expect.fail("Expected RateLimitError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        // Reset date should be exactly 2024-01-01T01:00:00.000Z
        expect(error.resetAt.getTime()).toBe(Number.parseInt(resetTimestamp, 10) * 1000);
      }
    }
  });

  it("falls back to ~1 hour from now when X-RateLimit-Reset header is missing", () => {
    const res = {
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    } as unknown as Response;

    try {
      handleRateLimit(res);
      expect.fail("Expected RateLimitError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        const expectedTimestamp = Math.floor(Date.now() / 1000) + 3600;
        expect(error.resetAt.getTime()).toBe(expectedTimestamp * 1000);
      }
    }
  });

  it("falls back to ~1 hour from now when X-RateLimit-Reset header is invalid (NaN)", () => {
    const res = {
      headers: {
        get: vi.fn().mockReturnValue("invalid"),
      },
    } as unknown as Response;

    try {
      handleRateLimit(res);
      expect.fail("Expected RateLimitError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        const expectedTimestamp = Math.floor(Date.now() / 1000) + 3600;
        expect(error.resetAt.getTime()).toBe(expectedTimestamp * 1000);
      }
    }
  });
});
