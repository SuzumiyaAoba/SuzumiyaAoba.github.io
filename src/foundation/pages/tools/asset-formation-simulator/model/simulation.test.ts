import { describe, expect, it } from "vite-plus/test";
import { calculateSchedule, toYearlyRows } from "./simulation";
import type { ScheduleRow } from "./types";

describe("calculateSchedule", () => {
  it("毎月末に積み立て、実効年利を月利に換算する", () => {
    // 実効年利12.682503013196978%は月利1%に相当する。
    const rows = calculateSchedule(1000, 12.682503013196978, 0.25);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toStrictEqual({ month: 1, principal: 1000, gain: 0, balance: 1000 });
    expect(rows[1]?.balance).toBeCloseTo(2010, 8);
    expect(rows[2]?.balance).toBeCloseTo(3030.1, 8);
    expect(rows[2]?.principal).toBe(3000);
    expect(rows[2]?.gain).toBeCloseTo(30.1, 8);
  });

  it("利回り0%では元本と評価額が一致する", () => {
    const rows = calculateSchedule(30_000, 0, 2);

    expect(rows).toHaveLength(24);
    expect(rows.at(-1)).toStrictEqual({ month: 24, principal: 720_000, gain: 0, balance: 720_000 });
  });

  it("負の利回りも月次の複利で計算する", () => {
    // 実効年利-11.361512828387072%は月利-1%に相当する。
    const rows = calculateSchedule(1000, -11.361512828387072, 0.25);

    expect(rows[0]?.gain).toBe(0);
    expect(rows[1]?.balance).toBeCloseTo(1990, 8);
    expect(rows[2]?.balance).toBeCloseTo(2970.1, 8);
    expect(rows[2]?.gain).toBeCloseTo(-29.9, 8);
  });

  it("積立額0では運用益を発生させない", () => {
    const rows = calculateSchedule(0, 5, 1);

    expect(rows).toHaveLength(12);
    expect(rows.at(-1)).toStrictEqual({ month: 12, principal: 0, gain: 0, balance: 0 });
  });

  it.each([0, -1, 0.01])("積立月数がない期間 %s 年では空の明細を返す", (years) => {
    expect(calculateSchedule(30_000, 5, years)).toStrictEqual([]);
  });

  it("1ヶ月に満たない端数を切り捨てる", () => {
    const rows = calculateSchedule(1000, 0, 1.99);

    expect(rows).toHaveLength(23);
    expect(rows.at(-1)?.principal).toBe(23_000);
  });

  it("既定の20年・月3万円・年利5%の計算結果を維持する", () => {
    const schedule = calculateSchedule(30_000, 5, 20);
    const yearlyRows = toYearlyRows(schedule);

    expect(schedule).toHaveLength(240);
    expect(schedule.at(-1)?.principal).toBe(7_200_000);
    expect(schedule.at(-1)?.balance).toBeCloseTo(12_174_134.559534194, 6);
    expect(schedule.at(-1)?.gain).toBeCloseTo(4_974_134.559534194, 6);
    expect(yearlyRows).toHaveLength(20);
    expect(yearlyRows[0]?.gainDiff).toBeCloseTo(8177.325887918589, 6);
    expect(yearlyRows.at(-1)?.gainDiff).toBeCloseTo(570_365.7655853666, 6);
  });
});

describe("toYearlyRows", () => {
  it("年末の明細だけを抽出し、累積運用益から前年差を算出する", () => {
    const schedule: ScheduleRow[] = [
      { month: 1, principal: 1000, gain: 0, balance: 1000 },
      { month: 12, principal: 12_000, gain: 800, balance: 12_800 },
      { month: 24, principal: 24_000, gain: 2600, balance: 26_600 },
      { month: 30, principal: 30_000, gain: 3000, balance: 33_000 },
      { month: 36, principal: 36_000, gain: 2000, balance: 38_000 },
    ];

    expect(toYearlyRows(schedule)).toStrictEqual([
      { month: 12, principal: 12_000, gain: 800, balance: 12_800, gainDiff: 800 },
      { month: 24, principal: 24_000, gain: 2600, balance: 26_600, gainDiff: 1800 },
      { month: 36, principal: 36_000, gain: 2000, balance: 38_000, gainDiff: -600 },
    ]);
    expect(schedule.every((row) => !("gainDiff" in row))).toBe(true);
  });

  it("年末を含まない明細からは年次行を生成しない", () => {
    expect(toYearlyRows([])).toStrictEqual([]);
    expect(toYearlyRows(calculateSchedule(30_000, 5, 0.5))).toStrictEqual([]);
  });
});
