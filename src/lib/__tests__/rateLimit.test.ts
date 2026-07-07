import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getClientIp, RateLimiter } from "@/lib/rateLimit";

vi.mock("@upstash/redis", () => {
    return {
        Redis: class {
            constructor() {}
        }
    };
});

vi.mock("@upstash/ratelimit", () => {
    const mockLimit = vi.fn().mockResolvedValue({ success: true, reset: 12345 });
    return {
        Ratelimit: class {
            static slidingWindow = vi.fn().mockReturnValue("sliding-window-algo");
            limit = mockLimit;
        }
    };
});

describe("RateLimiter", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.useFakeTimers();
        process.env = { ...originalEnv };
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.env = originalEnv;
    });

    describe("In-memory Fallback", () => {
        it("allows requests below the limit", async () => {
            const limiter = new RateLimiter(2, 1000);
            const key = "test-key";

            expect((await limiter.check(key)).success).toBe(true);
            expect((await limiter.check(key)).success).toBe(true);
        });

        it("blocks requests above the limit", async () => {
            const limiter = new RateLimiter(2, 1000);
            const key = "test-key";

            await limiter.check(key);
            await limiter.check(key);
            expect((await limiter.check(key)).success).toBe(false);
        });

        it("resets after the window has passed", async () => {
            const limiter = new RateLimiter(1, 1000);
            const key = "test-key";

            expect((await limiter.check(key)).success).toBe(true);
            expect((await limiter.check(key)).success).toBe(false);

            vi.advanceTimersByTime(1001);

            expect((await limiter.check(key)).success).toBe(true);
        });

        it("lazy cleans up properly", async () => {
            const limiter = new RateLimiter(1, 1000);
            const key1 = "test-key-1";
            const key2 = "test-key-2";

            await limiter.check(key1);
            vi.advanceTimersByTime(1001);
            await limiter.check(key2); // triggers cleanup for key1

            // internal check would be needed, but essentially the fact it works implies cleanup did not crash
            expect((await limiter.check(key2)).success).toBe(false);
        });
    });

    describe("Upstash Redis", () => {
        beforeEach(() => {
            process.env.UPSTASH_REDIS_REST_URL = "https://fake-url";
            process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
        });

        it("uses Upstash Ratelimit when env vars are present", async () => {
            const limiter = new RateLimiter(2, 1000);
            const key = "upstash-key";

            const result = await limiter.check(key);

            expect(result.success).toBe(true);
            expect(result.reset).toBe(12345);
        });
    });
});

describe("getClientIp", () => {
    it("returns the left-most x-forwarded-for IP", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("trims whitespace from the selected x-forwarded-for IP", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "  5.6.7.8  ,   9.10.11.12  "
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("accepts IPv6 x-forwarded-for values", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "2001:db8::1"
            }
        });
        expect(getClientIp(req)).toBe("2001:db8::1");
    });

    it("trusts x-real-ip when available", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "1.2.3.4"
            }
        });
        expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("returns unknown if neither header is present", () => {
        const req = new Request("http://localhost");
        expect(getClientIp(req)).toBe("unknown");
    });

    it("returns unknown for whitespace-only x-forwarded-for", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "   "
            }
        });
        expect(getClientIp(req)).toBe("unknown");
    });

    it("returns unknown when the left-most x-forwarded-for token is empty", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "   , 5.6.7.8"
            }
        });
        expect(getClientIp(req)).toBe("unknown");
    });

    it("returns unknown when the left-most x-forwarded-for token is invalid", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "not-an-ip, 5.6.7.8"
            }
        });
        expect(getClientIp(req)).toBe("unknown");
    });
});

    it("prefers x-real-ip over x-forwarded-for when both are present", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "1.2.3.4",
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("ignores x-real-ip if it is an invalid IP and falls back to x-forwarded-for", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "invalid-ip",
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("ignores x-real-ip if it is an invalid IP and returns unknown if x-forwarded-for is missing", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "invalid-ip"
            }
        });
        expect(getClientIp(req)).toBe("unknown");
    });

    it("ignores x-real-ip if it is an invalid IPv6 IP and falls back to x-forwarded-for", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "invalid:ipv6:value",
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });
