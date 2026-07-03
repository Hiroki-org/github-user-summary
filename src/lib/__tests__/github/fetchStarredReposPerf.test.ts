import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockFetch, jsonResponse, MOCK_STARRED_PAGE1 } from "./setup";
import { fetchStarredRepos } from "../../github";

describe("fetchStarredRepos performance", () => {
  it("should not fetch page 2 if page 1 has less than 100 items", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_STARRED_PAGE1)); // 3 items

    await fetchStarredRepos("testuser", "fake-token");

    // Only page 1 should be fetched
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      expect.any(Object)
    );
  });

  it("should fetch page 2 if page 1 has exactly 100 items", async () => {
    const hundredItems = Array(100).fill({ topics: ["react"], language: "TypeScript" });
    mockFetch
      .mockResolvedValueOnce(jsonResponse(hundredItems)) // Page 1
      .mockResolvedValueOnce(jsonResponse([{ topics: ["vue"], language: "JavaScript" }])); // Page 2

    await fetchStarredRepos("testuser", "fake-token");

    // Both pages should be fetched
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("page=1"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("page=2"),
      expect.any(Object)
    );
  });
});
