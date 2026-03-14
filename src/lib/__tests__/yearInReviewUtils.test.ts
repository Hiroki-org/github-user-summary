import { describe, it, expect } from "vitest";
import {
    buildHourlyHeatmapFromCommitDates,
    getMostActiveHour,
    getMostActiveDayFromCalendar
} from "../yearInReviewUtils";

describe("buildHourlyHeatmapFromCommitDates", () => {
    it("returns a 7x24 heatmap initialized with zeros for an empty array", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates([]);
        const expected = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        expect(heatmap).toEqual(expected);
    });

    it("correctly counts commit dates based on UTC day and hour", () => {
        const commitDates = [
            "2023-01-01T10:00:00Z", // Sunday (0), Hour 10
            "2023-01-01T10:30:00Z", // Sunday (0), Hour 10
            "2023-01-02T15:45:00Z", // Monday (1), Hour 15
            "2023-01-07T23:59:59Z", // Saturday (6), Hour 23
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);
        const expected = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        expected[0][10] = 2;
        expected[1][15] = 1;
        expected[6][23] = 1;

        expect(heatmap).toEqual(expected);
    });

    it("ignores invalid date strings", () => {
        const commitDates = [
            "2023-01-01T10:00:00Z",
            "invalid-date",
            "not-a-date"
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);
        const expected = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        expected[0][10] = 1;

        expect(heatmap).toEqual(expected);
    });
});

describe("getMostActiveHour", () => {
    it("returns 0 for an empty heatmap (all zeros)", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        expect(getMostActiveHour(heatmap)).toBe(0);
    });

    it("returns the hour with the most commits across all days", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[0][10] = 5; // Sunday hour 10: 5 commits
        heatmap[1][10] = 3; // Monday hour 10: 3 commits -> Total 8

        heatmap[2][15] = 4; // Tuesday hour 15: 4 commits
        heatmap[3][15] = 5; // Wednesday hour 15: 5 commits -> Total 9

        expect(getMostActiveHour(heatmap)).toBe(15);
    });

    it("returns the first encountered hour in case of a tie", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[0][5] = 10; // Total 10 for hour 5
        heatmap[0][12] = 10; // Total 10 for hour 12
        heatmap[0][20] = 10; // Total 10 for hour 20

        // Hour 5 is encountered first in the 0..23 loop
        expect(getMostActiveHour(heatmap)).toBe(5);
    });
});

describe("getMostActiveDayFromCalendar", () => {
    it("returns 'Sunday' when the calendar is empty", () => {
        expect(getMostActiveDayFromCalendar([])).toBe("Sunday");
    });

    it("correctly identifies the most active day of the week", () => {
        const calendar = [
            { date: "2023-01-01", count: 5 }, // Sunday
            { date: "2023-01-02", count: 10 }, // Monday
            { date: "2023-01-08", count: 3 },  // Sunday -> Sunday total: 8, Monday total: 10
            { date: "2023-01-04", count: 2 },  // Wednesday -> Wednesday total: 2
        ];
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Monday");
    });

    it("ignores days with zero or negative counts", () => {
        const calendar = [
            { date: "2023-01-01", count: 0 }, // Sunday
            { date: "2023-01-02", count: -5 }, // Monday
            { date: "2023-01-03", count: 2 }, // Tuesday
        ];
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Tuesday");
    });

    it("returns the first encountered day in case of a tie", () => {
        const calendar = [
            { date: "2023-01-02", count: 10 }, // Monday (index 1)
            { date: "2023-01-04", count: 10 }, // Wednesday (index 3)
        ];
        // "Monday" should be returned since it appears earlier in the [Sunday, Monday, ...] array
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Monday");
    });
});
