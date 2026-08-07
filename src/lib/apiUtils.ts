import { NextRequest, NextResponse } from "next/server";
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


export async function getAuthAndYear(request: NextRequest): Promise<
    | { errorResponse: NextResponse; user?: undefined; year?: undefined }
    | { errorResponse?: undefined; user: { username: string; token: string }; year: number }
> {
    const user = await getAuthenticatedUser();
    if (!user) {
        return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const yearParam = request.nextUrl.searchParams.get("year");

    if (yearParam !== null && !/^\d{4}$/.test(yearParam)) {
        return { errorResponse: NextResponse.json({ error: "Invalid year" }, { status: 400 }) };
    }

    const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getUTCFullYear();

    if (!Number.isFinite(year) || year < 2008 || year > new Date().getUTCFullYear()) {
        return { errorResponse: NextResponse.json({ error: "Invalid year" }, { status: 400 }) };
    }

    return { user, year };
}
