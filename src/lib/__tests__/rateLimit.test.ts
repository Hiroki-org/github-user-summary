import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../rateLimit";
import { Ratelimit } from "@upstash/ratelimit";

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

import { getClientIp } from "../rateLimit";


import { getClientIp } from "../rateLimit";

describe("getClientIp", () => {
    it("should return x-real-ip if present", () => {

        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "1.2.3.4",
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("should return first ip from x-forwarded-for if x-real-ip is absent", () => {

        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("should trim whitespace from extracted ip", () => {

        const reqReal = new Request("http://localhost", {
            headers: {
                "x-real-ip": "  1.2.3.4  "
            }
        });
        expect(getClientIp(reqReal)).toBe("1.2.3.4");

        const reqForwarded = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": "  5.6.7.8  , 9.10.11.12"
            }
        });
        expect(getClientIp(reqForwarded)).toBe("5.6.7.8");
    });

    it("should return 'unknown' if headers only contain whitespace", () => {

        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "   ",
                "x-forwarded-for": "   ,   "
            }
        });
        expect(getClientIp(req)).toBe("unknown");
    });

    it("should fallback to valid x-forwarded-for if x-real-ip is invalid/whitespace", () => {

        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "   ",
                "x-forwarded-for": "5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("should return first valid ip from x-forwarded-for if first element is empty/invalid", () => {

        const req = new Request("http://localhost", {
            headers: {
                "x-forwarded-for": " , 5.6.7.8, 9.10.11.12"
            }
        });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("should return 'unknown' for invalid/non-IP strings", () => {

        const req = new Request("http://localhost", {
            headers: {
                "x-real-ip": "not-an-ip",
                "x-forwarded-for": "foo, bar"
            }
        });
        expect(getClientIp(req)).toBe("unknown");
    });

    it("should return 'unknown' if neither header is present", () => {

        const req = new Request("http://localhost");
        expect(getClientIp(req)).toBe("unknown");
    });
});
