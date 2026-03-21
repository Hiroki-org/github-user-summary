import { GitHubApiError } from "@/lib/types";

type GitHubViewerResponse = {
  login: string;
};

export async function fetchViewerLogin(token: string): Promise<string> {
<<<<<<< HEAD
  // Basic validation to prevent header injection / SSRF
  if (!/^[A-Za-z0-9_=\-\.]+$/.test(token)) {
=======
  if (!/^[A-Za-z0-9_.-]+$/.test(token)) {
>>>>>>> fix-githubviewer-token-validation-7865754078279387833
    throw new GitHubApiError("Invalid token format", 400);
  }

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "github-user-summary",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new GitHubApiError("Failed to resolve current GitHub user", res.status);
  }

  const body = (await res.json()) as GitHubViewerResponse;
  return body.login;
}
