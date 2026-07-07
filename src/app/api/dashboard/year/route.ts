import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse, getAuthenticatedUser } from "@/lib/apiUtils";
import { fetchYearInReviewData } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const yearParam = request.nextUrl.searchParams.get("year");

        if (yearParam !== null && !/^\d{4}$/.test(yearParam)) {
            return NextResponse.json({ error: "Invalid year" }, { status: 400 });
        }

        const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getUTCFullYear();

        if (!Number.isFinite(year) || year < 2008 || year > new Date().getUTCFullYear()) {
            return NextResponse.json({ error: "Invalid year" }, { status: 400 });
        }

        const data = await fetchYearInReviewData(user.username, year, user.token);
        return NextResponse.json(data);
    } catch (error) {
        return handleErrorResponse(error);
    }
}
