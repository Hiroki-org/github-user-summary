import { describe, it, expect } from "vitest";
import { isValidGitHubUsername, sanitizeUrl } from "../validators";

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

  it("マルチバイト文字（日本語や絵文字）を含むユーザー名は無効", () => {
    expect(isValidGitHubUsername("テスト")).toBe(false);
    expect(isValidGitHubUsername("user😀")).toBe(false);
    expect(isValidGitHubUsername("déjà-vu")).toBe(false);
  });

  it("空白文字や制御文字を含むユーザー名は無効", () => {
    expect(isValidGitHubUsername(" testuser")).toBe(false);
    expect(isValidGitHubUsername("testuser ")).toBe(false);
    expect(isValidGitHubUsername("test\nuser")).toBe(false);
    expect(isValidGitHubUsername("test\tuser")).toBe(false);
    expect(isValidGitHubUsername("test\0user")).toBe(false);
  });

  it("極端に長い文字列は無効 (長さ上限の確認)", () => {
    expect(isValidGitHubUsername("a".repeat(1000))).toBe(false);
  });

});

describe("sanitizeUrl", () => {
  it("http で始まる有効な URL はそのまま返す", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("https で始まる有効な URL はそのまま返す", () => {
    expect(sanitizeUrl("https://example.com/path?query=1")).toBe("https://example.com/path?query=1");
  });

  it("プロトコルがないドメインは https:// を付与する", () => {
    expect(sanitizeUrl("example.com")).toBe("https://example.com");
  });

  it("プロトコル相対 URL は https: を付与する", () => {
    expect(sanitizeUrl("//example.com")).toBe("https://example.com");
  });

  it("javascript: プロトコルは無効化する", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
  });

  it("data: プロトコルは無効化する", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
  });

  it("vbscript: プロトコルは無効化する", () => {
    expect(sanitizeUrl("vbscript:msgbox('hi')")).toBe("#");
  });

  it("空文字列や null/undefined (型定義上はないが) は '#' を返す", () => {
    expect(sanitizeUrl("")).toBe("#");
    expect(sanitizeUrl(null as unknown as string)).toBe("#");
  });

  it("不当な文字列は '#' を返す", () => {
    expect(sanitizeUrl("   ")).toBe("#");
  });
});
