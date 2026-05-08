import { NextResponse } from "next/server";
import { handleErrorResponse } from "@/lib/apiUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { fetchUserSummary } from "@/lib/github";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const token = session?.accessToken;
        if (!session || !token || !session.user?.login) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = { username: session.user.login, token };

        const summary = await fetchUserSummary(user.username, user.token);
        return NextResponse.json({ username: user.username, summary });
    } catch (error) {
        return handleErrorResponse(error);
    }
}
