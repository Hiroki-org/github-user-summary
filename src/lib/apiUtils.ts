import { NextResponse } from "next/server";
import { RateLimitError, UserNotFoundError, GitHubApiError } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export function handleErrorResponse(error: unknown) {
    if (error instanceof RateLimitError) {
        const headers: Record<string, string> = {};
        if (error.resetAt) {
            const retryAfter = Math.ceil((error.resetAt.getTime() - Date.now()) / 1000);
            if (retryAfter > 0) {
                headers["Retry-After"] = retryAfter.toString();
            }
        }
        return NextResponse.json({ error: error.message }, { status: 429, headers });
    }

    if (error instanceof UserNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof GitHubApiError) {
        // Validate status code range (400-599), fallback to 500 if invalid
        const status = error.status >= 400 && error.status <= 599 ? error.status : 500;
        return NextResponse.json({ error: error.message }, { status });
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

export async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    const token = session?.accessToken;
    const username = session?.user?.login;

    if (!session || !token || !username) {
        return null;
    }

    return { username, token };
}
