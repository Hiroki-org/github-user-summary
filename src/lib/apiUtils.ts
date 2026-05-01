import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { RateLimitError } from "@/lib/types";

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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
}

export function handleRateLimit(res: Response): never {
    const resetHeader = res.headers.get("X-RateLimit-Reset");
    const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
    throw new RateLimitError(Number.isFinite(resetTimestamp) ? resetTimestamp : Math.floor(Date.now() / 1000) + 3600);
}
