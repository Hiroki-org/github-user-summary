const fs = require('fs');

let code = fs.readFileSync('src/lib/rateLimit.ts', 'utf8');

code = code.replace(/\/\* istanbul ignore if -- @preserve \*\/\n                        \/\* v8 ignore next 4 \*\//, `/* istanbul ignore next -- @preserve */\n            /* v8 ignore next 4 */`);

fs.writeFileSync('src/lib/rateLimit.ts', code);
