import "server-only";
import { cache } from 'react';
import { logger } from "@/lib/logger";

import type {
  UserProfile,
  RepositoryData,
  ContributionData,
  ActivityData,
  InterestsData,
  UserSummary,
  LanguageStats,
  TopRepo,
  PinnedRepo,
} from "./types";
import {
  UserNotFoundError,
  RateLimitError,
  GitHubApiError,
} from "./types";

// ===== ヘルパー =====

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

export function headers(token?: string): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-user-summary",
  };
  if (token) {
    if (!/^[A-Za-z0-9_=-]+$/.test(token)) {
      throw new GitHubApiError("Invalid token format", 400);
    }
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

export function handleRateLimit(res: Response): never {
  const resetHeader = res.headers.get("X-RateLimit-Reset");
  const resetTimestamp = resetHeader ? Number.parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
  throw new RateLimitError(Number.isFinite(resetTimestamp) ? resetTimestamp : Math.floor(Date.now() / 1000) + 3600);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 404) {
    throw new UserNotFoundError("unknown");
  }
  if (res.status === 403) {
    handleRateLimit(res);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new GitHubApiError(body, res.status);
  }
  return res.json() as Promise<T>;
}


function calculateStreaks(calendar: { count: number }[]): { longestStreak: number; currentStreak: number } {
  let longestStreak = 0;
  let currentStreak = 0;
  let streak = 0;

  for (const day of calendar) {
    if (day.count > 0) {
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  let startIdx = calendar.length - 1;
  if (startIdx >= 0 && calendar[startIdx].count === 0) {
    startIdx -= 1;
  }
  for (let i = startIdx; i >= 0; i -= 1) {
    if (calendar[i].count > 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return { longestStreak, currentStreak };
}

function calculateMostActiveDay(calendar: { date: string; count: number }[]): string | null {
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekdayTotals = Array.from({ length: 7 }, () => 0);

  for (const day of calendar) {
    if (day.count === 0) {
      continue;
    }
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    weekdayTotals[weekday] += day.count;
  }

  const maxWeekdayTotal = Math.max(...weekdayTotals);
  return maxWeekdayTotal > 0
    ? weekdayNames[weekdayTotals.findIndex((count) => count === maxWeekdayTotal)]
    : null;
}

async function graphql<T>(query: string, token?: string, variables?: Record<string, unknown>): Promise<T> {
  if (!token) {
    throw new GitHubApiError("GraphQL API requires authentication token", 401);
  }
  const body: { query: string; variables?: Record<string, unknown> } = { query };
  if (variables) {
    body.variables = variables;
  }

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });
  if (res.status === 403) {
    handleRateLimit(res);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new GitHubApiError(body, res.status);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors && json.errors.length > 0) {
    throw new GitHubApiError(json.errors[0].message, 422);
  }
  if (!json.data) {
    throw new GitHubApiError("No data returned from GraphQL", 500);
  }
  return json.data;
}

// ===== REST ヘルパー =====

async function restGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: headers(token),
    next: { revalidate: 300 },
  });
  return handleResponse<T>(res);
}

// ===== 1. fetchUserProfile =====

type GitHubUser = {
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  created_at: string;
  followers: number;
  following: number;
  public_repos: number;
};

type GitHubOrg = {
  login: string;
  avatar_url: string;
};

type PinnedItemsResponse = {
  user: {
    pinnedItems: {
      nodes: {
        name: string;
        description: string | null;
        url: string;
        stargazerCount: number;
        primaryLanguage: { name: string; color: string } | null;
      }[];
    };
  } | null;
};

const PINNED_REPOS_QUERY = `query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount
          primaryLanguage { name color }
        }
      }
    }
  }
}`;

async function fetchBasicProfile(username: string, token?: string): Promise<GitHubUser> {
  return restGet<GitHubUser>(`/users/${encodeURIComponent(username)}`, token);
}

async function fetchOrganizations(username: string, token?: string): Promise<GitHubOrg[]> {
  return restGet<GitHubOrg[]>(`/users/${encodeURIComponent(username)}/orgs`, token);
}

async function fetchPinnedRepos(username: string, token?: string): Promise<PinnedRepo[]> {
  if (!token) return [];

  const pinned = await graphql<PinnedItemsResponse>(PINNED_REPOS_QUERY, token, { login: username }).catch(() => null);

  return pinned?.user?.pinnedItems?.nodes?.map((n) => ({
    name: n.name,
    description: n.description,
    url: n.url,
    stargazerCount: n.stargazerCount,
    primaryLanguage: n.primaryLanguage,
  })) ?? [];
}

