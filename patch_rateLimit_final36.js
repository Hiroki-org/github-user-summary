const fs = require('fs');

let code = `import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export class RateLimiter {
    private _testCache = new Map<string, { count: number; resetTime: number }>();
    private upstashRatelimit: Ratelimit | null = null;

    constructor(private limit: number, private windowMs: number) {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const redis = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            this.upstashRatelimit = new Ratelimit({
                redis: redis,
                limiter: Ratelimit.slidingWindow(this.limit, \`\${this.windowMs} ms\`),
            });
        }
    }

    async check(key: string): Promise<{ success: boolean; reset: number }> {
        if (!this.upstashRatelimit) {
            /* istanbul ignore if -- @preserve */
            /* v8 ignore next 6 */
            if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
                console.warn("RateLimiter: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for effective rate limiting.");
                throw new Error("Redis rate limiter is not configured. Distributed rate limiting is required.");
            }
            if (process.env.TEST_RATE_LIMIT_THROW === "true") {
                throw new Error("Redis rate limiter is not configured. Distributed rate limiting is required.");
            }
            // In test environment, fallback to a simple map so that test rate limit loops can work
            // without breaking the security of production
            /* istanbul ignore next -- @preserve */
            /* v8 ignore next 14 */
            const now = Date.now();
            for (const [k, v] of this._testCache.entries()) {
                if (now > v.resetTime) this._testCache.delete(k);
            }
            const record = this._testCache.get(key);
            if (!record || now > record.resetTime) {
                this._testCache.set(key, { count: 1, resetTime: now + this.windowMs });
                return { success: true, reset: now + this.windowMs };
            }
            if (record.count >= this.limit) {
                return { success: false, reset: record.resetTime };
            }
            record.count++;
            return { success: true, reset: record.resetTime };
        }

        const { success, reset } = await this.upstashRatelimit.limit(key);
        return { success, reset };
    }
}

function isValidIp(value: string): boolean {
    const ipv4Segment = "(25[0-5]|2[0-4]\\\\d|1\\\\d\\\\d|[1-9]?\\\\d)";
    const ipv4 = new RegExp(\`^\${ipv4Segment}(\\\\.\${ipv4Segment}){3}$\`);
    if (ipv4.test(value)) return true;

    if (!value.includes(":")) return false;
    try {
        new URL(\`http://[\${value}]\`);
        return true;
    }
    catch {
        /* istanbul ignore next -- @preserve */
        /* v8 ignore next 2 */
        return false;
    }
}

function isTrustedProxy(ip: string): boolean {
    // Matches private IPv4 ranges, loopback, and link-local addresses.
    const privateIpv4 = /^(127\\.|10\\.|192\\.168\\.|169\\.254\\.|172\\.(1[6-9]|2[0-9]|3[0-1])\\.)/;
    // Matches IPv4-mapped IPv6 versions of the same private IPv4 ranges.
    const privateIpv4MappedIpv6 = /^::ffff:(127\\.|10\\.|192\\.168\\.|169\\.254\\.|172\\.(1[6-9]|2[0-9]|3[0-1])\\.)/i;
    // Matches IPv6 loopback, ULA (fc00::\\/7), and link-local (fe80::\\/10).
    const privateIpv6 = /^(::1|f[cd]|fe[89ab])/i;

    return (
        privateIpv4.test(ip) ||
        privateIpv4MappedIpv6.test(ip) ||
        privateIpv6.test(ip)
    );
}

export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (!forwardedFor) return "unknown";

    const ips = forwardedFor.split(",").map(ip => ip.trim());

    // Iterate from right to left and return the first non-private IP as the client IP.
    for (let i = ips.length - 1; i >= 0; i--) {
        const ip = ips[i];
        if (ip && isValidIp(ip) && !isTrustedProxy(ip)) {
            return ip;
        }
    }

    return "unknown";
}
`;

fs.writeFileSync('src/lib/rateLimit.ts', code);
