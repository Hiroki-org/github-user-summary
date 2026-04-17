const fs = require('fs');
const content = fs.readFileSync('src/lib/__tests__/github/fetchActivity.test.ts', 'utf-8');
const toAppend = `
    it("100件以上のイベントがある場合、次のページも取得する", async () => {
      const hundredEvents = Array.from({ length: 100 }, (_, i) => ({ type: "PushEvent", created_at: "2024-01-15T10:30:00Z" }));
      mockFetch
        .mockResolvedValueOnce(jsonResponse(hundredEvents))
        .mockResolvedValueOnce(jsonResponse(MOCK_EVENTS))
        .mockResolvedValueOnce(jsonResponse([]));

      const { fetchActivity } = await import("../../github");
      const result = await fetchActivity("testuser", "fake-token");

      expect(result.totalEvents).toBe(100 + MOCK_EVENTS.length);
    });
`;
const newContent = content.replace(/    \}\);\n  \}\);\n\}\);/, '    });\n  });\n' + toAppend + '});');
fs.writeFileSync('src/lib/__tests__/github/fetchActivity.test.ts', newContent);
