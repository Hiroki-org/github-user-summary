import { describe, it, expect } from "vitest";
import { headers } from "../../github";
import { GitHubApiError } from "../../types";

describe("headers", () => {
  it("should return base headers when no token is provided", () => {
    const result = headers();
    expect(result).toEqual({
      Accept: "application/vnd.github+json",
      "User-Agent": "github-user-summary",
    });
  });

  it("should include Authorization header when a valid token is provided", () => {
    const validToken = "ghp_12345ValidToken";
    const result = headers(validToken);
    expect(result).toEqual({
      Accept: "application/vnd.github+json",
      "User-Agent": "github-user-summary",
      Authorization: `Bearer ${validToken}`,
    });
  });

  it("should throw a GitHubApiError when an invalid token format is provided", () => {
    const invalidToken = "invalid token!";
    expect(() => headers(invalidToken)).toThrow(GitHubApiError);
    expect(() => headers(invalidToken)).toThrow("Invalid token format");
  });
});
