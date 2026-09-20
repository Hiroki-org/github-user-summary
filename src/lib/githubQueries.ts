export const CONTRIBUTIONS_COLLECTION_FRAGMENT = `
  fragment contributionsFields on ContributionsCollection {
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
`;

export type BaseContributionsCollection = {
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
