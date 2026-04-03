import "server-only";
import type { UserSummary } from "@/lib/types";
import { UserNotFoundError } from "@/lib/types";
import { fetchUserProfile } from "./profile";
import { fetchRepositories } from "./repositories";
import { fetchContributions } from "./contributions";
import { fetchActivity } from "./activity";
import { fetchStarredRepos } from "./starred";
import { processResult } from "./utils";

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
