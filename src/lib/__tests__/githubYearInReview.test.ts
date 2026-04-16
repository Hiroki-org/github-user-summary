import { describe, expect, it } from "vitest";

import { getMostActiveDayFromCalendar, getMostActiveHour } from "@/lib/yearInReviewUtils";
import { fetchYearInReviewData } from "@/lib/githubYearInReview";
import { GitHubApiError } from "@/lib/types";

describe("githubYearInReview helpers", () => {
    it("returns the hour with the highest summed activity", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[1][10] = 2;
        heatmap[2][10] = 3;
        heatmap[4][18] = 4;

        expect(getMostActiveHour(heatmap)).toBe(10);
    });

    it("returns the most active weekday from a contribution calendar", () => {
        const calendar = [
            { date: "2025-01-06", count: 3 },
            { date: "2025-01-13", count: 2 },
            { date: "2025-01-07", count: 1 },
            { date: "2025-01-08", count: 1 },
        ];

        expect(getMostActiveDayFromCalendar(calendar)).toBe("Monday");
    });
});

describe("fetchYearInReviewData", () => {
    it("throws GitHubApiError when token is not provided", async () => {
        await expect(fetchYearInReviewData("testuser", 2024)).rejects.toThrow(GitHubApiError);

        try {
            await fetchYearInReviewData("testuser", 2024);
        } catch (error) {
            expect(error).toBeInstanceOf(GitHubApiError);
            expect((error as GitHubApiError).message).toBe("Year in Review requires authentication token");
            expect((error as GitHubApiError).status).toBe(401);
        }
    });
});
