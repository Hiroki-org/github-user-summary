/**
 * Builds a 7x24 hourly heatmap (7 days x 24 hours) from an array of commit date strings.
 *
 * @param commitDates Array of ISO 8601 date strings.
 * @returns A 2D array representing the heatmap [day][hour].
 */
export function buildHourlyHeatmapFromCommitDates(commitDates: string[]): number[][] {
    const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    // Performance Optimization: Cache weekday calculations to avoid expensive Date parsing in the loop
    const dayCache = new Map<string, number>();

    for (const dateString of commitDates) {
        // Non-standard date string: fall back to full Date parsing
        if (dateString.length < 19 || dateString[10] !== "T") {
            parseFallbackDate(dateString, heatmap);
            continue;
        }

        const datePart = dateString.slice(0, 10);

        // Check cache for day
        let day = dayCache.get(datePart);

        // If missing, compute via Date parsing (but cached per day)
        if (day === undefined) {
            const date = new Date(datePart + "T00:00:00Z");
            if (Number.isNaN(date.getTime())) {
                parseFallbackDate(dateString, heatmap);
                continue;
            }
            day = date.getUTCDay();
            dayCache.set(datePart, day);
        }

        // Fast path for standard ISO 8601 strings (e.g., "2023-01-01T10:00:00Z")
        const h1 = dateString.charCodeAt(11) - 48;
        const h2 = dateString.charCodeAt(12) - 48;

        if (h1 < 0 || h1 > 9 || h2 < 0 || h2 > 9) {
            parseFallbackDate(dateString, heatmap);
            continue;
        }

        const hour = h1 * 10 + h2;

        // Ensure hour is within valid range and handle potential timezone offsets
        if (hour < 0 || hour > 23 || !dateString.endsWith("Z")) {
            parseFallbackDate(dateString, heatmap);
            continue;
        }

        heatmap[day][hour] += 1;
    }
    return heatmap;
}

function parseFallbackDate(dateString: string, heatmap: number[][]): void {
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) {
        heatmap[date.getUTCDay()][date.getUTCHours()] += 1;
    }
}

/**
 * Returns the most active hour from the heatmap (the hour with the highest total commits across all days).
 *
 * @param heatmap The 7x24 heatmap array.
 * @returns The hour (0-23).
 */
export function getMostActiveHour(heatmap: number[][]): number {
    const isValidHeatmap =
        Array.isArray(heatmap) &&
        heatmap.length === 7 &&
        heatmap.every((row) => Array.isArray(row) && row.length === 24 && row.every((count) => Number.isFinite(count)));

    if (!isValidHeatmap) {
        return 0;
    }
    let maxCount = -1;
    let mostActiveHour = 0;
    for (let hour = 0; hour < 24; hour += 1) {
        let total = 0;
        for (let day = 0; day < 7; day += 1) {
            total += heatmap[day][hour];
        }
        if (total > maxCount) {
            maxCount = total;
            mostActiveHour = hour;
        }
    }
    return mostActiveHour;
}


// Constants for Sakamoto's algorithm to calculate the day of the week
const SAKAMOTO_T = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

/**
 * Calculates the day of the week using Sakamoto's algorithm.
 * @param year The full year.
 * @param month The month (1-12).
 * @param dateNum The day of the month.
 * @returns 0 for Sunday, 1 for Monday, etc.
 */
function getDaySakamoto(year: number, month: number, dateNum: number): number {
    const y = year - (month < 3 ? 1 : 0);
    const val = y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + SAKAMOTO_T[month - 1] + dateNum;
    return ((val % 7) + 7) % 7;
}

/**
 * Returns the most active day of the week from the contribution calendar data.

 *
 * @param calendar Array of objects containing date and contribution count.
 * @returns The name of the most active day (e.g., "Monday").
 */
export function getMostActiveDayFromCalendar(calendar: { date: string; count: number }[]): string {
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const totals = Array.from({ length: 7 }, () => 0);

    for (const day of calendar) {
        if (day.count <= 0) {
            continue;
        }

        const dateStr = day.date;

        // Fast path for standard ISO 8601 dates (YYYY-MM-DD)
        if (dateStr.length === 10 && dateStr[4] === "-" && dateStr[7] === "-") {
            const y1 = dateStr.charCodeAt(0) - 48;
            const y2 = dateStr.charCodeAt(1) - 48;
            const y3 = dateStr.charCodeAt(2) - 48;
            const y4 = dateStr.charCodeAt(3) - 48;
            const m1 = dateStr.charCodeAt(5) - 48;
            const m2 = dateStr.charCodeAt(6) - 48;
            const d1 = dateStr.charCodeAt(8) - 48;
            const d2 = dateStr.charCodeAt(9) - 48;

            if (
                y1 >= 0 && y1 <= 9 && y2 >= 0 && y2 <= 9 && y3 >= 0 && y3 <= 9 && y4 >= 0 && y4 <= 9 &&
                m1 >= 0 && m1 <= 9 && m2 >= 0 && m2 <= 9 && d1 >= 0 && d1 <= 9 && d2 >= 0 && d2 <= 9
            ) {
                const year = y1 * 1000 + y2 * 100 + y3 * 10 + y4;
                const month = m1 * 10 + m2;
                const dateNum = d1 * 10 + d2;

                const weekday = getDaySakamoto(year, month, dateNum);
                totals[weekday] += day.count;
                continue;
            }
        }

        // Fallback for non-standard dates
        const parsedDate = new Date(`${dateStr}T00:00:00Z`);
        if (!Number.isNaN(parsedDate.getTime())) {
            totals[parsedDate.getUTCDay()] += day.count;
        }
    }

    let maxDay = 0;
    for (let i = 1; i < totals.length; i += 1) {
        if (totals[i] > totals[maxDay]) {
            maxDay = i;
        }
    }

    return weekdayNames[maxDay];
}
