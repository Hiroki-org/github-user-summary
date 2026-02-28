import { describe, it, expect } from "vitest";
import {
  UserNotFoundError,
  RateLimitError,
  GitHubApiError,
} from "../types";

/**
 * Unit tests for custom error classes
 *
 * Test targets:
 * - UserNotFoundError: message, name, instanceof chain
 * - RateLimitError: message, name, resetAt calculation
 * - GitHubApiError: message, name, status property
 * - All errors inherit from Error
 */

describe("UserNotFoundError", () => {
  it("sets message containing username", () => {
    const error = new UserNotFoundError("testuser");
    expect(error.message).toBe('User "testuser" not found');
  });

  it('sets name to "UserNotFoundError"', () => {
    const error = new UserNotFoundError("testuser");
    expect(error.name).toBe("UserNotFoundError");
  });

  it("is instance of Error", () => {
    const error = new UserNotFoundError("testuser");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UserNotFoundError);
  });

  it("works correctly even with usernames containing special characters", () => {
    const error = new UserNotFoundError("user-with-dashes_123");
    expect(error.message).toContain("user-with-dashes_123");
  });
});

describe("RateLimitError", () => {
  it("holds resetAt as a Date object", () => {
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    const error = new RateLimitError(timestamp);
    expect(error.resetAt).toBeInstanceOf(Date);
  });

  it("calculates resetAt correctly from timestamp", () => {
    const timestamp = 1700000000; // 2023-11-14T22:13:20Z
    const error = new RateLimitError(timestamp);
    expect(error.resetAt.getTime()).toBe(timestamp * 1000);
  });

  it("includes ISO date string in message", () => {
    const timestamp = 1700000000;
    const error = new RateLimitError(timestamp);
    expect(error.message).toContain("rate limit exceeded");
    expect(error.message).toContain(new Date(timestamp * 1000).toISOString());
  });

  it('sets name to "RateLimitError"', () => {
    const error = new RateLimitError(1700000000);
    expect(error.name).toBe("RateLimitError");
  });

  it("is instance of Error", () => {
    const error = new RateLimitError(1700000000);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RateLimitError);
  });
});

describe("GitHubApiError", () => {
  it("holds message and status code", () => {
    const error = new GitHubApiError("Bad Request", 400);
    expect(error.message).toBe("Bad Request");
    expect(error.status).toBe(400);
  });

  it('sets name to "GitHubApiError"', () => {
    const error = new GitHubApiError("Internal Server Error", 500);
    expect(error.name).toBe("GitHubApiError");
  });

  it("is instance of Error", () => {
    const error = new GitHubApiError("Not Found", 404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GitHubApiError);
  });

  it("holds various HTTP status codes correctly", () => {
    const codes = [400, 401, 403, 404, 422, 500, 502, 503];
    for (const code of codes) {
      const error = new GitHubApiError(`Error ${code}`, code);
      expect(error.status).toBe(code);
    }
  });
});
