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
        const parsedDate = new Date(`${day.date}T00:00:00Z`);
        if (Number.isNaN(parsedDate.getTime())) {
            continue;
        }
        const weekday = parsedDate.getUTCDay();
        totals[weekday] += day.count;
    }

    let maxDay = 0;
    for (let i = 1; i < totals.length; i += 1) {
        if (totals[i] > totals[maxDay]) {
            maxDay = i;
        }
    }

    return weekdayNames[maxDay];
}
