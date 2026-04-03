import "server-only";
import type { UserProfile, PinnedRepo } from "@/lib/types";
import { restGet, graphql } from "./api";

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
