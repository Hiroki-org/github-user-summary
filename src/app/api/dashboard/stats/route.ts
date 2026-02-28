import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { fetchViewerLogin } from "@/lib/githubViewer";
import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const token = session?.accessToken;

    if (!session || !token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const yearParam = request.nextUrl.searchParams.get("year");
    const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getUTCFullYear();

    if (!Number.isFinite(year) || year < 2008 || year > new Date().getUTCFullYear()) {
        return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    try {
        const username = session.user?.login ?? (await fetchViewerLogin(token));
        const heatmap = await fetchCommitActivityHeatmap(username, year, token);
        return NextResponse.json({ year, heatmap });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
