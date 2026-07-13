import "server-only";

import { GitHubApiError, RateLimitError, UserNotFoundError } from "@/lib/types";
import { headers, handleRateLimit } from "@/lib/github";
import { buildHourlyHeatmapFromCommitDates, getMostActiveDayFromCalendar, getMostActiveHour } from "@/lib/yearInReviewUtils";
import { logger } from "@/lib/logger";


const YEAR_IN_REVIEW_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!, $maxRepositories: Int!) {
    user(login: $login) {
      id
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
        commitContributionsByRepository(maxRepositories: $maxRepositories) { ...repoFields }
        pullRequestContributionsByRepository(maxRepositories: $maxRepositories) { ...repoFields }
        issueContributionsByRepository(maxRepositories: $maxRepositories) { ...repoFields }
      }
    }
  }
  fragment repoFields on ContributionsByRepository {
    repository {
      name
      owner { login }
    }
    contributions { totalCount }
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
        id: string;
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
        data.commitContributionsByRepository,
        data.pullRequestContributionsByRepository,
        data.issueContributionsByRepository,
    ];

    for (const bucket of buckets) {
        if (!bucket) continue;
        for (const item of bucket) {
            const name = `${item.repository.owner.login}/${item.repository.name}`;
            counter.set(name, (counter.get(name) ?? 0) + item.contributions.totalCount);
        }
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
    authorId: string,
    token: string,
    fromIso: string,
    toIso: string,
    repositories?: ContributionsByRepoNode[]
): Promise<string[]> {
    const candidates = (repositories || [])
        .filter((repo) => repo.contributions.totalCount > 0)
        .sort((a, b) => b.contributions.totalCount - a.contributions.totalCount)
        .slice(0, 4);

    if (candidates.length === 0) {
        return [];
    }

    const fragments: string[] = [];
    const variables: Record<string, unknown> = {
        authorId,
        since: fromIso,
        until: toIso,
    };

    candidates.forEach((repo, index) => {
        fragments.push(`
            repo${index}: repository(owner: $owner${index}, name: $name${index}) {
                defaultBranchRef {
                    target {
                        ... on Commit {
                            history(author: { id: $authorId }, since: $since, until: $until, first: 100) {
                                nodes {
                                    author {
                                        date
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);
        variables[`owner${index}`] = repo.repository.owner.login;
        variables[`name${index}`] = repo.repository.name;
    });

    const variableDefs = candidates
        .map((_, index) => `$owner${index}: String!, $name${index}: String!`)
        .join(", ");

    const query = `query($authorId: ID!, $since: GitTimestamp!, $until: GitTimestamp!, ${variableDefs}) {
        ${fragments.join("\n")}
    }`;

    try {
        const response = await graphql<Record<string, unknown>>(query, token, variables);
        const dates: string[] = [];

        for (let i = 0; i < candidates.length; i++) {
            const repoData = response[`repo${i}`] as Record<string, unknown> | undefined;
            const defaultBranchRef = repoData?.defaultBranchRef as Record<string, unknown> | undefined;
            const target = defaultBranchRef?.target as Record<string, unknown> | undefined;
            const history = target?.history as Record<string, unknown> | undefined;
            const historyNodes = (history?.nodes as Array<Record<string, unknown>> | undefined) || [];
            for (const node of historyNodes) {
                const author = node?.author as Record<string, unknown> | undefined;
                if (typeof author?.date === 'string') {
                    dates.push(author.date);
                }
            }
        }

        return dates;
    } catch (error) {
        // Fallback to empty array on failure, matching original behavior somewhat
        logger.error("Failed to fetch commit dates via GraphQL:", error);
        return [];
    }
}

function buildYearInReviewData(
    year: number,
    collection: NonNullable<YearInReviewResponse["user"]>["contributionsCollection"],
    commitDates: string[]
) {
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

export async function fetchYearInReviewData(username: string, year: number, token?: string) {
    if (!token) {
        throw new GitHubApiError("Year in Review requires authentication token", 401);
    }

    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    try {
        const response = await graphql<YearInReviewResponse>(YEAR_IN_REVIEW_QUERY, token, {
            login: username,
            from: from.toISOString(),
            to: to.toISOString(),
            maxRepositories: 10,
        });

        if (!response.user) {
            throw new UserNotFoundError(username);
        }

        const collection = response.user.contributionsCollection;

        const commitDatesPromise = fetchCommitDatesForTopRepos(
            response.user.id,
            token,
            from.toISOString(),
            to.toISOString(),
            collection.commitContributionsByRepository
        );

        const commitDates = await commitDatesPromise;

        return buildYearInReviewData(year, collection, commitDates);
    } catch (error) {
        if (error instanceof UserNotFoundError || error instanceof RateLimitError || error instanceof GitHubApiError) {
            throw error;
        }
        throw new GitHubApiError(error instanceof Error ? error.message : "Failed to fetch year in review data", 500);
    }
}

export async function fetchCommitActivityHeatmap(username: string, year: number, token?: string): Promise<number[][]> {
    if (!token) {
        throw new GitHubApiError("Commit activity requires authentication token", 401);
    }

    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    const reposResponse = await graphql<YearInReviewResponse>(YEAR_IN_REVIEW_QUERY, token, {
        login: username,
        from: from.toISOString(),
        to: to.toISOString(),
        maxRepositories: 10,
    });

    if (!reposResponse.user) {
        throw new UserNotFoundError(username);
    }

    const topRepository = mergeTopRepository(reposResponse.user.contributionsCollection);

    if (!topRepository) {
        return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    }

    const [owner, repo] = topRepository.name.split("/");
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
