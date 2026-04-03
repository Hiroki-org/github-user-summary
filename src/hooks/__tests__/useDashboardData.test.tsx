// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData, useYearInReview, useDashboardStats, fetcher } from "../useDashboardData";
import { useSession } from "next-auth/react";
import { SWRConfig } from "swr";
import React from "react";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mocking fetch for the fetcher tests
const originalFetch = global.fetch;

type MockSessionReturn = ReturnType<typeof useSession>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
     {children}
  </SWRConfig>
);

describe("useDashboardData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("handles loading state", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "loading",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.session).toBeNull();
        expect(result.current.status).toBe("loading");
    });

    it("handles unauthenticated state", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "unauthenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.session).toBeNull();
        expect(result.current.status).toBe("unauthenticated");
    });

    it("handles authenticated state but without token", () => {
        vi.mocked(useSession).mockReturnValue({
            data: { user: { name: "test" }, expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        expect(result.current.isLoading).toBe(false);
    });

    it("fetches data when authenticated with token", async () => {
        const mockSession = {
            data: { accessToken: "token123", user: { name: "test" }, expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated" as const,
            update: vi.fn(),
        };
        vi.mocked(useSession).mockReturnValue(mockSession satisfies MockSessionReturn as unknown as MockSessionReturn);

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                username: "testuser",
                summary: { totalCommits: 100 }
            }),
        });

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        await waitFor(() => {
            expect(result.current.username).toBe("testuser");
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.summary).toEqual({ totalCommits: 100 });
        expect(result.current.error).toBeUndefined();
        expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/summary");
    });

    it("handles SWR error", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Server Error",
        });

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        await waitFor(() => {
            expect(result.current.error).toBeDefined();
        });

        expect(result.current.error.message).toBe("Server Error");
    });
});

describe("useYearInReview", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
    });

    it("handles unauthenticated state", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "unauthenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useYearInReview(2023), { wrapper });

        expect(result.current.isLoading).toBe(false);
    });

    it("handles authenticated state but null year", () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useYearInReview(null), { wrapper });

        expect(result.current.isLoading).toBe(false);
    });

    it("fetches data when authenticated with token and valid year", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ totalContributions: 100 }),
        });

        const { result } = renderHook(() => useYearInReview(2023), { wrapper });

        await waitFor(() => {
            expect(result.current.data).toEqual({ totalContributions: 100 });
        });

        expect(result.current.isLoading).toBe(false);
        expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/year?year=2023");
    });
});

describe("useDashboardStats", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
    });

    it("handles unauthenticated state", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "unauthenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useDashboardStats(2023), { wrapper });

        expect(result.current.isLoading).toBe(false);
    });

    it("handles authenticated state but null year", () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        const { result } = renderHook(() => useDashboardStats(null), { wrapper });

        expect(result.current.isLoading).toBe(false);
    });

    it("fetches data when authenticated with token and valid year", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ year: 2023, heatmap: [[1, 2]] }),
        });

        const { result } = renderHook(() => useDashboardStats(2023), { wrapper });

        await waitFor(() => {
            expect(result.current.year).toBe(2023);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.heatmap).toEqual([[1, 2]]);
        expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/stats?year=2023");
    });
});

describe("fetcher error edge cases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("handles fetch error without text body", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => { throw new Error("Cannot read body"); },
        });

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        await waitFor(() => {
            expect(result.current.error).toBeDefined();
        });

        expect(result.current.error.message).toBe("Unknown error");
    });

    it("handles fetch error with empty text body and uses status", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 502,
            text: async () => "",
        });

        const { result } = renderHook(() => useDashboardData(), { wrapper });

        await waitFor(() => {
            expect(result.current.error).toBeDefined();
        });

        expect(result.current.error.message).toBe("Request failed (502)");
    });
});


describe("fetcher", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("throws an error with the response text when not ok", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            text: async () => "Not Found",
        });

        await expect(fetcher("/api/test")).rejects.toThrow("Not Found");
    });
});
