const fs = require('fs');
const content = fs.readFileSync('src/lib/__tests__/github/fetchActivity.test.ts', 'utf-8');
const toAppend = `
    it("1ページ目で500エラーの場合、空の結果を返す(早期終了)", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(null, 500))
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      expect(result.totalEvents).toBe(0);
      expect(result.eventBreakdown.length).toBe(0);
    });
`;
const newContent = content.replace(/    \}\);\n  \}\);\n\}\);/, '    });\n' + toAppend + '  });\n});');
fs.writeFileSync('src/lib/__tests__/github/fetchActivity.test.ts', newContent);
