import { describe, expect, it } from "vite-plus/test";
import {
  dateInMonth,
  getMonthDays,
  getMonthWindow,
  monthsBetween,
} from "./release-months";

describe("monthly calendars", () => {
  it("aligns dates to weekdays in six rows, including leap days and months needing six weeks", () => {
    const february = getMonthDays("2024-02");
    expect(february).toHaveLength(42);
    expect(february.slice(0, 4)).toStrictEqual([null, null, null, null]);
    expect(february[4]).toBe("2024-02-01");
    expect(february[32]).toBe("2024-02-29");
    expect(february.filter(Boolean)).toHaveLength(29);
    expect(getMonthDays("2025-02").filter(Boolean)).toHaveLength(28);
    expect(getMonthDays("2026-03")[0]).toBe("2026-03-01");
    expect(getMonthDays("2026-05")[35]).toBe("2026-05-31");
    expect(getMonthDays("2025-12")).not.toContain("2026-01-01");
  });

  it("preserves the day where possible when navigating between months", () => {
    expect(monthsBetween("2025-12", "2026-01")).toBe(1);
    expect(monthsBetween("2026-01", "2025-12")).toBe(-1);
    expect(dateInMonth("2024-01-31", "2024-02")).toBe("2024-02-29");
    expect(dateInMonth("2025-01-31", "2025-02")).toBe("2025-02-28");
    expect(dateInMonth("2026-12-15", "2027-01")).toBe("2027-01-15");
  });

  it("renders a bounded window of months while keeping adjacent months available", () => {
    const start = "2019-01";
    const step = 680;
    const window = getMonthWindow(
      start,
      "2030-12",
      monthsBetween(start, "2026-09") * step,
      1400,
      step
    );
    expect(window.total).toBe(144);
    expect(window.months.length).toBeLessThanOrEqual(6);
    expect(window.months.slice(0, 4)).toStrictEqual([
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    expect(getMonthWindow(start, "2030-12", 0, 320, step).months[0]).toBe(
      start
    );
    expect(
      getMonthWindow(
        start,
        "2030-12",
        monthsBetween(start, "2030-12") * step,
        1400,
        step
      ).months.at(-1)
    ).toBe("2030-12");
  });
});
