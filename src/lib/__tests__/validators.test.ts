import { describe, it, expect } from "vitest";
import { isValidGitHubUsername } from "../validators";

/**
 * isValidGitHubUsername のユニットテスト
 *
 * GitHub ユーザー名ルール:
 * - 英数字またはハイフン
 * - ハイフンで開始/終了不可
 * - 連続ハイフン不可 (ルック・アヘッドで対応)
 * - 最大39文字
 */

describe("isValidGitHubUsername", () => {
  // ---------- 有効なユーザー名 ----------
  it("英数字のみのユーザー名は有効", () => {
    expect(isValidGitHubUsername("testuser")).toBe(true);
  });

  it("1文字のユーザー名は有効", () => {
    expect(isValidGitHubUsername("a")).toBe(true);
  });

  it("数字のみのユーザー名は有効", () => {
    expect(isValidGitHubUsername("12345")).toBe(true);
  });

  it("ハイフンを含むユーザー名は有効", () => {
    expect(isValidGitHubUsername("test-user")).toBe(true);
  });

  it("複数ハイフンを含むユーザー名は有効", () => {
    expect(isValidGitHubUsername("my-test-user")).toBe(true);
  });

  it("39文字のユーザー名は有効", () => {
    expect(isValidGitHubUsername("a".repeat(39))).toBe(true);
  });

  it("大文字を含むユーザー名は有効", () => {
    expect(isValidGitHubUsername("TestUser")).toBe(true);
  });

  // ---------- 無効なユーザー名 ----------
  it("空文字列は無効", () => {
    expect(isValidGitHubUsername("")).toBe(false);
  });

  it("ハイフンで始まるユーザー名は無効", () => {
    expect(isValidGitHubUsername("-testuser")).toBe(false);
  });

  it("ハイフンで終わるユーザー名は無効", () => {
    expect(isValidGitHubUsername("testuser-")).toBe(false);
  });

  it("連続ハイフンを含むユーザー名は無効", () => {
    expect(isValidGitHubUsername("test--user")).toBe(false);
  });

  it("40文字以上のユーザー名は無効", () => {
    expect(isValidGitHubUsername("a".repeat(40))).toBe(false);
  });

  it("特殊文字を含むユーザー名は無効", () => {
    expect(isValidGitHubUsername("test@user")).toBe(false);
    expect(isValidGitHubUsername("test.user")).toBe(false);
    expect(isValidGitHubUsername("test_user")).toBe(false);
    expect(isValidGitHubUsername("test user")).toBe(false);
  });

  it("スラッシュを含むユーザー名は無効 (パストラバーサル防止)", () => {
    expect(isValidGitHubUsername("test/user")).toBe(false);
    expect(isValidGitHubUsername("../etc/passwd")).toBe(false);
  });

  it("SQLインジェクション的な文字列は無効", () => {
    expect(isValidGitHubUsername("'; DROP TABLE users; --")).toBe(false);
  });
});
