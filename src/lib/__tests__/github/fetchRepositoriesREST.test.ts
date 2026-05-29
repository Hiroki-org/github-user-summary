import { describe, it, expect, vi } from "vitest";
import { fetchRepositories } from "@/lib/github";
import { jsonResponse } from "./setup";

describe("fetchRepositoriesREST coverage", () => {
  it("hits the fallback and getLanguageColor by passing no token", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : (url as Request).url;

      if (urlStr.includes("/users/") && urlStr.includes("/repos")) {
        return Promise.resolve(jsonResponse([
          {
            name: "repo-unknown-rest",
            description: "Unknown lang repo",
            html_url: "https://github.com/testuser/repo-unknown-rest",
            stargazers_count: 10,
            forks_count: 2,
            fork: false,
            language: "Brainfuck", // this uses getLanguageColor(r.language)
            topics: ["topic1", "topic2"] // hit topics branch too
          }
        ]));
      }
      return Promise.resolve(jsonResponse([]));
    });

    global.fetch = mockFetch;

    const result = await fetchRepositories("testuser"); // NO TOKEN -> fetchRepositoriesREST
    expect(result).not.toBeNull();

    // getLanguageColor is mapped in `languages` and `topRepos` inside fetchRepositoriesREST
    expect(result?.languages.length).toBe(1);
    expect(result?.languages[0].name).toBe("Brainfuck");
    expect(result?.languages[0].color).toBe("#8b949e"); // Fallback color

    expect(result?.topRepos.length).toBe(1);
    expect(result?.topRepos[0].primaryLanguage?.name).toBe("Brainfuck");
    expect(result?.topRepos[0].primaryLanguage?.color).toBe("#8b949e"); // Fallback color
  });
});
