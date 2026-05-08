import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { RateLimitError, UserNotFoundError, GitHubApiError } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    const token = session?.accessToken;

    if (!session || !token) {
        return null;
    }

    const username = session.user?.login ?? (await fetchViewerLogin(token));
    return { username, token };
}

export function handleErrorResponse(error: unknown) {
    if (error instanceof RateLimitError) {
        return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error instanceof UserNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof GitHubApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Log the actual error for debugging
    logger.error("Internal Server Error:", error);

    // Return a generic message for unhandled/internal errors to avoid information disclosure
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export function handleRateLimit(res: Response): never {
    const resetHeader = res.headers.get("X-RateLimit-Reset");
    const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
    throw new RateLimitError(Number.isFinite(resetTimestamp) ? resetTimestamp : Math.floor(Date.now() / 1000) + 3600);
}
