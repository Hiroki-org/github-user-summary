import { NextResponse } from "next/server";
import { RateLimitError } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export function handleErrorResponse(error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
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

export function getClientIp(request: Request): string {
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return "unknown";
}
