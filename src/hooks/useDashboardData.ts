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

export function useDashboardData() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const canFetch = status === "authenticated" && Boolean(token);

    const summary = useSWR<DashboardSummaryResponse>(canFetch ? "/api/dashboard/summary" : null, fetcher);

    return {
        session,
        status,
        username: summary.data?.username,
        summary: summary.data?.summary,
        isLoading: status === "loading" || summary.isLoading,
        error: summary.error,
        mutate: summary.mutate,
    };
}

export function useYearInReview(year: number | null) {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const canFetch = status === "authenticated" && Boolean(token) && Number.isFinite(year);

    const query = canFetch ? `/api/dashboard/year?year=${year}` : null;
    const swr = useSWR<YearInReviewData>(query, fetcher);

    return {
        data: swr.data,
        isLoading: status === "loading" || swr.isLoading,
        error: swr.error,
        mutate: swr.mutate,
    };
}

export function useDashboardStats(year: number | null) {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const canFetch = status === "authenticated" && Boolean(token) && Number.isFinite(year);

    const query = canFetch ? `/api/dashboard/stats?year=${year}` : null;
    const swr = useSWR<DashboardStatsResponse>(query, fetcher);

    return {
        year: swr.data?.year,
        heatmap: swr.data?.heatmap,
        isLoading: status === "loading" || swr.isLoading,
        error: swr.error,
        mutate: swr.mutate,
    };
}
