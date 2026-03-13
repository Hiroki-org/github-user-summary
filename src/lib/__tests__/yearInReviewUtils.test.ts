import { describe, it, expect } from "vitest";
import {
    buildHourlyHeatmapFromCommitDates,
    getMostActiveHour,
    getMostActiveDayFromCalendar
} from "../yearInReviewUtils";

describe("buildHourlyHeatmapFromCommitDates", () => {
    it("returns a 7x24 heatmap of zeros for an empty array", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates([]);
        expect(heatmap.length).toBe(7);
        heatmap.forEach(day => {
            expect(day.length).toBe(24);
            day.forEach(hour => expect(hour).toBe(0));
        });
    });

    it("ignores invalid date strings", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates(["invalid-date", "not-a-date"]);
        heatmap.forEach(day => {
            day.forEach(hour => expect(hour).toBe(0));
        });
    });

    it("correctly counts commit dates into the right day and hour", () => {
        // "2023-10-01T12:00:00Z" -> Sunday (0), 12th hour
        // "2023-10-02T14:30:00Z" -> Monday (1), 14th hour
        // "2023-10-02T14:45:00Z" -> Monday (1), 14th hour
        // "2023-10-07T23:59:59Z" -> Saturday (6), 23rd hour
        const commitDates = [
            "2023-10-01T12:00:00Z",
            "2023-10-02T14:30:00Z",
            "2023-10-02T14:45:00Z",
            "2023-10-07T23:59:59Z"
        ];

        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);

        expect(heatmap[0][12]).toBe(1);
        expect(heatmap[1][14]).toBe(2);
        expect(heatmap[6][23]).toBe(1);

        // Check that other arbitrary cells are 0
        expect(heatmap[0][0]).toBe(0);
        expect(heatmap[3][12]).toBe(0);
    });
});

describe("getMostActiveHour", () => {
    it("returns 0 for an all-zero heatmap", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        expect(getMostActiveHour(heatmap)).toBe(0);
    });

    it("returns the correct most active hour", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[0][10] = 5; // Sunday 10am has 5
        heatmap[1][10] = 3; // Monday 10am has 3 (Total for 10am: 8)

        heatmap[2][15] = 10; // Tuesday 3pm has 10 (Total for 3pm: 10)

        expect(getMostActiveHour(heatmap)).toBe(15);
    });

    it("returns the earliest hour in case of a tie", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[0][5] = 10; // 5am has 10
        heatmap[1][12] = 10; // 12pm has 10

        // Since `if (total > maxCount)` is used, it should keep the first one it encounters (5am)
        expect(getMostActiveHour(heatmap)).toBe(5);
    });
});

describe("getMostActiveDayFromCalendar", () => {
    it("returns 'Sunday' for an empty calendar", () => {
        expect(getMostActiveDayFromCalendar([])).toBe("Sunday");
    });

    it("ignores entries with count <= 0", () => {
        const calendar = [
            { date: "2023-10-01", count: 0 }, // Sunday
            { date: "2023-10-02", count: -5 }, // Monday
            { date: "2023-10-03", count: 1 }   // Tuesday
        ];
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Tuesday");
    });

    it("returns the most active day", () => {
        const calendar = [
            { date: "2023-10-01", count: 2 }, // Sunday
            { date: "2023-10-02", count: 10 }, // Monday
            { date: "2023-10-09", count: 5 }, // Another Monday (Total for Monday: 15)
            { date: "2023-10-06", count: 14 } // Friday (Total for Friday: 14)
        ];
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Monday");
    });

    it("returns the earliest day in the week in case of a tie", () => {
        const calendar = [
            { date: "2023-10-03", count: 10 }, // Tuesday
            { date: "2023-10-05", count: 10 }  // Thursday
        ];
        // Since `if (totals[i] > totals[maxDay])` is used, the first max day (Tuesday) should be kept.
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Tuesday");
    });
});
