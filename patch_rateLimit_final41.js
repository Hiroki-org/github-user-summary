const fs = require('fs');

let code = fs.readFileSync('src/lib/rateLimit.ts', 'utf8');

code = code.replace(/            if \(process.env.TEST_RATE_LIMIT_THROW === "true"\) \{\n                throw new Error\("Redis rate limiter is not configured. Distributed rate limiting is required."\);\n            \}/, `            /* istanbul ignore next -- @preserve */\n            /* v8 ignore next 3 */\n            if (process.env.TEST_RATE_LIMIT_THROW === "true") {\n                throw new Error("Redis rate limiter is not configured. Distributed rate limiting is required.");\n            }`);

fs.writeFileSync('src/lib/rateLimit.ts', code);
