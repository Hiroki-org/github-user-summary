import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse } from "@/lib/apiUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchViewerLogin } from "@/lib/githubViewer";

import { fetchYearInReviewData } from "@/lib/githubYearInReview";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const token = session?.accessToken;

        if (!session || !token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const username = session.user?.login ?? (await fetchViewerLogin(token));
        const user = { username, token };

        const yearParam = request.nextUrl.searchParams.get("year");
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
