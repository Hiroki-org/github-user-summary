import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { fetchUserSummary } from "@/lib/github";
import { fetchViewerLogin } from "@/lib/githubViewer";

export async function GET() {
    const session = await getServerSession(authOptions);
    const token = session?.accessToken;

    if (!session || !token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const username = session.user?.login ?? (await fetchViewerLogin(token));
        const summary = await fetchUserSummary(username, token);
        return NextResponse.json({ username, summary });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
