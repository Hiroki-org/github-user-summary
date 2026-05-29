import { describe, it, expect, vi } from "vitest";
import { fetchUserSummary } from "@/lib/github";
import { jsonResponse } from "./setup";

describe("getTopK logic via fetchUserSummary", () => {
  it("covers getTopK branch for when the array is already filled to k and needs to insert a new element (shifting)", async () => {
    // We want to return 15 repositories, each with a different language, and byte count such that it triggers shifting.
    // getTopK is used in fetchRepositories for languages and topics.
    // Let's create a custom GraphQL response.
    const nodes = [];
    // If we want it to shift:
    // First, populate the top 10 with values [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].
    // Then, add a value like `75`. This should shift the lower items.

    // We'll create 15 repositories.
    const sizes = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 75, 15, 85, 25, 95];
    for (let i = 0; i < sizes.length; i++) {
      nodes.push({
        id: `id${i}`,
        name: `repo${i}`,
        description: null,
        url: `https://github.com/u/repo${i}`,
        isFork: false,
        stargazerCount: 0,
        forkCount: 0,
        languages: {
          edges: [
            {
              size: sizes[i],
              node: {
                name: `Lang${i}`,
                color: "#000000"
              }
            }
          ]
        },
        repositoryTopics: { nodes: [] }
      });
    }

    const mockReposGraphQL = {
      data: {
        user: {
          repositories: {
            nodes,
            pageInfo: { hasNextPage: false, endCursor: null }
          }
        }
      }
    };

    const mockFetch = vi.fn().mockImplementation((url: string | URL | Request, options?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;
      if (urlStr.includes("/graphql")) {
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.query?.includes("repositories")) {
          return Promise.resolve(jsonResponse(mockReposGraphQL));
        }
        return Promise.resolve(jsonResponse({ data: {} }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    global.fetch = mockFetch;

    const result = await fetchUserSummary("testuser", "fake-token");
    expect(result.repositories).not.toBeNull();
    // Languages should be top 10
    expect(result.repositories?.languages.length).toBe(10);
    // The top languages should be sorted by size:
    // 100, 95, 90, 85, 80, 75, 70, 60, 50, 40
    expect(result.repositories?.languages[0].bytes).toBe(100);
    expect(result.repositories?.languages[5].bytes).toBe(75);
    expect(result.repositories?.languages[9].bytes).toBe(40);
  });
});
