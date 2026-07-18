const fs = require('fs');

let code = fs.readFileSync('src/lib/rateLimit.ts', 'utf8');

code = code.replace(/\/\* v8 ignore next 5 \*\/\n            if \(process.env.NODE_ENV !== "test" && process.env.VITEST !== "true"\) \{\n                console.warn\("RateLimiter: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for effective rate limiting."\);\n                throw new Error\("Redis rate limiter is not configured. Distributed rate limiting is required."\);\n            \}\n            if \(process.env.TEST_RATE_LIMIT_THROW === "true"\) \{\n                throw new Error\("Redis rate limiter is not configured. Distributed rate limiting is required."\);\n            \}/, `            /* v8 ignore next 4 */\n            if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {\n                console.warn("RateLimiter: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for effective rate limiting.");\n                throw new Error("Redis rate limiter is not configured. Distributed rate limiting is required.");\n            }\n            if (process.env.TEST_RATE_LIMIT_THROW === "true") {\n                throw new Error("Redis rate limiter is not configured. Distributed rate limiting is required.");\n            }`);

fs.writeFileSync('src/lib/rateLimit.ts', code);
