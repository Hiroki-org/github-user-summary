import "server-only";

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

function headers(token?: string): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-user-summary",
  };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 404) {
    throw new UserNotFoundError("unknown");
  }
  if (res.status === 403) {
    const resetHeader = res.headers.get("X-RateLimit-Reset");
    const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
    throw new RateLimitError(resetTimestamp);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new GitHubApiError(body, res.status);
  }
  return res.json() as Promise<T>;
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

  const json = await handleResponse<{ data?: T; errors?: { message: string }[] }>(res);
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
  const pinnedQuery = `query($login: String!) {
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

  // REST は認証なしでも可，GraphQL は token 必須
  const profilePromise = restGet<GitHubUser>(`/users/${encodeURIComponent(username)}`, token);
  const orgsPromise = restGet<GitHubOrg[]>(`/users/${encodeURIComponent(username)}/orgs`, token);
  const pinnedPromise = token
    ? graphql<PinnedItemsResponse>(pinnedQuery, token, { login: username }).catch(() => null)
    : Promise.resolve(null);

  const [profile, orgs, pinned] = await Promise.all([
    profilePromise,
    orgsPromise,
    pinnedPromise,
  ]);

  const pinnedRepos: PinnedRepo[] = pinned?.user?.pinnedItems?.nodes?.map((n) => ({
    name: n.name,
    description: n.description,
    url: n.url,
    stargazerCount: n.stargazerCount,
    primaryLanguage: n.primaryLanguage,
  })) ?? [];

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
  const languages: LanguageStats[] = Array.from(languageRepoCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, repoCount]) => ({
      name,
      bytes: repoCount,
      percentage: totalRepoCount > 0 ? Math.round((repoCount / totalRepoCount) * 1000) / 10 : 0,
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

  const topics = Array.from(topicCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

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
  const languages: LanguageStats[] = Array.from(languageMap.entries())
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 10)
    .map(([name, { bytes, color }]) => ({
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

  const topics = Array.from(topicCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

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
  const mostActiveDay = maxWeekdayTotal > 0
    ? weekdayNames[weekdayTotals.findIndex((count) => count === maxWeekdayTotal)]
    : "";

  return {
    totalCommits: cc.totalCommitContributions,
    totalPRs: cc.totalPullRequestContributions,
    totalIssues: cc.totalIssueContributions,
    totalReviews: cc.totalPullRequestReviewContributions,
    totalContributions: cc.contributionCalendar.totalContributions,
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

  for (let page = 1; page <= 2; page += 1) {
    const res = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=100&page=${page}`,
      {
        headers: {
          ...headers(token),
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 300 },
      }
    );

    const starred = await handleResponse<StarredRepo[]>(res);
    allStarred.push(...starred);

    if (starred.length < 100) {
      break;
    }
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

  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topLanguages = Array.from(languageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

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
export async function fetchActivity(
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
  promises.forEach((p) => p.catch(() => {}));

  for (const p of promises) {
    try {
      const events = await p;
      allEvents.push(...events);
      if (events.length < 100) break;
    } catch (error) {
      if (
        error instanceof UserNotFoundError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }
      break;
    }
  }

  // 曜日×時間帯ヒートマップ (7×24)
  const heatmap: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  const eventCountMap = new Map<string, number>();

  for (const event of allEvents) {
    const date = new Date(event.created_at);
    const day = date.getUTCDay(); // 0=Sun, 6=Sat
    const hour = date.getUTCHours();
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
}

// ===== 6. fetchUserSummary =====

/**
 * 全セクションを並行取得し、UserSummary として集約
 * Promise.allSettled で部分失敗に対応（profile 404 のみ再スロー）
 * @throws {UserNotFoundError} プロフィールが404の場合
 */
export async function fetchUserSummary(
  username: string,
  token?: string
): Promise<UserSummary> {
  const results = await Promise.allSettled([
    fetchUserProfile(username, token),
    fetchRepositories(username, token),
    fetchContributions(username, token),
    fetchActivity(username, token),
    fetchStarredRepos(username, token),
  ]);

  const errors: { section: string; message: string }[] = [];
  const sections = ["profile", "repositories", "contributions", "activity", "interests"] as const;

  const values = results.map((r, i) => {
    if (r.status === "fulfilled") {
      return r.value;
    }
    errors.push({ section: sections[i], message: r.reason?.message ?? "Unknown error" });
    return null;
  });

  // profileが404の場合はUserNotFoundErrorを再スロー
  if (results[0].status === "rejected" && results[0].reason instanceof UserNotFoundError) {
    throw results[0].reason;
  }

  return {
    profile: values[0] as UserProfile | null,
    repositories: values[1] as RepositoryData | null,
    contributions: values[2] as ContributionData | null,
    activity: values[3] as ActivityData | null,
    interests: values[4] as InterestsData | null,
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
