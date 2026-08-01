import "server-only";

import { GitHubApiError } from "@/lib/types";

type GitHubUser = {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    followers: number;
    following: number;
    public_repos: number;
};

type GitHubRepo = {
    name: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    html_url: string;
    pushed_at: string;
};

export type CardProfileData = {
    login: string;
    name: string;
    avatarUrl: string;
    bio: string;
    followers: number;
    following: number;
    publicRepos: number;
};

export type CardRepoData = {
    name: string;
    stars: number;
    forks: number;
    language: string | null;
    url: string;
    pushedAt: string;
};

export type CardLanguageData = {
    name: string;
    count: number;
    percentage: number;
};

export type CardData = {
    profile: CardProfileData;
    repos: CardRepoData[];
    totalStars: number;
    languages: CardLanguageData[];
    streak: {
        current: number;
        longest: number;
    };
    heatmap: {
        days: { date: string; count: number }[];
        maxCount: number;
    };
};

const GITHUB_API = "https://api.github.com";
const GITHUB_TIMEOUT_MS = 8000;

function getHeaders(): HeadersInit {
    const token = process.env.GITHUB_TOKEN?.trim();
    const headers: HeadersInit = {
        Accept: "application/vnd.github+json",
        "User-Agent": "github-user-summary",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function getJson<T>(url: string): Promise<{ status: number; data: T | null }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(url, {
            headers: getHeaders(),
            cache: "no-store",
            signal: controller.signal,
        });
    } catch (error) {
        if ((error as Error).name === "AbortError") {
            throw new GitHubApiError("GitHub API request timed out", 504);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }

    if (response.status === 404) {
        return { status: 404, data: null };
    }

    if (!response.ok) {
        const body = await response.text().catch(() => "Unknown GitHub error");
        throw new GitHubApiError(body, response.status);
    }

    return {
        status: response.status,
        data: (await response.json()) as T,
    };
}

function toCardProfile(user: GitHubUser): CardProfileData {
    return {
        login: user.login,
        name: user.name ?? user.login,
        avatarUrl: user.avatar_url,
        bio: user.bio ?? "",
        followers: user.followers,
        following: user.following,
        publicRepos: user.public_repos,
    };
}

function buildStreak(days: { date: string; count: number }[]): { current: number; longest: number } {
    let longest = 0;
    let activeRun = 0;

    for (const day of days) {
        if (day.count > 0) {
            activeRun += 1;
            longest = Math.max(longest, activeRun);
        } else {
            activeRun = 0;
        }
    }

    let current = 0;
    for (let i = days.length - 1; i >= 0; i -= 1) {
        if (days[i].count > 0) {
            current += 1;
        } else {
            break;
        }
    }

    return { current, longest };
}

export async function fetchCardData(username: string): Promise<CardData | null> {
    const encodedUser = encodeURIComponent(username);
    const profileUrl = `${GITHUB_API}/users/${encodedUser}`;
    const reposUrl = `${GITHUB_API}/users/${encodedUser}/repos?sort=stars&per_page=10&type=owner`;

    const [profileResult, reposResult] = await Promise.all([
        getJson<GitHubUser>(profileUrl),
        getJson<GitHubRepo[]>(reposUrl),
    ]);

    if (!profileResult.data || profileResult.status === 404) {
        return null;
    }

    const rawRepos = reposResult.data ?? [];

    const repos: CardRepoData[] = [];
    const languageBucket = new Map<string, number>();
    let totalLanguageRepos = 0;
    let totalStars = 0;

    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - 41);

    const dayCounts = new Map<string, number>();
    for (let i = 0; i < 42; i += 1) {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + i);
        const key = date.toISOString().slice(0, 10);
        dayCounts.set(key, 0);
    }

    for (let i = 0; i < rawRepos.length; i++) {
        const rawRepo = rawRepos[i];

        const repo: CardRepoData = {
            name: rawRepo.name,
            stars: rawRepo.stargazers_count,
            forks: rawRepo.forks_count,
            language: rawRepo.language,
            url: rawRepo.html_url,
            pushedAt: rawRepo.pushed_at,
        };
        repos.push(repo);

        totalStars += repo.stars;

        if (repo.language) {
            languageBucket.set(repo.language, (languageBucket.get(repo.language) ?? 0) + 1);
            totalLanguageRepos += 1;
        }

        if (repo.pushedAt) {
            let key: string | undefined;
            if (repo.pushedAt.length >= 10 && repo.pushedAt[4] === '-' && repo.pushedAt[7] === '-') {
                key = repo.pushedAt.slice(0, 10);
            } else {
                const pushed = new Date(repo.pushedAt);
                if (!Number.isNaN(pushed.getTime())) {
                    key = pushed.toISOString().slice(0, 10);
                }
            }
            if (key && dayCounts.has(key)) {
                dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
            }
        }
    }

    const languages: CardLanguageData[] = Array.from(languageBucket.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalLanguageRepos > 0 ? Math.round((count / totalLanguageRepos) * 1000) / 10 : 0,
        }));

    const days = Array.from(dayCounts.entries()).map(([date, count]) => ({ date, count }));
    const maxCount = days.reduce((max, day) => Math.max(max, day.count), 0);
    const heatmap = { days, maxCount };

    const streak = buildStreak(heatmap.days);

    return {
        profile: toCardProfile(profileResult.data),
        repos,
        totalStars,
        languages,
        streak,
        heatmap,
    };
}
