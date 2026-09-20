import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse, getAuthAndYear } from "@/lib/apiUtils";
import { fetchCommitActivityHeatmap } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    try {
        const { errorResponse, user, year } = await getAuthAndYear(request);
        if (errorResponse) {
            return errorResponse;
        }

        const heatmap = await fetchCommitActivityHeatmap(user!.username, year!, user!.token);
        return NextResponse.json({ year, heatmap });
    } catch (error) {
        return handleErrorResponse(error);
    }
}
