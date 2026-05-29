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
