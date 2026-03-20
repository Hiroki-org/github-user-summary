import "server-only";

import { GitHubApiError, RateLimitError, UserNotFoundError, type YearInReviewData } from "@/lib/types";
import { buildHourlyHeatmapFromCommitDates, getMostActiveDayFromCalendar, getMostActiveHour } from "@/lib/yearInReviewUtils";

const YEAR_IN_REVIEW_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
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
        commitContributionsByRepository(maxRepositories: 10) {
          repository {
            name
            owner { login }
          }
          contributions { totalCount }
        }
        pullRequestContributionsByRepository(maxRepositories: 10) {
          repository {
            name
            owner { login }
          }
          contributions { totalCount }
        }
        issueContributionsByRepository(maxRepositories: 10) {
          repository {
            name
            owner { login }
          }
          contributions { totalCount }
        }
      }
    }
  }`;

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

type GitHubGraphQlResponse<T> = {
    data?: T;
    errors?: { message: string }[];
};

type ContributionsByRepoNode = {
    repository: {
        name: string;
        owner: { login: string };
    };
    contributions: {
        totalCount: number;
    };
};

type YearInReviewResponse = {
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
            commitContributionsByRepository: ContributionsByRepoNode[];
            pullRequestContributionsByRepository: ContributionsByRepoNode[];
            issueContributionsByRepository: ContributionsByRepoNode[];
        };
    } | null;
};

type GitHubCommit = {
    commit: {
        author: {
            date: string;
        } | null;
    };
};

function headers(token: string): HeadersInit {
    return {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "github-user-summary",
    };
}

function handleRateLimit(res: Response): never {
    const resetHeader = res.headers.get("X-RateLimit-Reset");
    const resetTimestamp = resetHeader ? Number.parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
    throw new RateLimitError(Number.isFinite(resetTimestamp) ? resetTimestamp : Math.floor(Date.now() / 1000) + 3600);
}

async function graphql<T>(query: string, token: string, variables: Record<string, unknown>): Promise<T> {
    const res = await fetch(GITHUB_GRAPHQL, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
    });

    if (res.status === 403) {
        handleRateLimit(res);
    }
    if (!res.ok) {
        const body = await res.text().catch(() => "Unknown error");
        throw new GitHubApiError(body, res.status);
    }

    const json = (await res.json()) as GitHubGraphQlResponse<T>;
    if (json.errors?.length) {
        throw new GitHubApiError(json.errors[0].message, 422);
    }
    if (!json.data) {
        throw new GitHubApiError("No data returned from GitHub GraphQL", 500);
    }

    return json.data;
}

function mergeTopRepository(data: NonNullable<YearInReviewResponse["user"]>["contributionsCollection"]): { name: string; contributions: number } | null {
    const counter = new Map<string, number>();
    const buckets = [
        ...data.commitContributionsByRepository,
        ...data.pullRequestContributionsByRepository,
        ...data.issueContributionsByRepository,
    ];

    for (const item of buckets) {
        const name = `${item.repository.owner.login}/${item.repository.name}`;
        counter.set(name, (counter.get(name) ?? 0) + item.contributions.totalCount);
    }

    let top: { name: string; contributions: number } | null = null;
    for (const [name, contributions] of counter.entries()) {
        if (!top || contributions > top.contributions) {
            top = { name, contributions };
        }
    }

    return top;
}

async function fetchCommitDatesForTopRepos(
    username: string,
    token: string,
    fromIso: string,
    toIso: string,
    repositories: ContributionsByRepoNode[]
): Promise<string[]> {
    const candidates = repositories
        .filter((repo) => repo.contributions.totalCount > 0)
        .sort((a, b) => b.contributions.totalCount - a.contributions.totalCount)
        .slice(0, 4);

    const promises = candidates.map(async (repo) => {
        const path = `/repos/${repo.repository.owner.login}/${repo.repository.name}/commits`;
        const url = new URL(`${GITHUB_API}${path}`);
        url.searchParams.set("author", username);
        url.searchParams.set("since", fromIso);
        url.searchParams.set("until", toIso);
        url.searchParams.set("per_page", "100");

        const res = await fetch(url.toString(), { headers: headers(token), cache: "no-store" });
        if (res.status === 403) {
            handleRateLimit(res);
        }
        if (!res.ok) {
            return [];
        }

        const commits = (await res.json()) as GitHubCommit[];
        const dates: string[] = [];
        for (const commit of commits) {
            const date = commit.commit.author?.date;
            if (date) {
                dates.push(date);
            }
        }
        return dates;
    });

    const results = await Promise.all(promises);
    return results.flat();
}


function buildYearInReviewData(
    year: number,
    collection: NonNullable<YearInReviewResponse["user"]>["contributionsCollection"],
    commitDates: string[]
): YearInReviewData {
    const contributionCalendar = collection.contributionCalendar.weeks.flatMap((week) =>
        week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount }))
    );

    const hourlyHeatmap = buildHourlyHeatmapFromCommitDates(commitDates);

    return {
        year,
        totalContributions: collection.contributionCalendar.totalContributions,
        totalCommits: collection.totalCommitContributions,
        totalPRs: collection.totalPullRequestContributions,
        totalIssues: collection.totalIssueContributions,
        totalReviews: collection.totalPullRequestReviewContributions,
        mostActiveDay: getMostActiveDayFromCalendar(contributionCalendar),
        mostActiveHour: getMostActiveHour(hourlyHeatmap),
        topRepository: mergeTopRepository(collection),
        contributionCalendar,
    };
}

export async function fetchYearInReviewData(username: string, year: number, token?: string): Promise<YearInReviewData> {
    if (!token) {
        throw new GitHubApiError("Year in Review requires authentication token", 401);
    }

    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));


    const response = await graphql<YearInReviewResponse>(YEAR_IN_REVIEW_QUERY, token, {
        login: username,
        from: from.toISOString(),
        to: to.toISOString(),
    });

    if (!response.user) {
        throw new UserNotFoundError(username);
    }

    const collection = response.user.contributionsCollection;
    const commitDates = await fetchCommitDatesForTopRepos(
        username,
        token,
        from.toISOString(),
        to.toISOString(),
        collection.commitContributionsByRepository
    );

    return buildYearInReviewData(year, collection, commitDates);
}

export async function fetchCommitActivityHeatmap(username: string, year: number, token?: string): Promise<number[][]> {
    if (!token) {
        throw new GitHubApiError("Commit activity requires authentication token", 401);
    }

    const yearData = await fetchYearInReviewData(username, year, token);
    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    if (!yearData.topRepository) {
        return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    }

    const [owner, repo] = yearData.topRepository.name.split("/");
    const url = new URL(`${GITHUB_API}/repos/${owner}/${repo}/commits`);
    url.searchParams.set("author", username);
    url.searchParams.set("since", from.toISOString());
    url.searchParams.set("until", to.toISOString());
    url.searchParams.set("per_page", "100");

    const res = await fetch(url.toString(), { headers: headers(token), cache: "no-store" });
    if (res.status === 403) {
        handleRateLimit(res);
    }
    if (!res.ok) {
        return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    }

    const commits = (await res.json()) as GitHubCommit[];
    const dates = commits
        .map((commit) => commit.commit.author?.date)
        .filter((value): value is string => Boolean(value));

    return buildHourlyHeatmapFromCommitDates(dates);
}
