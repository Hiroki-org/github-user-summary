import fs from 'fs';
const filePath = 'src/lib/yearInReviewUtils.ts';
let content = fs.readFileSync(filePath, 'utf8');

const tDefinition = 'const SAKAMOTO_T = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];\n\n/**';
content = content.replace('/**\n * Fast calculation', tDefinition + ' * Fast calculation');

content = content.replace('const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];', '');
content = content.replace('t[m - 1]', 'SAKAMOTO_T[m - 1]');

// Ensure we have modulo handling correct. JavaScript's modulo can return negative.
// We need `((... % 7) + 7) % 7`.
content = content.replace('return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + SAKAMOTO_T[m - 1] + d) % 7;', 'return ((y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + SAKAMOTO_T[m - 1] + d) % 7 + 7) % 7;');

// Ensure rigorous parsing logic by extracting the string directly via char codes or regex.
// Well, parseInt is usually fine.
// The comment also said: ISO判定・厳密な数値検証・正のmodulo返却を追加しました
// So:
// 1. Move SAKAMOTO_T outside (done)
// 2. Strict numeric validation
// 3. Positive modulo (done)

content = content.replace(/    let y = parseInt\(yStr, 10\);\n    const m = parseInt\(mStr, 10\);\n    const d = parseInt\(dStr, 10\);\n\n    if \(Number.isNaN\(y\) \|\| Number.isNaN\(m\) \|\| Number.isNaN\(d\) \|\| m < 1 \|\| m > 12\) {/g,
`    let y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);

    // Strict validation: length checks and ensuring components are purely numeric
    if (
        Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d) ||
        !/^\\d{4}$/.test(yStr) || !/^\\d{2}$/.test(mStr) || !/^\\d{2}$/.test(dStr) ||
        m < 1 || m > 12 || d < 1 || d > 31
    ) {`);

fs.writeFileSync(filePath, content);
