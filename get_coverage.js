const fs = require('fs');

const code = fs.readFileSync('src/lib/rateLimit.ts', 'utf8');
const lines = code.split('\n');
console.log(lines.join('\n'));
