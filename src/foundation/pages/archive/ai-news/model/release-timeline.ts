import { PROVIDERS, daysBetween, shiftMonth, type Release } from "./release-calendar";

export type ReleaseTimelineRange = {
  start: string;
  end: string;
  firstDate: string;
  lastDate: string;
  days: number;
  months: string[];
  years: number[];
};

/** 全件から範囲を決め、絞り込みや年の移動でも同じ時間軸を使う。 */
export function getReleaseTimelineRange(releases: Release[]): ReleaseTimelineRange | null {
  const dates = releases
    .flatMap((release) =>
      release.date
        ? [release.date, ...release.intervals.map((interval) => interval.previousDate)]
        : [],
    )
    .sort();
  const firstDate = dates[0];
  const lastDate = dates.at(-1);
  if (!firstDate || !lastDate) return null;

  const start = `${firstDate.slice(0, 7)}-01`;
  const end = `${shiftMonth(lastDate.slice(0, 7), 1)}-01`;
  const months: string[] = [];
  for (let month = start.slice(0, 7); `${month}-01` < end; month = shiftMonth(month, 1)) {
    months.push(`${month}-01`);
  }
  const firstYear = Number(firstDate.slice(0, 4));
  const lastYear = Number(lastDate.slice(0, 4));
  return {
    start,
    end,
    firstDate,
    lastDate,
    days: daysBetween(start, end),
    months,
    years: Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index),
  };
}

export function timelinePosition(date: string, range: ReleaseTimelineRange): number {
  return Math.max(0, Math.min(100, (daysBetween(range.start, date) / range.days) * 100));
}

/** 日付の間隔を描画幅に換算し、縮尺が変わっても点の操作領域が重ならないようにする。 */
export function buildTimelineRows(releases: Release[], pixelsPerDay: number, targetWidth = 48) {
  const groups = new Map<
    string,
    { series: string; release: Release; dates: Map<string, Release[]> }
  >();
  for (const release of releases) {
    if (!release.date) continue;
    for (const series of release.series) {
      const key = JSON.stringify([release.provider, release.kind, series]);
      const group = groups.get(key) ?? { series, release, dates: new Map<string, Release[]>() };
      const sameDay = group.dates.get(release.date) ?? [];
      sameDay.push(release);
      group.dates.set(release.date, sameDay);
      groups.set(key, group);
    }
  }

  return [...groups.values()]
    .map((group) => {
      const lanes: string[] = [];
      const points = [...group.dates.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, sameDay]) => {
          const availableLane = lanes.findIndex(
            (previous) => daysBetween(previous, date) * pixelsPerDay >= targetWidth,
          );
          const lane = availableLane < 0 ? lanes.length : availableLane;
          lanes[lane] = date;
          return { date, sameDay, lane };
        });
      return { ...group, points, laneCount: lanes.length };
    })
    .sort(
      (a, b) =>
        PROVIDERS.indexOf(a.release.provider) - PROVIDERS.indexOf(b.release.provider) ||
        b.points.at(-1)!.date.localeCompare(a.points.at(-1)!.date) ||
        a.series.localeCompare(b.series) ||
        a.release.kind.localeCompare(b.release.kind),
    );
}
