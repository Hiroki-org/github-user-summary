const fs = require('fs');
let content = fs.readFileSync('src/lib/__tests__/github/fetchActivity.test.ts', 'utf-8');

const additionalTest = `
    it("エラーが UserNotFoundError や RateLimitError 以外の場合、ループを抜ける", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Generic error"))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));
      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");
      expect(result.totalEvents).toBe(0);
    });
`;

content = content.replace(/}\);\n$/, additionalTest + '});\n');
fs.writeFileSync('src/lib/__tests__/github/fetchActivity.test.ts', content);
