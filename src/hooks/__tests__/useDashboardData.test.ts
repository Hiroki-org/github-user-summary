// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardData } from "../useDashboardData";
import { useSession } from "next-auth/react";
import useSWR from "swr";

vi.mock("next-auth/react");
vi.mock("swr");

type MockSessionReturn = ReturnType<typeof useSession>;
type MockSWRReturn = ReturnType<typeof useSWR>;

describe("useDashboardData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("handles loading state", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "loading",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        } satisfies MockSWRReturn as unknown as MockSWRReturn);

        const { result } = renderHook(() => useDashboardData());

        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
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

        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        } satisfies MockSWRReturn as unknown as MockSWRReturn);

        const { result } = renderHook(() => useDashboardData());

        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
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

        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        } satisfies MockSWRReturn as unknown as MockSWRReturn);

        const { result } = renderHook(() => useDashboardData());

        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
        expect(result.current.isLoading).toBe(false);
    });

    it("fetches data when authenticated with token", () => {
        const mockMutate = vi.fn();
        const mockSession = {
            data: { accessToken: "token123", user: { name: "test" }, expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated" as const,
            update: vi.fn(),
        };
        vi.mocked(useSession).mockReturnValue(mockSession satisfies MockSessionReturn as unknown as MockSessionReturn);

        vi.mocked(useSWR).mockReturnValue({
            data: {
                username: "testuser",
                summary: { totalCommits: 100 }
            },
            error: null,
            isLoading: false,
            isValidating: false,
            mutate: mockMutate,
        } satisfies MockSWRReturn as unknown as MockSWRReturn);

        const { result } = renderHook(() => useDashboardData());

        expect(useSWR).toHaveBeenCalledWith("/api/dashboard/summary", expect.any(Function));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.username).toBe("testuser");
        expect(result.current.summary).toEqual({ totalCommits: 100 });
        expect(result.current.error).toBeNull();
        expect(result.current.mutate).toBe(mockMutate);
    });

    it("handles SWR error", () => {
        const mockError = new Error("SWR failed");
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: mockError,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        } satisfies MockSWRReturn as unknown as MockSWRReturn);

        const { result } = renderHook(() => useDashboardData());

        expect(result.current.error).toBe(mockError);
    });

    it("handles SWR loading", () => {
        vi.mocked(useSession).mockReturnValue({
            data: { accessToken: "token123", expires: "2030-01-01T00:00:00.000Z" },
            status: "authenticated",
            update: vi.fn(),
        } satisfies MockSessionReturn as unknown as MockSessionReturn);

        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true,
            isValidating: false,
            mutate: vi.fn(),
        } satisfies MockSWRReturn as unknown as MockSWRReturn);

        const { result } = renderHook(() => useDashboardData());

        expect(result.current.isLoading).toBe(true);
    });
});
