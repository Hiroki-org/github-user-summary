import { describe, it, expect } from "vitest";
import {
  mockFetch,
  jsonResponse,
  MOCK_USER,
  MOCK_ORGS,
  MOCK_PINNED_RESPONSE,
  MOCK_REPOS_GRAPHQL,
  MOCK_CONTRIBUTIONS,
  MOCK_EVENTS,
  MOCK_STARRED_PAGE1
} from "./setup";

describe("fetchUserSummary", () => {
  /**
   * fetchUserSummary は Promise.allSettled で5関数を並行実行するため、
   * fetch の呼び出し順は非決定的。URL ベースでモックを返す。
   */
  function setupUrlBasedMock() {
    // GraphQL 呼び出しカウンター (pinned → repos → contributions の順で異なるデータを返す)
    // let graphqlCallCount = 0;

    mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;

      // GraphQL エンドポイント
      if (urlStr.includes("/graphql")) {
        // graphqlCallCount++;
        const body = options?.body ? JSON.parse(options.body as string) : {};
        const query = body.query || "";

        if (query.includes("pinnedItems")) {
          return Promise.resolve(jsonResponse(MOCK_PINNED_RESPONSE));
        }
        if (query.includes("repositories")) {
          return Promise.resolve(jsonResponse(MOCK_REPOS_GRAPHQL));
        }
        if (query.includes("contributionsCollection")) {
          return Promise.resolve(jsonResponse(MOCK_CONTRIBUTIONS));
        }
        // fallback for unknown GraphQL
        return Promise.resolve(jsonResponse({ data: {} }));
      }

      // REST endpoints
      if (urlStr.includes("/users/") && urlStr.includes("/orgs")) {
        return Promise.resolve(jsonResponse(MOCK_ORGS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/events/public")) {
        return Promise.resolve(jsonResponse(MOCK_EVENTS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/starred")) {
        return Promise.resolve(jsonResponse(MOCK_STARRED_PAGE1));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/repos")) {
        return Promise.resolve(jsonResponse([])); // REST repos fallback (not used with token)
      }
      if (urlStr.match(/\/users\/[^/]+$/)) {
        return Promise.resolve(jsonResponse(MOCK_USER));
      }

      return Promise.resolve(jsonResponse({ error: "Unknown endpoint" }, 404));
    });
  }

  it("全セクション成功時に完全な UserSummary を返す", async () => {
    setupUrlBasedMock();

    const { fetchUserSummary } = await import("../../github");
    const result = await fetchUserSummary("testuser", "fake-token");

    expect(result.profile).not.toBeNull();
    expect(result.profile?.login).toBe("testuser");
    expect(result.repositories).not.toBeNull();
    expect(result.contributions).not.toBeNull();
    expect(result.activity).not.toBeNull();
    expect(result.interests).not.toBeNull();
    expect(result.errors).toHaveLength(0);
  });

  it("一部セクション失敗時にエラー情報を含みつつ他のセクションは返す", async () => {
    // URL ベースでモックを設定し、repos の GraphQL を 500 にする
    mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;

      if (urlStr.includes("/graphql")) {
        const body = options?.body ? JSON.parse(options.body as string) : {};
        const query = body.query || "";

        if (query.includes("pinnedItems")) {
          return Promise.resolve(jsonResponse(MOCK_PINNED_RESPONSE));
        }
        if (query.includes("repositories")) {
          return Promise.resolve(jsonResponse({ error: "Server Error" }, 500));
        }
        if (query.includes("contributionsCollection")) {
          return Promise.resolve(jsonResponse(MOCK_CONTRIBUTIONS));
        }
      }

      if (urlStr.includes("/users/") && urlStr.includes("/orgs")) {
        return Promise.resolve(jsonResponse(MOCK_ORGS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/events/public")) {
        return Promise.resolve(jsonResponse(MOCK_EVENTS));
      }
      if (urlStr.includes("/users/") && urlStr.includes("/starred")) {
        return Promise.resolve(jsonResponse(MOCK_STARRED_PAGE1));
      }
      if (urlStr.match(/\/users\/[^/]+$/)) {
        return Promise.resolve(jsonResponse(MOCK_USER));
      }

      return Promise.resolve(jsonResponse({ error: "Unknown" }, 404));
    });

    const { fetchUserSummary } = await import("../../github");
    const result = await fetchUserSummary("testuser", "fake-token");

    expect(result.profile).not.toBeNull();
    expect(result.activity).not.toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.section === "repositories")).toBe(true);
  });

  it("profile が 404 の場合 UserNotFoundError を再スローする", async () => {
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;

      // profile REST → 404
      if (urlStr.match(/\/users\/[^/]+$/) && !urlStr.includes("/orgs")) {
        return Promise.resolve(jsonResponse(null, 404));
      }

      // 他のエンドポイントも失敗させる (profile が失敗すればスローされるので問題なし)
      return Promise.resolve(jsonResponse([], 200));
    });

    const { fetchUserSummary } = await import("../../github");
    const { UserNotFoundError } = await import("../../types");

    await expect(fetchUserSummary("nonexistent", "fake-token")).rejects.toThrow(
      UserNotFoundError
    );
  });
});
