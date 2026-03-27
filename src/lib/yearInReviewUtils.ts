export function buildHourlyHeatmapFromCommitDates(commitDates: string[]): number[][] {
    const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    // Performance Optimization: Cache weekday calculations to avoid expensive Date parsing in the loop
    const dayCache = new Map<string, number>();
    const incrementFromFullDate = (dateString: string): boolean => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return false;
        }
        heatmap[date.getUTCDay()][date.getUTCHours()] += 1;
        return true;
    };

    for (const dateString of commitDates) {
        // Fast path for standard ISO 8601 strings ending in Z or with timezone offset
        // Matches typical format like "2023-01-01T10:00:00Z"
        if (dateString.length >= 19 && dateString[10] === 'T') {
            const datePart = dateString.slice(0, 10);

            // Check cache for day
            let day = dayCache.get(datePart);

            // If missing, compute via Date parsing (but cached per day)
            if (day === undefined) {
                const date = new Date(datePart + "T00:00:00Z");
                if (Number.isNaN(date.getTime())) {
                    // Fall back to original method if something goes wrong with parsing this substring
                    incrementFromFullDate(dateString);
                    continue;
                }
                day = date.getUTCDay();
                dayCache.set(datePart, day);
            }

            // Parse hour manually
            const h1 = dateString.charCodeAt(11) - 48;
            const h2 = dateString.charCodeAt(12) - 48;

            if (h1 >= 0 && h1 <= 9 && h2 >= 0 && h2 <= 9) {
                const hour = h1 * 10 + h2;

                // If there is a timezone offset (+09:00 or -05:00) we can't just use the cached day and raw hour.
                // We can only use the fast path safely for UTC (`Z`) timestamps.
                if (hour < 24 && dateString.endsWith('Z')) {
                    heatmap[day][hour] += 1;
                    continue;
                }
            }
        }

        // Fallback for non-standard dates or dates with timezone offsets
        incrementFromFullDate(dateString);
    }
    return heatmap;
}

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
