import { dateTimestamp, daysBetween } from "./release-calendar";
import type { Release } from "./release-calendar";

export function shiftDate(date: string, days: number): string {
  const result = new Date(dateTimestamp(date));
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 今日を含む30日間。将来の日付や日付未詳の記録は集計しない。 */
export function getReleaseActivity(releases: Release[], today: string) {
  const past = releases.filter(
    (release): release is Release & { date: string } =>
      release.date !== null && release.date <= today
  );
  const recent = past.filter(
    (release) => daysBetween(release.date, today) < 30
  );
  const previous = past.filter((release) => {
    const days = daysBetween(release.date, today);
    return days >= 30 && days < 60;
  });
  const [latest] = past.toSorted((a, b) => b.date.localeCompare(a.date));
  return { recent, change: recent.length - previous.length, latest };
}