/**
 * Task④: ユーザープロフィール・組織・ピン留めリポジトリを取得
 * REST /users/:username + /users/:username/orgs + GraphQL pinnedItems
 * @throws {UserNotFoundError} ユーザーが存在しない場合
 * @throws {RateLimitError} APIレート制限に達した場合
 */
export async function fetchUserProfile(
  username: string,
  token?: string
): Promise<UserProfile> {
  const [profile, orgs, pinnedRepos] = await Promise.all([
    fetchBasicProfile(username, token),
    fetchOrganizations(username, token),
    fetchPinnedRepos(username, token),
  ]);

  return {
    login: profile.login,
    avatar_url: profile.avatar_url,
    name: profile.name,
    bio: profile.bio,
    company: profile.company,
    location: profile.location,
    blog: profile.blog,
    twitter_username: profile.twitter_username,
    created_at: profile.created_at,
    followers: profile.followers,
    following: profile.following,
    public_repos: profile.public_repos,
    orgs,
    pinnedRepos,
  };
}

// ===== 2. fetchRepositories =====

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
export const fetchRepositories = cache(async function fetchRepositories(
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
});

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

// ===== 3. fetchContributions =====

type ContributionsResponse = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: {
          contributionDays: {
            date: string;
            contributionCount: number;
          }[];
        }[];
      };
    };
  } | null;
};

/**
 * Task⑥: 過去1年間のコントリビューション統計を取得
 * GraphQL contributionsCollection (認証必須)
 * コミット・PR・Issue・レビュー数 + 日別カレンダーデータ
 * @throws {GitHubApiError} 認証トークンがない場合
 * @throws {UserNotFoundError} ユーザーが見つからない場合
 * @throws {RateLimitError} APIレート制限に達した場合
 */
export async function fetchContributions(
  username: string,
  token?: string
): Promise<ContributionData> {
  if (!token) {
    // GraphQL 必須なので、token なしの場合はデフォルト値を返す
    throw new GitHubApiError("Contributions data requires authentication", 401);
  }

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const sevenDaysAgoStr = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`;

  const data = await graphql<ContributionsResponse>(query, token, {
    login: username,
    from: oneYearAgo.toISOString(),
    to: now.toISOString(),
  });
  if (!data.user) {
    throw new UserNotFoundError(username);
  }

  const cc = data.user.contributionsCollection;
  const calendar = cc.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
    }))
  );


  calendar.sort((a, b) => a.date.localeCompare(b.date));

  let weeklyContributions = 0;
  let monthlyContributions = 0;

  for (let i = calendar.length - 1; i >= 0; i--) {
    const day = calendar[i];

    if (day.date < thirtyDaysAgoStr) {
      break;
    }

    monthlyContributions += day.count;

    if (day.date >= sevenDaysAgoStr) {
      weeklyContributions += day.count;
    }
  }

  const { longestStreak, currentStreak } = calculateStreaks(calendar);
  const mostActiveDay = calculateMostActiveDay(calendar);

  return {
    totalCommits: cc.totalCommitContributions,
    totalPRs: cc.totalPullRequestContributions,
    totalIssues: cc.totalIssueContributions,
    totalReviews: cc.totalPullRequestReviewContributions,

    totalContributions: cc.contributionCalendar.totalContributions,
    monthlyContributions,
    weeklyContributions,
    longestStreak,
    currentStreak,
    mostActiveDay,
    calendar,
  };
}

// ===== 4.5 fetchStarredRepos =====

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

// ===== 5. fetchActivity =====

type GitHubEvent = {
  type: string;
  created_at: string;
};

/**
 * Task⑦: アクティビティヒートマップ・イベント内訳を取得
 * REST /users/:username/events/public (最大3ページ)
 * 曜日×時間帯の7×24ヒートマップ + イベント種別集計
 * @throws {UserNotFoundError} ユーザーが見つからない場合
 * @throws {RateLimitError} APIレート制限に達した場合
 */
export const fetchActivity = cache(async function fetchActivity(
  username: string,
  token?: string
): Promise<ActivityData> {
  const pages = [1, 2, 3];
  const allEvents: GitHubEvent[] = [];

  const promises = pages.map((page) =>
    restGet<GitHubEvent[]>(
      `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
      token
    )
  );

  // Suppress unhandled promise rejections for subsequent pages if we break early or throw
  promises.forEach((p) => p.catch((e) => logger.error("Event fetch promise rejected:", e)));

  const results = await Promise.all(
    promises.map(p =>
      p.catch(error => {
        if (
          error instanceof UserNotFoundError ||
          error instanceof RateLimitError
        ) {
          throw error;
        }
        return null;
      })
    )
  );

  for (const events of results) {
    if (events === null) break;
    allEvents.push(...events);
    if (events.length < 100) break;
  }

  // 曜日×時間帯ヒートマップ (7×24)
  const heatmap: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  const eventCountMap = new Map<string, number>();
  const dayCache = new Map<string, number>();

  for (const event of allEvents) {
    const createdAt = event.created_at;
    const datePart = createdAt.slice(0, 10);

    let day = dayCache.get(datePart);
    if (day === undefined) {
      day = new Date(datePart).getUTCDay(); // 0=Sun, 6=Sat
      dayCache.set(datePart, day);
    }

    // Fast hour extraction from YYYY-MM-DDTHH:MM:SSZ
    const charCodeZero = '0'.charCodeAt(0);
    const hour = (createdAt.charCodeAt(11) - charCodeZero) * 10 + (createdAt.charCodeAt(12) - charCodeZero);
    heatmap[day][hour]++;

    eventCountMap.set(event.type, (eventCountMap.get(event.type) ?? 0) + 1);
  }

  const eventBreakdown = Array.from(eventCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  return {
    heatmap,
    eventBreakdown,
    totalEvents: allEvents.length,
  };
});

