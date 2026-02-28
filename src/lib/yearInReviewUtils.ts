export function buildHourlyHeatmapFromCommitDates(commitDates: string[]): number[][] {
  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const dateString of commitDates) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const day = date.getUTCDay();
    const hour = date.getUTCHours();
    heatmap[day][hour] += 1;
  }
  return heatmap;
}

export function getMostActiveHour(heatmap: number[][]): number {
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
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
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
