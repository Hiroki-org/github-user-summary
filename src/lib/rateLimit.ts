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


function isValidIp(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function getClientIp(request: Request): string {
    const realIpHeader = request.headers.get("x-real-ip");
    if (realIpHeader) {
        const realIp = realIpHeader.trim();
        if (realIp && isValidIp(realIp)) return realIp;
    }

    const forwardedForHeader = request.headers.get("x-forwarded-for");
    if (forwardedForHeader) {
        const parts = forwardedForHeader.split(",");
        for (const part of parts) {
            const ip = part.trim();
            if (ip && isValidIp(ip)) {
                return ip;
            }
        }
    }

    return "unknown";
}
