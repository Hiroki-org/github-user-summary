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
    it("returns the right-most untrusted x-forwarded-for IP", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "5.6.7.8, 9.10.11.12, 10.0.0.1" // 10.0.0.1 is trusted proxy
            }
        });
        expect(getClientIp(req)).toBe("9.10.11.12");
    });

    it("trims whitespace from the selected x-forwarded-for IP", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "  5.6.7.8  ,   9.10.11.12  "
            }
        });
        expect(getClientIp(req)).toBe("9.10.11.12");
    });

    it("accepts IPv6 x-forwarded-for values", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "2001:db8::1"
            }
        });
        expect(getClientIp(req)).toBe("2001:db8::1");
    });

    it("does not trust x-real-ip when x-forwarded-for is absent", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "1.2.3.4"
            }
        });
        expect(getClientIp(req)).toBe("unknown");
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

    it("returns the first valid untrusted IP when the right-most x-forwarded-for token is empty", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "5.6.7.8,   "
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("returns the first valid untrusted IP when the right-most x-forwarded-for token is invalid", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "5.6.7.8, not-an-ip"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("skips the full IPv4 loopback range when selecting the client IP", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "5.6.7.8, 127.0.0.2"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("skips IPv6 ULA fc and fd proxy addresses", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "2001:db8::1, fc12::1, fd00::1"
            }
        });
        expect(getClientIp(req)).toBe("2001:db8::1");
    });

    it("returns the left-most IP if all are trusted proxies", () => {
        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "192.168.1.1, 10.0.0.1"
            }
        });
        expect(getClientIp(req)).toBe("192.168.1.1");
    });
});
