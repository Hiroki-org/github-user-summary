import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isTrustedFontUrl, isValidGitHubUsername, sanitizeUrl } from "../validators";

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
  describe("有効なユーザー名 (Valid usernames)", () => {
    it.each([
      ["英数字のみ", "testuser"],
      ["1文字の英字", "a"],
      ["1文字の数字", "1"],
      ["数字のみ", "12345"],
      ["ハイフンを含む", "test-user"],
      ["複数ハイフンを含む", "my-test-user"],
      ["大文字を含む", "TestUser"],
      ["大文字とハイフン", "Test-User"],
      ["39文字の英字", "a".repeat(39)],
      ["39文字の数字", "1".repeat(39)],
      ["38文字の英字", "a".repeat(38)],
      ["ハイフンが複数あるが連続していない", "a-b-c-d-e"],
      ["39文字でハイフンを含む", "a" + "b".repeat(36) + "-c"],
      ["1文字おきにハイフン", "a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-r-s"],
      ["数字とハイフン", "1-2-3-4"],
    ])("%s: %p", (_, username) => {
      expect(isValidGitHubUsername(username)).toBe(true);
    });
  });

  describe("無効なユーザー名 (Invalid usernames)", () => {
    it.each([
      ["空文字列", ""],
      ["ハイフンで始まる", "-testuser"],
      ["ハイフンで終わる", "testuser-"],
      ["連続ハイフンを含む", "test--user"],
      ["1文字のハイフン", "-"],
      ["複数ハイフンのみ", "---"],
      ["両端がハイフン", "-testuser-"],
      ["40文字", "a".repeat(40)],
      ["40文字（ハイフン含む）", "a" + "b".repeat(37) + "-c"],
      ["39文字で末尾がハイフン", "a".repeat(38) + "-"],
      ["39文字で先頭がハイフン", "-" + "a".repeat(38)],
      ["40文字で両端がハイフン", "-" + "a".repeat(38) + "-"],
      ["先頭がアンダースコア", "_testuser"],
      ["末尾がアンダースコア", "testuser_"],
      ["特殊文字を含む(@)", "test@user"],
      ["特殊文字を含む(.)", "test.user"],
      ["特殊文字を含む(_)", "test_user"],
      ["空白を含む", "test user"],
      ["先頭に空白", " testuser"],
      ["末尾に空白", "testuser "],
      ["制御文字(改行)を含む", "test\nuser"],
      ["制御文字(タブ)を含む", "test\tuser"],
      ["ヌル文字を含む", "test\0user"],
      ["パストラバーサル", "../etc/passwd"],
      ["パストラバーサル(/)", "test/user"],
      ["SQLインジェクション", "'; DROP TABLE users; --"],
      ["日本語", "テスト"],
      ["絵文字", "user😀"],
      ["アクセント記号", "déjà-vu"],
      ["極端に長い文字列", "a".repeat(1000)],
      ["undefined (型キャスト)", undefined as unknown as string],
      ["null (型キャスト)", null as unknown as string],
    ])("%s: %p", (_, username) => {
      expect(isValidGitHubUsername(username)).toBe(false);
    });
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

describe("isTrustedFontUrl", () => {
  const originalAppUrl = process.env.APP_URL;

  beforeEach(() => {
    delete process.env.APP_URL;
  });

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
  });

  it("allows the Noto fonts repository on JSDelivr, including versioned refs", () => {
    expect(
      isTrustedFontUrl(
        "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      ),
    ).toBe(true);
    expect(
      isTrustedFontUrl(
        "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      ),
    ).toBe(true);
  });

  it("blocks JSDelivr path traversal and adjacent repository names", () => {
    expect(
      isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts"),
    ).toBe(false);
    expect(
      isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts-evil/font.ttf"),
    ).toBe(false);
    expect(
      isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/../../evil/repo/font.ttf"),
    ).toBe(false);
    expect(
      isTrustedFontUrl("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/..%2f..%2fevil/repo/font.ttf"),
    ).toBe(false);
  });

  it("requires HTTPS and an allowlisted application origin for non-JSDelivr fonts", () => {
    expect(
      isTrustedFontUrl(
        "https://github-user-summary.vercel.app/fonts/NotoSans-Regular.ttf",
        "https://github-user-summary.vercel.app",
      ),
    ).toBe(true);
    expect(
      isTrustedFontUrl("https://myapp.com/fonts/NotoSans-Regular.ttf", "https://myapp.com"),
    ).toBe(false);
    expect(
      isTrustedFontUrl("http://github-user-summary.vercel.app/fonts/NotoSans-Regular.ttf", "https://github-user-summary.vercel.app"),
    ).toBe(false);
  });

  it("trusts a configured HTTPS APP_URL origin and ignores HTTP configuration", () => {
    process.env.APP_URL = "https://custom.example";
    expect(
      isTrustedFontUrl("https://custom.example/fonts/NotoSans-Regular.ttf", "https://custom.example"),
    ).toBe(true);

    process.env.APP_URL = "http://localhost:3000";
    expect(
      isTrustedFontUrl("https://localhost:3000/fonts/NotoSans-Regular.ttf", "https://localhost:3000"),
    ).toBe(false);
  });
});
