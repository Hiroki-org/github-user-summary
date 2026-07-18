import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleRateLimit } from "@/lib/github";
import { RateLimitError } from "@/lib/types";

describe("handleRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws RateLimitError using X-RateLimit-Reset header when available", () => {
    const timestamp = 1704069000; // 2024-01-01T00:30:00Z
    const headers = new Headers();
    headers.set("X-RateLimit-Reset", timestamp.toString());
    const mockResponse = {
      headers
    } as unknown as Response;

    expect(() => handleRateLimit(mockResponse)).toThrow(RateLimitError);
    try {
      handleRateLimit(mockResponse);
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const error = e as RateLimitError;
      expect(error.resetAt.getTime()).toBe(timestamp * 1000);
    }
  });

  it("throws RateLimitError using default time (1 hour from now) when header is missing", () => {
    const headers = new Headers();
    const mockResponse = {
      headers
    } as unknown as Response;

    const expectedTimestamp = Math.floor(Date.now() / 1000) + 3600;

    expect(() => handleRateLimit(mockResponse)).toThrow(RateLimitError);
    try {
      handleRateLimit(mockResponse);
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const error = e as RateLimitError;
      expect(error.resetAt.getTime()).toBe(expectedTimestamp * 1000);
    }
  });

  it("throws RateLimitError using default time when header is invalid", () => {
    const headers = new Headers();
    headers.set("X-RateLimit-Reset", "invalid");
    const mockResponse = {
      headers
    } as unknown as Response;

    const expectedTimestamp = Math.floor(Date.now() / 1000) + 3600;

    expect(() => handleRateLimit(mockResponse)).toThrow(RateLimitError);
    try {
      handleRateLimit(mockResponse);
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const error = e as RateLimitError;
      expect(error.resetAt.getTime()).toBe(expectedTimestamp * 1000);
    }
  });
});
