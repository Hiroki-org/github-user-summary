import { describe, it, expect } from "vitest";
import {
  UserNotFoundError,
  RateLimitError,
  GitHubApiError,
} from "../types";

/**
 * カスタムエラークラスのユニットテスト
 *
 * テスト対象:
 * - UserNotFoundError: メッセージ, name, instanceofチェーン
 * - RateLimitError: メッセージ, name, resetAt計算
 * - GitHubApiError: メッセージ, name, statusプロパティ
 * - 全エラーが Error を継承
 */

describe("UserNotFoundError", () => {
  it("ユーザー名を含むメッセージを設定する", () => {
    const error = new UserNotFoundError("testuser");
    expect(error.message).toBe('User "testuser" not found');
  });

  it('name が "UserNotFoundError" に設定される', () => {
    const error = new UserNotFoundError("testuser");
    expect(error.name).toBe("UserNotFoundError");
  });

  it("Error のインスタンスである", () => {
    const error = new UserNotFoundError("testuser");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UserNotFoundError);
  });

  it("特殊文字を含むユーザー名でも正しく動作する", () => {
    const error = new UserNotFoundError("user-with-dashes_123");
    expect(error.message).toContain("user-with-dashes_123");
  });
});

describe("RateLimitError", () => {
  it("resetAt を Date オブジェクトとして保持する", () => {
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    const error = new RateLimitError(timestamp);
    expect(error.resetAt).toBeInstanceOf(Date);
  });

  it("resetAt がタイムスタンプから正しく計算される", () => {
    const timestamp = 1700000000; // 2023-11-14T22:13:20Z
    const error = new RateLimitError(timestamp);
    expect(error.resetAt.getTime()).toBe(timestamp * 1000);
  });

  it("メッセージに ISO 日付文字列を含む", () => {
    const timestamp = 1700000000;
    const error = new RateLimitError(timestamp);
    expect(error.message).toContain("rate limit exceeded");
    expect(error.message).toContain(new Date(timestamp * 1000).toISOString());
  });

  it('name が "RateLimitError" に設定される', () => {
    const error = new RateLimitError(1700000000);
    expect(error.name).toBe("RateLimitError");
  });

  it("Error のインスタンスである", () => {
    const error = new RateLimitError(1700000000);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RateLimitError);
  });
});

describe("GitHubApiError", () => {
  it("メッセージとステータスコードを保持する", () => {
    const error = new GitHubApiError("Bad Request", 400);
    expect(error.message).toBe("Bad Request");
    expect(error.status).toBe(400);
  });

  it('name が "GitHubApiError" に設定される', () => {
    const error = new GitHubApiError("Internal Server Error", 500);
    expect(error.name).toBe("GitHubApiError");
  });

  it("Error のインスタンスである", () => {
    const error = new GitHubApiError("Not Found", 404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GitHubApiError);
  });

  it("さまざまなHTTPステータスコードを正しく保持する", () => {
    const codes = [400, 401, 403, 404, 422, 500, 502, 503];
    for (const code of codes) {
      const error = new GitHubApiError(`Error ${code}`, code);
      expect(error.status).toBe(code);
    }
  });
});
