import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse, getAuthenticatedUser } from "@/lib/apiUtils";
import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
