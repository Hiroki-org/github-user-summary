import "server-only";
import { GitHubApiError, RateLimitError, UserNotFoundError } from "@/lib/types";

export const GITHUB_API = "https://api.github.com";
export const GITHUB_GRAPHQL = "https://api.github.com/graphql";

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
  const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
  throw new RateLimitError(resetTimestamp);
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 404) {
    throw new UserNotFoundError("unknown");
  }
  if (res.status === 403) {
    // In original code:
    // const rateLimitRemaining = res.headers.get("X-RateLimit-Remaining");
    // if (rateLimitRemaining === "0") {
    handleRateLimit(res);
    // }
  }
  if (!res.ok) {
    let message = null;
    try {
      const errorData = await res.json();
      message = errorData.message || null;
    } catch {
      // JSONのパースに失敗した場合はnullのまま
    }
    throw new GitHubApiError(message, res.status);
  }
  return res.json();
}

export async function graphql<T>(
  query: string,
  token?: string,
  variables?: Record<string, unknown>,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      ...headers(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    ...options,
  });
  const json = await handleResponse<{ data: T; errors?: { message: string }[] }>(res);
  if (json.errors && json.errors.length > 0) {
    const isRateLimit = json.errors.some((e) => e.message.includes("rate limit"));
    if (isRateLimit) {
      handleRateLimit(res);
    }
    const isNotFound = json.errors.some((e) => e.message.includes("Could not resolve to a User"));
    if (isNotFound) {
      throw new UserNotFoundError("unknown");
    }
    throw new GitHubApiError(json.errors[0].message, 500);
  }
  return json.data;
}

export async function restGet<T>(
  endpoint: string,
  token?: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: headers(token),
    ...options,
  });
  return handleResponse<T>(res);
}
