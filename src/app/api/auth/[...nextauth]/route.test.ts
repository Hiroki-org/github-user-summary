import { describe, it, expect, vi } from "vitest";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { GET, POST } from "./route";

vi.mock("next-auth", () => {
  const dummyHandler = vi.fn();
  return {
    default: vi.fn(() => dummyHandler),
  };
});

vi.mock("@/lib/auth", () => ({
  authOptions: { providers: [], secret: "test-secret" },
}));

describe("NextAuth Route Handler", () => {
  it("should initialize NextAuth with authOptions", () => {
    expect(NextAuth).toHaveBeenCalledWith(authOptions);
  });

  it("should export GET and POST handlers matching the NextAuth handler", () => {
    const mockNextAuth = vi.mocked(NextAuth);
    const dummyHandler = mockNextAuth.mock.results[0].value;
    expect(GET).toBe(dummyHandler);
    expect(POST).toBe(dummyHandler);
  });
});
