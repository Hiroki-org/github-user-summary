import "server-only";
import type { ContributionData } from "@/lib/types";
import { GitHubApiError, UserNotFoundError } from "@/lib/types";
import { graphql } from "./api";

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
