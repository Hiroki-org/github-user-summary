import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("next/og", () => {
  return {
    ImageResponse: class {
      constructor(element: any, options: any) {
        return new Response("Mock ImageResponse");
      }
    }
  };
});

describe("OG Image Route", () => {
  it("should return 400 for invalid username", async () => {
    const req = new NextRequest("http://localhost/api/og/invalid username!");
    const res = await GET(req, { params: Promise.resolve({ username: "invalid username!" }) });

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid username");
  });

  it("should generate image for valid username", async () => {
    const req = new NextRequest("http://localhost/api/og/validuser");
    const res = await GET(req, { params: Promise.resolve({ username: "validuser" }) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mock ImageResponse");
  });
});
