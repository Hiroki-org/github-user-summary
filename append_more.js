const fs = require('fs');
const content = fs.readFileSync('src/lib/__tests__/github/fetchActivity.test.ts', 'utf-8');
const toAppend = `
    it("1ページ目で例外がスローされた場合(エラーインスタンス以外)、breakして処理を継続する", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Unexpected error"))
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
