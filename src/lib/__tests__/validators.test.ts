import { describe, it, expect } from "vitest";
import { isValidGitHubUsername } from "../validators";

/**
 * Unit tests for isValidGitHubUsername
 *
 * GitHub username rules:
 * - Alphanumeric or hyphen
 * - Cannot start/end with hyphen
 * - No consecutive hyphens (handled by lookahead)
 * - Max 39 characters
 */

describe("isValidGitHubUsername", () => {
  // ---------- Valid usernames ----------
  it("valid for alphanumeric only usernames", () => {
    expect(isValidGitHubUsername("testuser")).toBe(true);
  });

  it("valid for 1 character usernames", () => {
    expect(isValidGitHubUsername("a")).toBe(true);
  });

  it("valid for numbers only usernames", () => {
    expect(isValidGitHubUsername("12345")).toBe(true);
  });

  it("valid for usernames containing hyphens", () => {
    expect(isValidGitHubUsername("test-user")).toBe(true);
  });

  it("valid for usernames containing multiple hyphens", () => {
    expect(isValidGitHubUsername("my-test-user")).toBe(true);
  });

  it("valid for 39 characters usernames", () => {
    expect(isValidGitHubUsername("a".repeat(39))).toBe(true);
  });

  it("valid for usernames containing uppercase letters", () => {
    expect(isValidGitHubUsername("TestUser")).toBe(true);
  });

  // ---------- Invalid usernames ----------
  it("invalid for empty string", () => {
    expect(isValidGitHubUsername("")).toBe(false);
  });

  it("invalid for usernames starting with hyphen", () => {
    expect(isValidGitHubUsername("-testuser")).toBe(false);
  });

  it("invalid for usernames ending with hyphen", () => {
    expect(isValidGitHubUsername("testuser-")).toBe(false);
  });

  it("invalid for usernames containing consecutive hyphens", () => {
    expect(isValidGitHubUsername("test--user")).toBe(false);
  });

  it("invalid for 40 characters or more usernames", () => {
    expect(isValidGitHubUsername("a".repeat(40))).toBe(false);
  });

  it("invalid for usernames containing special characters", () => {
    expect(isValidGitHubUsername("test@user")).toBe(false);
    expect(isValidGitHubUsername("test.user")).toBe(false);
    expect(isValidGitHubUsername("test_user")).toBe(false);
    expect(isValidGitHubUsername("test user")).toBe(false);
  });

  it("invalid for usernames containing slash (prevent path traversal)", () => {
    expect(isValidGitHubUsername("test/user")).toBe(false);
    expect(isValidGitHubUsername("../etc/passwd")).toBe(false);
  });

  it("invalid for SQL injection-like strings", () => {
    expect(isValidGitHubUsername("'; DROP TABLE users; --")).toBe(false);
  });
});
