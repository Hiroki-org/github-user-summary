import { describe, it, expect } from "vitest";
import {
    buildHourlyHeatmapFromCommitDates,
    getMostActiveHour,
    getMostActiveDayFromCalendar,
    getWeekdayFromDateString
} from "@/lib/yearInReviewUtils";

describe("buildHourlyHeatmapFromCommitDates", () => {
    it("returns a 7x24 heatmap initialized with zeros for an empty array", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates([]);
        expect(heatmap).toHaveLength(7);
        heatmap.forEach(day => {
            expect(day).toHaveLength(24);
            expect(day.every(count => count === 0)).toBe(true);
        });
    });

    it("correctly counts commit dates based on UTC day and hour", () => {
        const commitDates = [
            "2023-01-01T10:00:00Z", // Sunday (0), Hour 10
            "2023-01-01T10:30:00Z", // Sunday (0), Hour 10
            "2023-01-02T15:45:00Z", // Monday (1), Hour 15
            "2023-01-07T23:59:59Z", // Saturday (6), Hour 23
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);

        expect(heatmap[0][10]).toBe(2);
        expect(heatmap[1][15]).toBe(1);
        expect(heatmap[6][23]).toBe(1);

        // Verify other slots are 0
        expect(heatmap[0][11]).toBe(0);
        expect(heatmap[2][15]).toBe(0);
    });

    it("ignores invalid date strings", () => {
        // Additional invalid date assertions to address regression tests mentioned
        expect(buildHourlyHeatmapFromCommitDates(["invalid-date"])).toEqual(Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0)));
        const commitDates = [
            "2023-01-01T10:00:00Z",
            "invalid-date",
            "not-a-date"
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);

        expect(heatmap[0][10]).toBe(1);
        // All other entries should be 0
        const totalCommits = heatmap.flat().reduce((sum, count) => sum + count, 0);
        expect(totalCommits).toBe(1);
    });

    it("correctly handles boundary times (midnight and 23:59:59)", () => {
        const commitDates = [
            "2023-01-01T00:00:00Z", // Sunday (0), Hour 0
            "2023-01-01T23:59:59Z", // Sunday (0), Hour 23
            "2023-01-07T00:00:00Z", // Saturday (6), Hour 0
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);
        expect(heatmap[0][0]).toBe(1);
        expect(heatmap[0][23]).toBe(1);
        expect(heatmap[6][0]).toBe(1);
        const totalCommits = heatmap.flat().reduce((sum, count) => sum + count, 0);
        expect(totalCommits).toBe(3);
    });

    it("correctly handles different timezone offsets in ISO strings", () => {
        const commitDates = [
            "2023-01-01T10:00:00+09:00", // Sunday 01:00 UTC
            "2023-01-01T10:00:00-05:00", // Sunday 15:00 UTC
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);
        expect(heatmap[0][1]).toBe(1);
        expect(heatmap[0][15]).toBe(1);
        const totalCommits = heatmap.flat().reduce((sum, count) => sum + count, 0);
        expect(totalCommits).toBe(2);
    });
});


describe("getMostActiveHour", () => {
    it("returns 0 if heatmap is malformed (not 7x24 matrix)", () => {
        expect(getMostActiveHour([])).toBe(0);
        expect(getMostActiveHour([[1,2,3]])).toBe(0);
    });

    it("returns 0 for malformed heatmaps with NaN or Infinity", () => {
        const heatmapWithNaN = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => NaN));
        expect(getMostActiveHour(heatmapWithNaN)).toBe(0);
        const heatmapWithInfinity = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => Infinity));
        expect(getMostActiveHour(heatmapWithInfinity)).toBe(0);
    });

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

    it("returns 0 when all hours have the same number of commits", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 1));
        // All totals are 7 (1 per day for 7 days), the first hour (0) should be returned
        expect(getMostActiveHour(heatmap)).toBe(0);
    });

    it("correctly identifies the most active hour even when commits are sparsely distributed", () => {
        const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        heatmap[6][23] = 1;
        heatmap[5][23] = 1; // Hour 23 has 2 commits
        heatmap[0][1] = 1;  // Hour 1 has 1 commit

        expect(getMostActiveHour(heatmap)).toBe(23);
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

    it("ignores items with invalid date strings", () => {
        const calendar = [
            { date: "invalid-date", count: 100 }, // Should be ignored
            { date: "2023-01-05", count: 2 }, // Thursday
        ];
        // The valid Thursday should win despite the large count on the invalid date
        expect(getMostActiveDayFromCalendar(calendar)).toBe("Thursday");
    });
});

