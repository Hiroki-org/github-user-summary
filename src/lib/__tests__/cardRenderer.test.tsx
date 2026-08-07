import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderCardResponse, renderErrorCardResponse } from "../cardRenderer";
import type { CardData } from "../cardDataFetcher";
import type { CardRenderOptions } from "../cardOptions";
import { isTrustedFontUrl } from "../validators";

// Mock dependencies
vi.mock("satori", () => ({
  default: vi.fn().mockResolvedValue("<svg>mocked</svg>"),
}));

vi.mock("@vercel/og", () => {
  class MockImageResponse extends Response {
    constructor(element: unknown, options: { status?: number; headers?: Record<string, string> } | undefined) {
      super("mocked-image", {
        status: options?.status || 200,
        headers: options?.headers,
      });
    }
  }
  return { ImageResponse: MockImageResponse };
});

vi.mock("../validators", () => ({
  isTrustedFontUrl: vi.fn().mockReturnValue(true),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

class MockAbortController {
  signal = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    aborted: false,
    reason: undefined,
    throwIfAborted: vi.fn(),
  };
  abort = vi.fn();
}
global.AbortController = MockAbortController as unknown as typeof AbortController;

describe("cardRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    vi.mocked(isTrustedFontUrl).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockData = {
    profile: {
      login: "testuser",
      name: "Test User",
      avatarUrl: "https://example.com/avatar",
      bio: "Test bio",
      followers: 10,
      following: 10,
      publicRepos: 5,
    },
    totalStars: 100, // Important fix for cardElements.tsx TypeError
    stats: {
        totalStars: 100,
        totalCommits: 500,
        totalIssues: 20,
        totalPullRequests: 30,
        totalRepositories: 5,
        languageColors: {}
    },
    languages: [],
    repositories: [],
    calendar: { totalContributions: 100, weeks: [] },
  } as unknown as CardData;

  const defaultOptions: CardRenderOptions = {
    format: "svg",
    theme: "light",
    blocks: ["bio", "stats"],
    cols: 1,
    layout: {},
    hide: new Set(),
    width: 600,
  };

  it("renders a successful card as SVG", async () => {
    const response = await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
    });

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    const text = await response.text();
    expect(text).toBe("<svg>mocked</svg>");
  });

  it("renders a successful card as PNG", async () => {
    const response = await renderCardResponse({
      data: mockData,
      options: { ...defaultOptions, format: "png" },
      cacheControl: "public, max-age=3600",
    });

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    const text = await response.text();
    expect(text).toBe("mocked-image");
  });

  it("renders an error card as SVG", async () => {
    const response = await renderErrorCardResponse({
      message: "Test Error",
      options: defaultOptions,
      status: 500,
      cacheControl: "no-store",
    });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const text = await response.text();
    expect(text).toBe("<svg>mocked</svg>");
  });

  it("renders an error card as PNG", async () => {
    const response = await renderErrorCardResponse({
      message: "Test Error",
      options: { ...defaultOptions, format: "png" },
      status: 500,
      cacheControl: "no-store",
    });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const text = await response.text();
    expect(text).toBe("mocked-image");
  });

  it("handles font fetch error", async () => {
    const uniqueUrl = "https://example.com/error-font.ttf";

    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    await expect(
      renderCardResponse({
        data: mockData,
        options: defaultOptions,
        cacheControl: "public, max-age=3600",
        fontUrl: uniqueUrl,
      })
    ).rejects.toThrow("Failed to load default font");
  });

  it("uses default font url if provided font url is not trusted", async () => {
    const uniqueUrl = "https://example.com/untrusted-font.ttf";
    vi.mocked(isTrustedFontUrl).mockReturnValueOnce(false);

    await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
      fontUrl: uniqueUrl,
    });

    // Check that isTrustedFontUrl was called
    expect(isTrustedFontUrl).toHaveBeenCalledWith(uniqueUrl, undefined);
  });

  it("clears old font cache when cache size exceeds max", async () => {
    const firstUrl = "https://example.com/font-0.ttf";
    // First, cache the very first item
    await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
      fontUrl: firstUrl,
    });

    // Make sure it doesn't fetch again if we ask for it now
    mockFetch.mockClear();
    await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
      fontUrl: firstUrl,
    });
    expect(mockFetch).not.toHaveBeenCalled();

    // Now fill the cache with 10 more distinct URLs
    // This will evict the very first URL we added
    for (let i = 1; i <= 10; i++) {
        await renderCardResponse({
            data: mockData,
            options: defaultOptions,
            cacheControl: "public, max-age=3600",
            fontUrl: `https://example.com/font-${i}.ttf`,
        });
    }

    mockFetch.mockClear();

    // The first URL should now be evicted from the cache.
    // Fetching it again should result in a new fetch call.
    await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
      fontUrl: firstUrl,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("uses cached font promise when available", async () => {
    const uniqueUrl = "https://example.com/cached-font.ttf";

    // First call to fetch
    await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
      fontUrl: uniqueUrl,
    });

    // Clear mocks so we can check if it fetches again
    mockFetch.mockClear();

    // Second call to fetch
    await renderCardResponse({
      data: mockData,
      options: defaultOptions,
      cacheControl: "public, max-age=3600",
      fontUrl: uniqueUrl,
    });

    // Since it's cached, fetch should not have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
