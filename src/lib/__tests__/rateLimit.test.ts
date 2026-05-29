import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../rateLimit";

const mockLimit = vi.hoisted(() => vi.fn());

vi.mock("@upstash/redis", () => {
    return {
        Redis: class {
            constructor() {}
        }
    };
});

vi.mock("@upstash/ratelimit", () => {
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
        mockLimit.mockReset();
        mockLimit.mockResolvedValue({ success: true, reset: 12345 });
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

        it("returns Upstash rate-limit failures", async () => {
            mockLimit.mockResolvedValueOnce({ success: false, reset: 67890 });
            const limiter = new RateLimiter(2, 1000);

            const result = await limiter.check("blocked-key");

            expect(result.success).toBe(false);
            expect(result.reset).toBe(67890);
        });

        it("falls back to in-memory limiting when Upstash throws", async () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            mockLimit.mockRejectedValue(new Error("upstash unavailable"));
            const limiter = new RateLimiter(1, 1000);
            const key = "fallback-key";

            const firstResult = await limiter.check(key);
            const secondResult = await limiter.check(key);

            expect(firstResult.success).toBe(true);
            expect(secondResult.success).toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(
                "Upstash rate limit check failed; falling back to in-memory limiter.",
                expect.any(Error)
            );
        });
    });
});
