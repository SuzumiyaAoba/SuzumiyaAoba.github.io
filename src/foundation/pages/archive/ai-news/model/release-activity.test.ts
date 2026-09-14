import { describe, expect, it } from "vite-plus/test";
import { buildReleases } from "./release-calendar";
import type { RenderedRelease } from "./release-calendar";
import { getReleaseActivity, localDate, shiftDate } from "./release-activity";

function release(title: string, date?: string): RenderedRelease {
  return {
    title,
    summary: "",
    entry: {
      year: 2026,
      ...(date ? { date } : {}),
      title: { ja: title },
      summary: { ja: "" },
      tags: ["OpenAI", "LLM Model"],
      series: ["GPT"],
    },
  };
}

describe("local dates", () => {
  it("uses the viewer's local date and moves across month, year and leap-day boundaries", () => {
    expect(localDate(new Date(2026, 8, 13, 0, 1))).toBe("2026-09-13");
    expect(shiftDate("2024-02-28", 1)).toBe("2024-02-29");
    expect(shiftDate("2024-02-29", 1)).toBe("2024-03-01");
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDate("2024-03-09", 2)).toBe("2024-03-11");
  });
});

describe("release activity", () => {
  it("counts today and the preceding 29 days without treating future releases as past activity", () => {
    const today = "2026-03-06";
    const releases = buildReleases([
      release("Today", today),
      release("Recent boundary", shiftDate(today, -29)),
      release("Previous boundary", shiftDate(today, -30)),
      release("Old boundary", shiftDate(today, -59)),
      release("Too old", shiftDate(today, -60)),
      release("Future", shiftDate(today, 1)),
      release("Unknown"),
    ]);
    const activity = getReleaseActivity(releases, today);
    expect(activity.recent.map((item) => item.title)).toStrictEqual(["Today", "Recent boundary"]);
    expect(activity.change).toBe(0);
    expect(activity.latest?.title).toBe("Today");
    expect(getReleaseActivity([], today)).toStrictEqual({
      recent: [],
      change: 0,
      latest: undefined,
    });
  });
});
