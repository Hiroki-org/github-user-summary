import "server-only";
import { logger } from "@/lib/logger";
import type { ActivityData } from "@/lib/types";
import { UserNotFoundError, RateLimitError } from "@/lib/types";
import { restGet } from "./api";

type GitHubEvent = {
  type: string;
  created_at: string;
};

/**
 * Task⑦: アクティビティヒートマップ・イベント内訳を取得
 * REST /users/:username/events/public (最大3ページ)
 * 曜日×時間帯の7×24ヒートマップ + イベント種別集計
 * @throws {UserNotFoundError} ユーザーが見つからない場合
 * @throws {RateLimitError} APIレート制限に達した場合
 */
export async function fetchActivity(
  username: string,
  token?: string
): Promise<ActivityData> {
  const pages = [1, 2, 3];
  const allEvents: GitHubEvent[] = [];

  const promises = pages.map((page) =>
    restGet<GitHubEvent[]>(
      `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
      token
    )
  );

  // Suppress unhandled promise rejections for subsequent pages if we break early or throw
  promises.forEach((p) => p.catch((e) => logger.error("Event fetch promise rejected:", e)));

  for (const p of promises) {
    try {
      const events = await p;
      allEvents.push(...events);
      if (events.length < 100) break;
    } catch (error) {
      if (
        error instanceof UserNotFoundError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }
      break;
    }
  }

  // 曜日×時間帯ヒートマップ (7×24)
  const heatmap: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  const eventCountMap = new Map<string, number>();
  const dayCache = new Map<string, number>();

  for (const event of allEvents) {
    const createdAt = event.created_at;
    const datePart = createdAt.slice(0, 10);

    let day = dayCache.get(datePart);
    if (day === undefined) {
      day = new Date(datePart).getUTCDay(); // 0=Sun, 6=Sat
      dayCache.set(datePart, day);
    }

    // Fast hour extraction from YYYY-MM-DDTHH:MM:SSZ
    const charCodeZero = '0'.charCodeAt(0);
    const hour = (createdAt.charCodeAt(11) - charCodeZero) * 10 + (createdAt.charCodeAt(12) - charCodeZero);
    heatmap[day][hour]++;

    eventCountMap.set(event.type, (eventCountMap.get(event.type) ?? 0) + 1);
  }

  const eventBreakdown = Array.from(eventCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  return {
    heatmap,
    eventBreakdown,
    totalEvents: allEvents.length,
  };
}
