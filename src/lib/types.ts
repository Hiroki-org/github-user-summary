// ===== GitHub User Summary 共通型定義 =====

export type UserProfile = {
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
  orgs: { login: string; avatar_url: string }[];
  pinnedRepos: PinnedRepo[];
};

export type PinnedRepo = {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  primaryLanguage: { name: string; color: string } | null;
};

export type LanguageStats = {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
};

export type RepositoryData = {
  languages: LanguageStats[];
  topics: { name: string; count: number }[];
  topRepos: TopRepo[];
  totalCount: number;

};

export type TopRepo = {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
};

export type ContributionData = {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  totalContributions: number;
  longestStreak: number;
  currentStreak: number;
  mostActiveDay: string;
  calendar: { date: string; count: number }[];
};

export type InterestsData = {
  topTopics: { name: string; count: number }[];
  topLanguages: { name: string; count: number }[];
  totalStarred: number;
};

export type ActivityData = {
  heatmap: number[][]; // [dayOfWeek 0-6][hour 0-23]
  eventBreakdown: { type: string; count: number }[];
  totalEvents: number;
};

export type UserSummary = {
  profile: UserProfile | null;
  repositories: RepositoryData | null;
  contributions: ContributionData | null;
  activity: ActivityData | null;
  interests: InterestsData | null;
  errors: { section: string; message: string }[];
};

export type CardConfig = {
  showAvatar?: boolean;
  showBio?: boolean;
  showStats?: boolean;
  showTopLanguages?: boolean;
  showTopRepos?: boolean;
  swapColumns?: boolean;
  showCompany?: boolean;
  showLocation?: boolean;
  showWebsite?: boolean;
  showTwitter?: boolean;
  showJoinedDate?: boolean;
  showTopics?: boolean;
  showContributionBreakdown?: boolean;
  showStreaks?: boolean;
  showInterests?: boolean;
  showActivityBreakdown?: boolean;
};

// ===== カスタムエラー =====

export class UserNotFoundError extends Error {
  constructor(username: string) {
    super(`User "${username}" not found`);
    this.name = "UserNotFoundError";
  }
}

export class RateLimitError extends Error {
  resetAt: Date;
  constructor(resetTimestamp: number) {
    const resetDate = new Date(resetTimestamp * 1000);
    super(`GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`);
    this.name = "RateLimitError";
    this.resetAt = resetDate;
  }
}

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}
