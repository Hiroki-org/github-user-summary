import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse } from "@/lib/apiUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const token = session?.accessToken;
        if (!session || !token || !session.user?.login) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = { username: session.user.login, token };

        const yearParam = request.nextUrl.searchParams.get("year");
        const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getUTCFullYear();

        if (!Number.isFinite(year) || year < 2008 || year > new Date().getUTCFullYear()) {
            return NextResponse.json({ error: "Invalid year" }, { status: 400 });
        }

        const heatmap = await fetchCommitActivityHeatmap(user.username, year, user.token);
        return NextResponse.json({ year, heatmap });
    } catch (error) {
        return handleErrorResponse(error);
    }
}
