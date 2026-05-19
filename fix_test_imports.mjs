import fs from 'fs';
const testFilePath = 'src/lib/__tests__/yearInReviewUtils.test.ts';
let content = fs.readFileSync(testFilePath, 'utf8');

const additionalTests2 = `
    it("returns correctly for invalid month", () => {
        expect(getWeekdayFromDateString("2023-99-01")).toBe(-1);
    });
`;

content = content.replace('describe("getWeekdayFromDateString", () => {', 'describe("getWeekdayFromDateString", () => {' + additionalTests2);
fs.writeFileSync(testFilePath, content);
