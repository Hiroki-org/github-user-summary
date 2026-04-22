import { NextResponse } from "next/server";
import { getAuthenticatedUser, handleErrorResponse } from "@/lib/apiUtils";

import { fetchUserSummary } from "@/lib/github";

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const summary = await fetchUserSummary(user.username, user.token);
        return NextResponse.json({ username: user.username, summary });
    } catch (error) {
        return handleErrorResponse(error);
    }
}