// ===== 6. fetchUserSummary =====


/**
 * 効率的に Map から上位 K 件を抽出するヘルパー関数
 * 上位 K 件だけを返します。
 */
function getTopK(map: Map<string, number>, k: number = 10): { name: string; count: number }[] {
  const limit = Math.max(0, k);
  return Array.from(map, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 結果を処理し、エラーがあれば記録するヘルパー関数
 */
function processResult<T>(
  result: PromiseSettledResult<T>,
  section: string,
  errors: { section: string; message: string }[]
): T | null {
  if (result.status === "fulfilled") {
    return result.value;
  }
  errors.push({ section, message: result.reason?.message ?? String(result.reason ?? "Unknown error") });
  return null;
}

/**
 * 全セクションを並行取得し、UserSummary として集約
 * Promise.allSettled で部分失敗に対応（profile 404 のみ再スロー）
 * @throws {UserNotFoundError} プロフィールが404の場合
 */
export async function fetchUserSummary(
  username: string,
  token?: string
): Promise<UserSummary> {
  const [
    profileResult,
    repositoriesResult,
    contributionsResult,
    activityResult,
    interestsResult,
  ] = await Promise.allSettled([
    fetchUserProfile(username, token),
    fetchRepositories(username, token),
    fetchContributions(username, token),
    fetchActivity(username, token),
    fetchStarredRepos(username, token),
  ]);

  // profileが404の場合はUserNotFoundErrorを再スロー
  if (profileResult.status === "rejected" && profileResult.reason instanceof UserNotFoundError) {
    throw profileResult.reason;
  }

  const errors: { section: string; message: string }[] = [];

  return {
    profile: processResult(profileResult, "profile", errors),
    repositories: processResult(repositoriesResult, "repositories", errors),
    contributions: processResult(contributionsResult, "contributions", errors),
    activity: processResult(activityResult, "activity", errors),
    interests: processResult(interestsResult, "interests", errors),
    errors,
  };
}

// ===== ユーティリティ =====

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Scala: "#c22d40",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
    Svelte: "#ff3e00",
    Lua: "#000080",
    R: "#198CE7",
    Elixir: "#6e4a7e",
    Haskell: "#5e5086",
    Clojure: "#db5855",
    Erlang: "#B83998",
    Zig: "#ec915c",
    Nim: "#ffc200",
    OCaml: "#3be133",
    Julia: "#a270ba",
    Perl: "#0298c3",
    Jupyter: "#DA5B0B",
    "Jupyter Notebook": "#DA5B0B",
    Dockerfile: "#384d54",
    Makefile: "#427819",
    HCL: "#844FBA",
    Nix: "#7e7eff",
  };
  return colors[language] ?? "#8b949e";
}
