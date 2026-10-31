import type { ScoreType } from "./schema";

export function formatScore(value: number, type: ScoreType): string {
  const suffix = { percentage: "%", elo: " Elo", "net-score": "" }[type];
  return `${value.toFixed(2)}${suffix}`;
}

export function createScoreScale(scores: number[], type: ScoreType) {
  let minimum = type === "net-score" ? -100 : 0;
  let maximum = 100;
  let step = type === "net-score" ? 50 : 25;
  if (type === "elo" && scores.length > 0) {
    const lowest = Math.min(...scores);
    const highest = Math.max(...scores);
    step = Math.max(100, Math.round((highest - lowest) / 400) * 100);
    minimum = Math.floor(lowest / step) * step;
    maximum = Math.max(minimum + step, Math.ceil(highest / step) * step);
  }
  return {
    ticks: Array.from(
      { length: Math.round((maximum - minimum) / step) + 1 },
      (_, index) => minimum + index * step
    ),
    position: (score: number) => (score - minimum) / (maximum - minimum),
  };
}
