const fs = require('fs');

let code = fs.readFileSync('src/lib/rateLimit.ts', 'utf8');

code = code.replace(/\/\* v8 ignore next 6 \*\//, `/* v8 ignore next 5 */`);

fs.writeFileSync('src/lib/rateLimit.ts', code);
