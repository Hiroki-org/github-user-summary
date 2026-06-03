import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { ReactElement } from "react";
import { logger } from "@/lib/logger";
import { RateLimiter } from "@/lib/rateLimit";

vi.mock("next/og", () => {
  return {
    ImageResponse: class {
      constructor(element: ReactElement, options?: { headers?: Record<string, string>, width?: number, height?: number }) {
        const response = new Response("Mock ImageResponse");
        if (options?.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
        return response;
      }
    }
  };
});

describe("OG Image Route", () => {
  vi.spyOn(logger, "error").mockImplementation(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 for invalid username", async () => {
    const req = new NextRequest("http://localhost/api/og/invalid%20username!");
    const res = await GET(req, { params: Promise.resolve({ username: "invalid username!" }) });

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid username");
  });

  it("should generate image for valid username", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ name: "Valid User", bio: "Short bio", avatar_url: "https://example.com/avatar.png", followers: 100, public_repos: 50 }), { status: 200 })));

    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/users/validuser", expect.any(Object));
  });

  it("should generate image with default values when fetch fails", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.reject(new Error("Network error")));

    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/users/validuser", expect.any(Object));
  });

  it("should generate image with default values when fetch returns non-ok response", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response("Not Found", { status: 404 })));

    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/users/validuser", expect.any(Object));
  });

  it("should truncate bio if it is longer than 120 characters", async () => {
    const longBio = "A".repeat(150);
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ name: "Valid User", bio: longBio }), { status: 200 })));

    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/users/validuser", expect.any(Object));
  });

  it("should handle null values from github response", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ name: null, bio: null, avatar_url: null, followers: null, public_repos: null }), { status: 200 })));

    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/users/validuser", expect.any(Object));
  });

  it("should return 429 and Retry-After header when rate limit is exceeded", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ name: "Valid User" }), { status: 200 })));

    // Generate more than 50 requests to hit the rate limit (limit is 50 per minute)
    const req = new NextRequest("http://localhost/api/og/validuser", {
      headers: { "x-forwarded-for": "203.0.113.10" }
    });

    // Send 50 successful requests
    for (let i = 0; i < 50; i++) {
      await GET(req, { params: Promise.resolve({ username: "validuser" }) });
    }

    // The 51st request should be rate limited
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(429);
    expect(await res.text()).toBe("Rate limit exceeded");
    expect(res.headers.has("Retry-After")).toBe(true);

    // retry-after could be > 0 or 0
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(0);
    
    // fetch should only have been called 50 times (not on the 51st)
    expect(mockFetch).toHaveBeenCalledTimes(50);
  });

  it("should handle rate limit where reset time is in the past", async () => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue({
      success: false,
      limit: 50,
      remaining: 0,
      reset: Date.now() - 10000 // Reset time in the past
    });

    const req = new NextRequest("http://localhost/api/og/validuser", {
      headers: { "x-forwarded-for": "203.0.113.11" }
    });

    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("0");
  });
});
