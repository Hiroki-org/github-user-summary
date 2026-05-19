"use client";

import useSWR, { type SWRResponse } from "swr";
import { useSession } from "next-auth/react";

import type { UserSummary, YearInReviewData } from "@/lib/types";

type DashboardSummaryResponse = {
    username: string;
    summary: UserSummary;
};

type DashboardStatsResponse = {
    year: number;
    heatmap: number[][];
};

type AuthenticatedFetchResult<T> = {
    data: T | undefined;
    isLoading: boolean;
    error: SWRResponse<T>["error"];
    mutate: SWRResponse<T>["mutate"];
};

type AuthenticatedFetchWithSessionResult<T> = AuthenticatedFetchResult<T> & {
    session: ReturnType<typeof useSession>["data"];
    status: ReturnType<typeof useSession>["status"];
};

export const fetcher = async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text().catch(() => "Unknown error");
        throw new Error(body || `Request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
};

function useAuthenticatedFetch<T>(
    url: string | null,
    options: { enabled?: boolean; includeSession: true },
): AuthenticatedFetchWithSessionResult<T>;
function useAuthenticatedFetch<T>(
    url: string | null,
    options?: { enabled?: boolean; includeSession?: false },
): AuthenticatedFetchResult<T>;
function useAuthenticatedFetch<T>(
    url: string | null,
    options: { enabled?: boolean; includeSession?: boolean } = {},
) {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const canFetch = status === "authenticated" && Boolean(token) && url !== null && (options.enabled ?? true);

    const query = canFetch ? url : null;
    const swr = useSWR<T>(query, fetcher);
    const result = {
        data: swr.data,
        isLoading: status === "loading" || swr.isLoading,
        error: swr.error,
        mutate: swr.mutate,
    };

    if (options.includeSession) {
        return {
            ...result,
            session,
            status,
        };
    }

    return result;
}

export function useDashboardData() {
    const { session, status, data, isLoading, error, mutate } = useAuthenticatedFetch<DashboardSummaryResponse>(
        "/api/dashboard/summary",
        { includeSession: true },
    );

    return {
        session,
        status,
        username: data?.username,
        summary: data?.summary,
        isLoading,
        error,
        mutate,
    };
}

export function useYearInReview(year: number | null) {
    const query = Number.isFinite(year) ? `/api/dashboard/year?year=${year}` : null;
    const { data, isLoading, error, mutate } = useAuthenticatedFetch<YearInReviewData>(query);

    return {
        data,
        isLoading,
        error,
        mutate,
    };
}

export function useDashboardStats(year: number | null) {
    const query = Number.isFinite(year) ? `/api/dashboard/stats?year=${year}` : null;
    const { data, isLoading, error, mutate } = useAuthenticatedFetch<DashboardStatsResponse>(query);

    return {
        year: data?.year,
        heatmap: data?.heatmap,
        isLoading,
        error,
        mutate,
    };
}
