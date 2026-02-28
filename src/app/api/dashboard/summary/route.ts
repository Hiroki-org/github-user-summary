import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { fetchUserSummary } from "@/lib/github";
import { GitHubApiError } from "@/lib/types";

type GitHubViewerResponse = {
  login: string;
};

async function fetchViewerLogin(token: string): Promise<string> {
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

export async function GET() {
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const username = session.user?.login ?? (await fetchViewerLogin(token));
    const summary = await fetchUserSummary(username, token);
    return NextResponse.json({ username, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
