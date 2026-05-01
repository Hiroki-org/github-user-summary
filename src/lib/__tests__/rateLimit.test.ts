import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../rateLimit";

describe("RateLimiter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("allows requests below the limit", () => {
        const limiter = new RateLimiter(2, 1000);
        const key = "test-key";

        expect(limiter.check(key).success).toBe(true);
        expect(limiter.check(key).success).toBe(true);
    });

    it("blocks requests above the limit", () => {
        const limiter = new RateLimiter(2, 1000);
        const key = "test-key";

        limiter.check(key);
        limiter.check(key);
        expect(limiter.check(key).success).toBe(false);
    });

    it("resets after the window has passed", () => {
        const limiter = new RateLimiter(1, 1000);
        const key = "test-key";

        expect(limiter.check(key).success).toBe(true);
        expect(limiter.check(key).success).toBe(false);

        vi.advanceTimersByTime(1001);

        expect(limiter.check(key).success).toBe(true);
    });
});
