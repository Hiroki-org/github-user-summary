export class RateLimiter {
    private cache = new Map<string, { count: number; resetTime: number }>();
    private cleanupThreshold = 1000;

    constructor(private limit: number, private windowMs: number) {}

    private cleanup(now: number) {
        for (const [key, record] of this.cache.entries()) {
            if (now > record.resetTime) {
                this.cache.delete(key);
            }
        }
    }

    check(key: string): { success: boolean; reset: number } {
        const now = Date.now();
        if (this.cache.size > this.cleanupThreshold) {
            this.cleanup(now); // Lazy cleanup only when exceeding threshold
        }

        const record = this.cache.get(key);

        if (!record || now > record.resetTime) {
            this.cache.set(key, { count: 1, resetTime: now + this.windowMs });
            return { success: true, reset: now + this.windowMs };
        }

        if (record.count >= this.limit) {
            return { success: false, reset: record.resetTime };
        }

        record.count++;
        return { success: true, reset: record.resetTime };
    }
}
