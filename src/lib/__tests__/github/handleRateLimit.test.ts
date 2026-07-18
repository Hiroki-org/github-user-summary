import { describe, it, expect } from "vitest";
import { handleRateLimit } from "../../github";
import { RateLimitError } from "../../types";

describe("handleRateLimit", () => {
  it("throws RateLimitError with parsed reset timestamp when X-RateLimit-Reset header is present", () => {
    const timestamp = Math.floor(Date.now() / 1000) + 7200;
    const res = {
      headers: new Headers({
        "X-RateLimit-Reset": timestamp.toString(),
      }),
    } as unknown as Response;

    expect(() => handleRateLimit(res)).toThrowError(RateLimitError);

    try {
      handleRateLimit(res);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        expect(error.resetAt.getTime()).toBe(timestamp * 1000);
      }
    }
  });

  it("throws RateLimitError with 1 hour fallback when X-RateLimit-Reset header is missing", () => {
    const res = {
      headers: new Headers(),
    } as unknown as Response;

    const before = Math.floor(Date.now() / 1000) + 3600;

    try {
      handleRateLimit(res);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        const after = Math.floor(Date.now() / 1000) + 3600;
        const expectedTime = Math.floor(error.resetAt.getTime() / 1000);
        expect(expectedTime).toBeGreaterThanOrEqual(before);
        expect(expectedTime).toBeLessThanOrEqual(after);
      }
    }
  });

  it("throws RateLimitError with 1 hour fallback when X-RateLimit-Reset header is invalid", () => {
    const res = {
      headers: new Headers({
        "X-RateLimit-Reset": "invalid",
      }),
    } as unknown as Response;

    const before = Math.floor(Date.now() / 1000) + 3600;

    try {
      handleRateLimit(res);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        const after = Math.floor(Date.now() / 1000) + 3600;
        const expectedTime = Math.floor(error.resetAt.getTime() / 1000);
        expect(expectedTime).toBeGreaterThanOrEqual(before);
        expect(expectedTime).toBeLessThanOrEqual(after);
      }
    }
  });
});
