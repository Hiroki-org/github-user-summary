import "server-only";
import type { InterestsData } from "@/lib/types";
import { GITHUB_API, headers, handleResponse } from "./api";
import { getTopK } from "./utils";

type StarredRepo = {
  topics?: string[];
  language: string | null;
};

/**
 * Task⑫: starred リポジトリから興味分野を推定
 * REST /users/:username/starred (最大200件, topics/language 集計)
 * @throws {UserNotFoundError} ユーザーが見つからない場合
 * @throws {RateLimitError} APIレート制限に達した場合
 */
export async function fetchStarredRepos(
  username: string,
  token?: string
): Promise<InterestsData> {
  const allStarred: StarredRepo[] = [];

  const fetchPage = (page: number) =>
    fetch(
      `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=100&page=${page}`,
      {
        headers: {
          ...headers(token),
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 300 },
      }
    );

  const [res1, res2] = await Promise.all([fetchPage(1), fetchPage(2)]);

  const starred1 = await handleResponse<StarredRepo[]>(res1);
  allStarred.push(...starred1);

  if (starred1.length === 100) {
    const starred2 = await handleResponse<StarredRepo[]>(res2);
    allStarred.push(...starred2);
  }

  const topicCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();

  for (const repo of allStarred) {
    for (const topic of repo.topics ?? []) {
      const normalized = topic.trim();
      if (!normalized) {
        continue;
      }
      topicCounts.set(normalized, (topicCounts.get(normalized) ?? 0) + 1);
    }

    if (repo.language) {
      languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
    }
  }

  const topTopics = getTopK(topicCounts, 10);

  const topLanguages = getTopK(languageCounts, 10);

  return {
    topTopics,
    topLanguages,
    totalStarred: allStarred.length,
  };
}
