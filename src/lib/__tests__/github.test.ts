import { describe, it, expect, vi } from "vitest";
import { headers, handleRateLimit, getTopK, processResult } from "@/lib/github";
import { GitHubApiError, RateLimitError } from "@/lib/types";

vi.mock("server-only", () => ({}));

describe("github base helpers", () => {
  describe("headers()", () => {
    it("should return base headers without token", () => {
      const h = headers();
      expect(h).toEqual({
        Accept: "application/vnd.github+json",
        "User-Agent": "github-user-summary",
      });
    });

    it("should add Authorization header with valid token", () => {
      const h = headers("valid-token_123");
      expect((h as Record<string, string>).Authorization).toBe("Bearer valid-token_123");
    });

    it("should throw GitHubApiError for invalid token format", () => {
      expect(() => headers("invalid token!")).toThrow(GitHubApiError);
      expect(() => headers("invalid token!")).toThrow("Invalid token format");
    });
  });

  describe("handleRateLimit()", () => {
    it("should parse X-RateLimit-Reset and throw RateLimitError", () => {
      const mockResponse = {
        headers: {
          get: (name: string) => (name === "X-RateLimit-Reset" ? "1234567890" : null),
        },
      } as unknown as Response;

      expect(() => handleRateLimit(mockResponse)).toThrow(RateLimitError);
      try {
        handleRateLimit(mockResponse);
      } catch (e) {
        expect((e as RateLimitError).resetAt).toEqual(new Date(1234567890 * 1000));
      }
    });

    it("should use fallback timestamp if X-RateLimit-Reset is missing", () => {
      const mockResponse = {
        headers: { get: () => null },
      } as unknown as Response;

      expect(() => handleRateLimit(mockResponse)).toThrow(RateLimitError);
      try {
        handleRateLimit(mockResponse);
      } catch (e) {
        expect((e as RateLimitError).resetAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it("should use fallback timestamp if X-RateLimit-Reset is invalid", () => {
      const mockResponse = {
        headers: { get: () => "invalid-timestamp" },
      } as unknown as Response;

      expect(() => handleRateLimit(mockResponse)).toThrow(RateLimitError);
      try {
        handleRateLimit(mockResponse);
      } catch (e) {
        expect((e as RateLimitError).resetAt.getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  describe("getTopK()", () => {
    it("should return empty array for empty map", () => {
      const map = new Map<string, number>();
      expect(getTopK(map, 5)).toEqual([]);
    });

    it("should return sorted items limited to K", () => {
      const map = new Map<string, number>([
        ["a", 10],
        ["b", 30],
        ["c", 20],
        ["d", 5],
      ]);

      const result = getTopK(map, 2);
      expect(result).toEqual([
        { name: "b", count: 30 },
        { name: "c", count: 20 },
      ]);
    });

    it("should handle K <= 0 by returning empty array", () => {
      const map = new Map<string, number>([["a", 10]]);
      expect(getTopK(map, 0)).toEqual([]);
      expect(getTopK(map, -1)).toEqual([]);
    });
  });

  describe("processResult()", () => {
    it("should return value for fulfilled result", () => {
      const result: PromiseSettledResult<string> = { status: "fulfilled", value: "success" };
      const errors: { section: string; message: string }[] = [];

      expect(processResult(result, "test-section", errors)).toBe("success");
      expect(errors).toHaveLength(0);
    });

    it("should push error and return null for rejected result", () => {
      const result: PromiseSettledResult<string> = { status: "rejected", reason: new Error("test error") };
      const errors: { section: string; message: string }[] = [];

      expect(processResult(result, "test-section", errors)).toBeNull();
      expect(errors).toEqual([{ section: "test-section", message: "test error" }]);
    });

    it("should handle rejected result with null reason", () => {
      const result: PromiseSettledResult<string> = { status: "rejected", reason: null };
      const errors: { section: string; message: string }[] = [];

      expect(processResult(result, "test-section", errors)).toBeNull();
      expect(errors).toEqual([{ section: "test-section", message: "Unknown error" }]);
    });
  });
});
