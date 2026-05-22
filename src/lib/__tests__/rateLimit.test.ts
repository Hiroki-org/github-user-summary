import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../rateLimit";

describe("RateLimiter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
});
