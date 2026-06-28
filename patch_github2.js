const fs = require('fs');
let code = fs.readFileSync('src/lib/github.ts', 'utf8');

const target = `  for (const repo of nonFork) {
    if (repo.language) {
      const existing = languageRepoCount.get(repo.language);
      languageRepoCount.set(repo.language, (existing ?? 0) + 1);
    }
    if (repo.topics) {
      for (const topic of repo.topics) {
        const normalized = topic.trim();
        if (normalized) {
          const existing = topicCountMap.get(normalized);
          topicCountMap.set(normalized, (existing ?? 0) + 1);
        }
      }
    }
  }`;

// Actually I don't need to patch github.ts if the tests themselves provide 100% coverage
