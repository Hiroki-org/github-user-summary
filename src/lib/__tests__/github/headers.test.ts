import { describe, it, expect } from "vitest";
import { headers } from "../../github";
import { GitHubApiError } from "../../types";

describe("headers", () => {
  it("returns default headers when no token is provided", () => {
    const result = headers();
    expect(result).toEqual({
      Accept: "application/vnd.github+json",
      "User-Agent": "github-user-summary",
    });
  });

  it("returns default headers with Authorization when a valid token is provided", () => {
    const token = "ghp_validToken123";
    const result = headers(token);
    expect(result).toEqual({
      Accept: "application/vnd.github+json",
      "User-Agent": "github-user-summary",
      Authorization: `Bearer ${token}`,
    });
  });

  it("throws GitHubApiError when an invalid token is provided", () => {
    const invalidToken = "ghp_invalid token 123!";
    expect(() => headers(invalidToken)).toThrow(GitHubApiError);
    expect(() => headers(invalidToken)).toThrowError("Invalid token format");

    try {
      headers(invalidToken);
    } catch (error) {
      expect(error).toBeInstanceOf(GitHubApiError);
      if (error instanceof GitHubApiError) {
        expect(error.status).toBe(400);
      }
    }
  });
});
