"use client";

import useSWR from "swr";
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

export const fetcher = async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text().catch(() => "Unknown error");
        throw new Error(body || `Request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
};

function useAuthenticatedFetch<T>(url: string | null) {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const canFetch = status === "authenticated" && Boolean(token) && url !== null;

    const query = canFetch ? url : null;
    const swr = useSWR<T>(query, fetcher);

    return {
        session,
        status,
        data: swr.data,
        isLoading: status === "loading" || swr.isLoading,
        error: swr.error,
        mutate: swr.mutate,
    };
}

export function useDashboardData() {
    const { session, status, data, isLoading, error, mutate } = useAuthenticatedFetch<DashboardSummaryResponse>("/api/dashboard/summary");

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
