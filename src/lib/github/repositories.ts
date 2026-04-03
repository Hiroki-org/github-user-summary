import "server-only";
import type { RepositoryData, LanguageStats, TopRepo } from "@/lib/types";
import { UserNotFoundError } from "@/lib/types";
import { graphql, restGet } from "./api";
import { getLanguageColor, getTopK } from "./utils";

type RepoLanguageNode = {
  name: string;
  color: string;
};

type RepoNode = {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  isFork: boolean;
  primaryLanguage: { name: string; color: string } | null;
  languages: {
    edges: {
      size: number;
      node: RepoLanguageNode;
    }[];
  };
  repositoryTopics: {
    nodes: {
      topic: {
        name: string;
      } | null;
    }[];
  };
};

type RepositoriesResponse = {
  user: {
    repositories: {
      totalCount: number;
      nodes: RepoNode[];
    };
  } | null;
};

/**
 * Task⑤: リポジトリ一覧・言語統計・トップリポジトリを取得
 * 認証時: GraphQL (言語バイト数ベース), 未認証時: REST フォールバック
 * @throws {UserNotFoundError} ユーザーが存在しない場合
 * @throws {RateLimitError} APIレート制限に達した場合
 */
export async function fetchRepositories(
  username: string,
  token?: string
): Promise<RepositoryData> {
  // GraphQL は認証必須。token がない場合は REST フォールバック
  if (!token) {
    return fetchRepositoriesREST(username);
  }

  const query = `query($login: String!) {
    user(login: $login) {
      repositories(first: 100, ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], orderBy: {field: STARGAZERS, direction: DESC}, isFork: false, privacy: PUBLIC) {
        totalCount
        nodes {
          name
          description
          url
          stargazerCount
          forkCount
          isFork
          primaryLanguage { name color }
          languages(first: 10) {
            edges {
              size
              node { name color }
            }
          }
          repositoryTopics(first: 10) {
            nodes {
              topic { name }
            }
          }
        }
      }
    }
  }`;

  const data = await graphql<RepositoriesResponse>(query, token, { login: username });
  if (!data.user) {
    throw new UserNotFoundError(username);
  }

  const repos = data.user.repositories.nodes.filter((r) => !r.isFork);
  return processRepoData(repos);
}

async function fetchRepositoriesREST(username: string): Promise<RepositoryData> {
  type RESTRepo = {
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    fork: boolean;
    language: string | null;
    topics?: string[];
  };

  const repos = await restGet<RESTRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=stars&direction=desc&type=all`
  );

  const nonFork = repos.filter((r) => !r.fork);
  // REST API は言語のバイト数を提供しないため、リポジトリ数を代用
  const languageRepoCount = new Map<string, number>();
  const topicCountMap = new Map<string, number>();

  for (const repo of nonFork) {
    if (repo.language) {
      languageRepoCount.set(repo.language, (languageRepoCount.get(repo.language) ?? 0) + 1);
    }
    for (const topic of repo.topics ?? []) {
      const normalized = topic.trim();
      if (!normalized) continue;
      topicCountMap.set(normalized, (topicCountMap.get(normalized) ?? 0) + 1);
    }
  }

  const totalRepoCount = Array.from(languageRepoCount.values()).reduce((a, b) => a + b, 0);
  const languages: LanguageStats[] = getTopK(languageRepoCount, 10).map(({ name, count }) => ({
    name,
    bytes: count,
    percentage: totalRepoCount > 0 ? Math.round((count / totalRepoCount) * 1000) / 10 : 0,
    color: getLanguageColor(name),
  }));

  const topRepos: TopRepo[] = nonFork.slice(0, 5).map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    stargazerCount: r.stargazers_count,
    forkCount: r.forks_count,
    primaryLanguage: r.language
      ? { name: r.language, color: getLanguageColor(r.language) }
      : null,
  }));

  const topics = getTopK(topicCountMap, 10);

  return { languages, topics, topRepos, totalCount: nonFork.length };
}

function processRepoData(repos: RepoNode[]): RepositoryData {
  const languageMap = new Map<string, { bytes: number; color: string }>();
  const topicCountMap = new Map<string, number>();

  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      const existing = languageMap.get(edge.node.name);
      if (existing) {
        existing.bytes += edge.size;
      } else {
        languageMap.set(edge.node.name, { bytes: edge.size, color: edge.node.color });
      }
    }

    for (const node of repo.repositoryTopics.nodes) {
      const topicName = node.topic?.name?.trim();
      if (!topicName) {
        continue;
      }
      topicCountMap.set(topicName, (topicCountMap.get(topicName) ?? 0) + 1);
    }
  }

  const totalBytes = Array.from(languageMap.values()).reduce((a, b) => a + b.bytes, 0);
  const topLanguages: { name: string; bytes: number; color: string }[] = [];
  for (const [name, data] of languageMap.entries()) {
    if (topLanguages.length < 10) {
      topLanguages.push({ name, ...data });
      topLanguages.sort((a, b) => b.bytes - a.bytes);
    } else if (data.bytes > topLanguages[9].bytes) {
      let i = 8;
      while (i >= 0 && topLanguages[i].bytes < data.bytes) {
        topLanguages[i + 1] = topLanguages[i];
        i--;
      }
      topLanguages[i + 1] = { name, ...data };
    }
  }

  const languages: LanguageStats[] = topLanguages.map(({ name, bytes, color }) => ({
    name,
    bytes,
    percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    color,
  }));

  const topRepos: TopRepo[] = repos.slice(0, 5).map((r) => ({
    name: r.name,
    description: r.description,
    url: r.url,
    stargazerCount: r.stargazerCount,
    forkCount: r.forkCount,
    primaryLanguage: r.primaryLanguage,
  }));

  const topics = getTopK(topicCountMap, 10);

  return { languages, topics, topRepos, totalCount: repos.length };
}
