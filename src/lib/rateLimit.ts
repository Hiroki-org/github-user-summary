import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export class RateLimiter {
    private cache = new Map<string, { count: number; resetTime: number }>();
    private upstashRatelimit: Ratelimit | null = null;

    constructor(private limit: number, private windowMs: number) {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const redis = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            this.upstashRatelimit = new Ratelimit({
                redis: redis,
                limiter: Ratelimit.slidingWindow(this.limit, `${this.windowMs} ms`),
            });
        }
    }

    private cleanup(now: number) {
        for (const [key, record] of this.cache.entries()) {
            if (now > record.resetTime) {
                this.cache.delete(key);
            }
        }
    }

    async check(key: string): Promise<{ success: boolean; reset: number }> {
        if (this.upstashRatelimit) {
            const { success, reset } = await this.upstashRatelimit.limit(key);
            return { success, reset };
        }

        // Fallback to in-memory caching
        const now = Date.now();
        this.cleanup(now); // Lazy cleanup

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

export function getClientIp(request: Request): string {
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return "unknown";
}
