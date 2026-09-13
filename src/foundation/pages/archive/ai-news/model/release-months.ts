import { dateTimestamp, daysBetween, shiftMonth } from "./release-calendar";

export function monthsBetween(from: string, to: string): number {
  return (
    (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
    Number(to.slice(5, 7)) -
    Number(from.slice(5, 7))
  );
}

/** 日曜始まりの6週。隣の月の日付は重複して表示しない。 */
export function getMonthDays(month: string): (string | null)[] {
  const start = `${month}-01`;
  const weekday = new Date(dateTimestamp(start)).getUTCDay();
  const days = daysBetween(start, `${shiftMonth(month, 1)}-01`);
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - weekday + 1;
    return day > 0 && day <= days ? `${month}-${String(day).padStart(2, "0")}` : null;
  });
}

export function dateInMonth(date: string, month: string): string {
  const lastDay = daysBetween(`${month}-01`, `${shiftMonth(month, 1)}-01`);
  return `${month}-${String(Math.min(Number(date.slice(-2)), lastDay)).padStart(2, "0")}`;
}

/** 表示中の月と前後の月だけを描画し、長期間でもDOMの大きさを一定に保つ。 */
export function getMonthWindow(
  start: string,
  end: string,
  scrollLeft: number,
  viewportWidth: number,
  monthStep: number,
) {
  const total = monthsBetween(start, end) + 1;
  const first = Math.max(0, Math.floor(scrollLeft / monthStep) - 1);
  const count = Math.max(0, Math.min(total - first, Math.ceil(viewportWidth / monthStep) + 3));
  return {
    first,
    total,
    months: Array.from({ length: count }, (_, index) => shiftMonth(start, first + index)),
  };
}
