/**
 * Calculate dynamic Tailwind class for topic sizing based on frequency
 * @param count - Current topic count
 * @param maxCount - Maximum count among all topics
 * @returns Tailwind CSS class string for text sizing
 */
export function getTopicSizeClass(count: number, maxCount: number): string {
  if (maxCount <= 0) {
    return "text-xs";
  }

  const ratio = count / maxCount;
  if (ratio >= 0.8) {
    return "text-base font-semibold";
  }
  if (ratio >= 0.5) {
    return "text-sm font-medium";
  }
  return "text-xs";
}
