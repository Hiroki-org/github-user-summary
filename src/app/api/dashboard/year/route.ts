import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse, getAuthAndYear } from "@/lib/apiUtils";
import { fetchYearInReviewData } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    try {
        const { errorResponse, user, year } = await getAuthAndYear(request);
        if (errorResponse) {
            return errorResponse;
        }

        const data = await fetchYearInReviewData(user!.username, year!, user!.token);
        return NextResponse.json(data);
    } catch (error) {
        return handleErrorResponse(error);
    }
}