describe("buildHourlyHeatmapFromCommitDates - edge cases", () => {
    it("falls back to full string parsing for unparseable hour data", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates(["2023-01-01TX0:00:00Z"]);
        const totalCommits = heatmap.flat().reduce((sum, count) => sum + count, 0);
        expect(totalCommits).toBe(0);
    });

    it("falls back to full string parsing for unparseable hour data but valid date", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates(["2023-01-01T10:00:00.1234Z"]);
        expect(heatmap[0][10]).toBe(1);
    });

    it("returns zero contributions for invalid date strings", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates(["invalid-full-date"]);
        const totalCommits = heatmap.flat().reduce((sum, count) => sum + count, 0);
        expect(totalCommits).toBe(0);
    });

    it("returns zero contributions for date strings with invalid components", () => {
        const heatmap = buildHourlyHeatmapFromCommitDates(["2023-XX-XXT10:00:00Z"]);
        const totalCommits = heatmap.flat().reduce((sum, count) => sum + count, 0);
        expect(totalCommits).toBe(0);
    });

    it("falls back to full date parsing when timezone offsets don't match fast-path ending conditions", () => {
        const commitDates = [
            "2023-01-01T10:00:00.000Z", // length 24, ends with .000Z
            "2023-01-01T10:00:00.123+02:00", // length 29
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);
        expect(heatmap[0][10]).toBe(1);
        expect(heatmap[0][8]).toBe(1); // 10:00:00+02:00 is 08:00 UTC
    });

    it("falls back to full date parsing when length is 24 but does not end with .000Z", () => {
        const commitDates = [
            "2023-01-01T10:00:00.123+", // length 24, invalid ending
        ];
        const heatmap = buildHourlyHeatmapFromCommitDates(commitDates);
        expect(heatmap[0][10]).toBe(0);
    });
});

describe("getWeekdayFromDateString", () => {
    it("returns correctly for invalid month", () => {
        expect(getWeekdayFromDateString("2023-99-01")).toBe(-1);
    });

    it("returns correctly for months > 3", () => {
        expect(getWeekdayFromDateString("2023-04-01")).toBe(6); // April 1st 2023 was a Saturday
    });

    it("falls back to Date parsing for malformed date-only strings", () => {
        expect(getWeekdayFromDateString("2023-XX-01")).toBe(-1);
    });

    it("returns -1 for invalid number components", () => {
        expect(getWeekdayFromDateString("YYYY-01-01")).toBe(-1);
    });

    it("returns correct weekday for standard YYYY-MM-DD", () => {
        expect(getWeekdayFromDateString("2023-01-01")).toBe(0); // Sunday
        expect(getWeekdayFromDateString("2023-02-28")).toBe(2); // Tuesday
        expect(getWeekdayFromDateString("2024-02-29")).toBe(4); // Thursday (leap year)
    });

    it("returns correct weekday for ISO strings with T", () => {
        expect(getWeekdayFromDateString("2023-01-01T10:00:00Z")).toBe(0);
        expect(getWeekdayFromDateString("2023-01-02T00:00:00")).toBe(1);
    });

    it("returns -1 for invalid dates", () => {
        expect(getWeekdayFromDateString("invalid")).toBe(-1);
        expect(getWeekdayFromDateString("2023-13-01")).toBe(-1); // Invalid month
        expect(getWeekdayFromDateString("2023-00-01")).toBe(-1); // Invalid month
        expect(getWeekdayFromDateString("2023-01-00")).toBe(-1); // Invalid day
        expect(getWeekdayFromDateString("2023-01-32")).toBe(-1); // Invalid day
        expect(getWeekdayFromDateString("2023-02-29")).toBe(-1); // Not a leap year
        expect(getWeekdayFromDateString("2024-02-30")).toBe(-1); // Leap year still has 29 days
    });
});
