import type { ScheduleRow, YearlyRow } from "./types";

export function calculateSchedule(
  monthlyContribution: number,
  annualRate: number,
  years: number
): ScheduleRow[] {
  const monthsCount = Math.max(0, Math.floor(years * 12));
  const schedule: ScheduleRow[] = [];

  if (monthsCount > 0) {
    const monthlyRate = (1 + annualRate / 100) ** (1 / 12) - 1;
    let balance = 0;
    let principal = 0;

    for (let month = 1; month <= monthsCount; month += 1) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      principal += monthlyContribution;
      const gain = balance - principal;
      schedule.push({ month, principal, gain, balance });
    }
  }

  return schedule;
}

export function toYearlyRows(schedule: ScheduleRow[]): YearlyRow[] {
  const yearlyRows = schedule.filter((row) => row.month % 12 === 0);
  return yearlyRows.map((row, index) => {
    const previous = yearlyRows[index - 1];
    const gainDiff = previous ? row.gain - previous.gain : row.gain;
    return { ...row, gainDiff };
  });
}
