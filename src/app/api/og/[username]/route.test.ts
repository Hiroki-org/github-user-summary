import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { ReactElement } from "react";

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
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ name: "Valid User" }), { status: 200 })));

    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
    expect(mockFetch).toHaveBeenCalledWith("https://api.github.com/users/validuser", expect.any(Object));
  });

  it("should return 429 and Retry-After header when rate limit is exceeded", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ name: "Valid User" }), { status: 200 })));

    // Generate more than 50 requests to hit the rate limit (limit is 50 per minute)
    const req = new NextRequest("http://localhost/api/og/validuser");
    req.headers.set("x-forwarded-for", "test-ip");

    // Send 50 successful requests
    for (let i = 0; i < 50; i++) {
      await GET(req, { params: Promise.resolve({ username: "validuser" }) });
    }

    // The 51st request should be rate limited
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(429);
    expect(await res.text()).toBe("Rate limit exceeded");
    expect(res.headers.has("Retry-After")).toBe(true);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(0);
    
    // fetch should only have been called 50 times (not on the 51st)
    expect(mockFetch).toHaveBeenCalledTimes(50);
  });
});
