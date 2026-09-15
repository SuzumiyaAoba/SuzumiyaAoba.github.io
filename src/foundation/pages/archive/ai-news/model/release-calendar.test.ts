import { z } from "zod";
import { assert, describe, expect, it } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { AiNewsEntrySchema } from "@/shared/lib/ai-news";
import {
  buildReleases,
  daysBetween,
  filterReleases,
  formatReleaseDate,
  isExactDate,
  shiftMonth,
} from "./release-calendar";
import type { RenderedRelease } from "./release-calendar";
import {
  buildTimelineRows,
  getReleaseTimelineRange,
  timelinePosition,
} from "./release-timeline";

function release(
  title: string,
  date?: string,
  series = ["Example"],
  tags = ["OpenAI", "LLM Model"]
): RenderedRelease {
  return {
    title,
    summary: "Details",
    entry: {
      year: Number(date?.slice(0, 4) ?? 2024),
      ...(date ? { date } : {}),
      title: { ja: title },
      summary: { ja: "Details" },
      series,
      tags,
    },
  };
}

describe("release dates and calendar", () => {
  it("accepts only real complete dates, including leap days", () => {
    expect(isExactDate("2024-02-29")).toBe(true);
    for (const value of [
      undefined,
      "2024",
      "2024-02",
      "2023-02-29",
      "2024-04-31",
      "2024-13-01",
      "2024-00-10",
      "March 2024",
    ]) {
      expect(isExactDate(value)).toBe(false);
    }
  });

  it("navigates across year boundaries", () => {
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-02", -12)).toBe("2025-02");
  });

  it("calculates elapsed calendar days across leap years and daylight-saving boundaries", () => {
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(daysBetween("2024-03-09", "2024-03-11")).toBe(2);
    expect(daysBetween("2024-11-02", "2024-11-04")).toBe(2);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(formatReleaseDate("2024-03-01", "en")).toBe("March 1, 2024");
  });
});

describe("continuous release timeline", () => {
  it("includes all years and empty months between the earliest and latest records", () => {
    const range = getReleaseTimelineRange(
      buildReleases([
        release("Latest", "2026-09-10"),
        release("Unknown"),
        release("Earliest", "2019-11-05"),
      ])
    );
    assert(range);
    expect(range.start).toBe("2019-11-01");
    expect(range.end).toBe("2026-10-01");
    expect(range.firstDate).toBe("2019-11-05");
    expect(range.lastDate).toBe("2026-09-10");
    expect(range.months).toHaveLength(83);
    expect(range.months).toContain("2020-02-01");
    expect(range.years).toStrictEqual([
      2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
    ]);
    expect(getReleaseTimelineRange([])).toBeNull();
    expect(
      getReleaseTimelineRange(buildReleases([release("Unknown")]))
    ).toBeNull();
  });

  it("uses equal distances for equal elapsed days across leap days and year boundaries", () => {
    const range = getReleaseTimelineRange(
      buildReleases([
        release("First", "2023-12-31"),
        release("Last", "2025-01-01"),
      ])
    );
    assert(range);
    const distance = (from: string, to: string) =>
      timelinePosition(to, range) - timelinePosition(from, range);
    expect(distance("2023-12-31", "2024-01-01")).toBeCloseTo(
      distance("2024-02-28", "2024-02-29")
    );
    expect(distance("2024-02-28", "2024-03-01")).toBeCloseTo(
      distance("2024-12-30", "2025-01-01")
    );
    expect(timelinePosition(range.start, range)).toBe(0);
    expect(timelinePosition(range.end, range)).toBe(100);
    expect(timelinePosition("2023-12-31", range)).toBeGreaterThan(0);
  });

  it("keeps a single-release range usable and retains predecessors hidden by search", () => {
    const releases = buildReleases([
      release("First", "2023-12-31"),
      release("Last", "2026-01-02"),
    ]);
    const filtered = filterReleases(releases, {
      query: "Last",
      provider: "",
      series: "",
      kind: "",
    });
    expect(getReleaseTimelineRange(filtered)).toStrictEqual(
      getReleaseTimelineRange(releases)
    );

    const range = getReleaseTimelineRange(
      buildReleases([release("Only", "2024-02-29")])
    );
    assert(range);
    expect(range.days).toBe(29);
    expect(Number.isFinite(timelinePosition("2024-02-29", range))).toBe(true);
  });

  it("keeps points from every year in the same series and separates nearby targets at each zoom", () => {
    const releases = buildReleases([
      release("Third", "2026-01-01"),
      release("Second A", "2024-01-01"),
      release("First", "2023-12-31"),
      release("Second B", "2024-01-01"),
    ]);
    const compact = buildTimelineRows(releases, 3);
    expect(compact).toHaveLength(1);
    expect(compact[0]?.points.map((point) => point.date)).toStrictEqual([
      "2023-12-31",
      "2024-01-01",
      "2026-01-01",
    ]);
    expect(compact[0]?.points[1]?.sameDay).toHaveLength(2);
    expect(compact[0]?.points.map((point) => point.lane)).toStrictEqual([
      0, 1, 0,
    ]);
    expect(buildTimelineRows(releases, 48)[0]?.laneCount).toBe(1);
    expect(buildTimelineRows(releases, 0.01)[0]?.laneCount).toBe(3);
  });
});

describe("release intervals", () => {
  it.each([
    ["Qwen", "Alibaba"],
    ["Kimi", "Moonshot AI"],
    ["Llama", "Meta"],
    ["Grok", "xAI"],
    ["ChatGLM", "Z.ai"],
  ])(
    "recognizes the provider of %s without an explicit company tag",
    (family, provider) => {
      const [item] = buildReleases([
        release("Model", "2024-01-01", [family], [family, "LLM Model"]),
      ]);
      expect(item?.provider).toBe(provider);
    }
  );

  it("uses a derivative model's developer when its base-model family is also tagged", () => {
    const [item] = buildReleases([
      release(
        "Japanese Llama",
        "2024-06-26",
        ["ELYZA"],
        ["Llama", "ELYZA", "LLM Model"]
      ),
    ]);
    expect(item?.provider).toBe("ELYZA");
  });

  it("sorts unordered data, preserves input, and groups same-day releases", () => {
    const source = [
      release("Third", "2024-03-01"),
      release("Second A", "2024-02-29"),
      release("First", "2023-12-31"),
      release("Second B", "2024-02-29"),
    ];
    const result = buildReleases(source);
    expect(source[0]?.title).toBe("Third");
    expect(result[0]?.intervals[0]).toStrictEqual({
      series: "Example",
      previousDate: "2024-02-29",
      previousTitles: ["Second A", "Second B"],
      days: 1,
    });
    for (const second of result.filter((item) => item.date === "2024-02-29")) {
      expect(second.intervals[0]?.days).toBe(60);
    }
    expect(result.at(-1)?.intervals).toStrictEqual([]);
  });

  it("compares each series independently, including joint announcements", () => {
    const result = buildReleases([
      release("Opus", "2024-01-01", ["Opus"], ["Anthropic", "LLM Model"]),
      release("Sonnet", "2024-01-20", ["Sonnet"], ["Anthropic", "LLM Model"]),
      release(
        "Opus / Sonnet",
        "2024-02-01",
        ["Opus", "Sonnet", "Sonnet"],
        ["Anthropic", "LLM Model"]
      ),
    ]);
    expect(
      result[0]?.intervals.map(({ series, days }) => ({ series, days }))
    ).toStrictEqual([
      { series: "Opus", days: 31 },
      { series: "Sonnet", days: 12 },
    ]);
  });

  it("never compares a series across different providers or model types", () => {
    const result = buildReleases([
      release("Image", "2024-01-01", ["Example"], ["OpenAI", "Image Model"]),
      release(
        "Other provider",
        "2024-01-02",
        ["Example"],
        ["Google", "LLM Model"]
      ),
      release("Language", "2024-01-03"),
    ]);
    expect(result.every((item) => item.intervals.length === 0)).toBe(true);
  });

  it("retains undated and unclassified entries without inventing intervals", () => {
    const result = buildReleases([
      release("Unknown"),
      release("Partial", "2024-02"),
      release("Invalid", "2024-02-30"),
      release("No series", "2024-02-28", []),
    ]);
    expect(result).toHaveLength(4);
    expect(result.filter((item) => item.date === null)).toHaveLength(3);
    expect(result.every((item) => item.intervals.length === 0)).toBe(true);
  });

  it("keeps the actual predecessor when search hides it", () => {
    const result = buildReleases([
      release("Model 1", "2024-01-01"),
      release("Model 2", "2024-02-01"),
      release("Model 3", "2024-03-01"),
    ]);
    const filtered = filterReleases(result, {
      query: "ＭＯＤＥＬ ３",
      provider: "OpenAI",
      kind: "llm",
      series: "Example",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.intervals[0]?.previousTitles).toStrictEqual([
      "Model 2",
    ]);
    expect(filtered[0]?.intervals[0]?.days).toBe(29);
    expect(
      filterReleases(result, {
        query: "",
        provider: "Google",
        kind: "",
        series: "",
      })
    ).toStrictEqual([]);
  });

  it("validates the real catalog's date and series metadata", () => {
    const source = z
      .object({ events: z.array(z.unknown()) })
      .parse(parse(readFileSync("content/tools/ai-news.yaml", "utf-8")));
    expect(source.events.length).toBeGreaterThan(0);
    const keys = new Set<string>();
    const dates: string[] = [];
    for (const raw of source.events) {
      const event = AiNewsEntrySchema.parse(raw);
      expect(isExactDate(event.date), event.title_ja).toBe(true);
      expect(event.series?.length, event.title_ja).toBeGreaterThan(0);
      expect(event.year, event.title_ja).toBe(Number(event.date?.slice(0, 4)));
      expect(event.summary_ja, event.title_ja).toMatch(/\]\(https?:\/\//u);
      const key = `${event.date}:${event.title_ja}`;
      expect(keys.has(key), event.title_ja).toBe(false);
      keys.add(key);
      assert(event.date);
      dates.push(event.date);
    }
    expect(dates).toStrictEqual(dates.toSorted().toReversed());
  });

  it.each([
    ["Qwen", "Alibaba", "Qwen-7B / Qwen-7B-Chat", "2023-08-03"],
    ["Kimi", "Moonshot AI", "Moonshot-v1 (8K, 32K, 128K)", "2024-01-31"],
  ] as const)(
    "makes the %s history searchable by family and provider",
    (query, provider, first, date) => {
      const source = z
        .object({ events: z.array(z.unknown()) })
        .parse(parse(readFileSync("content/tools/ai-news.yaml", "utf-8")));
      const releases = buildReleases(
        source.events.map((raw) => {
          const event = AiNewsEntrySchema.parse(raw);
          return release(event.title_ja, event.date, event.series, event.tags);
        })
      );
      const matches = filterReleases(releases, {
        query,
        provider,
        kind: "llm",
        series: "",
      });
      expect(matches.length).toBeGreaterThan(1);
      expect(matches.every((item) => item.provider === provider)).toBe(true);
      expect(matches.at(-1)).toMatchObject({ title: first, date });
      expect(matches.some((item) => item.date?.startsWith("2026-"))).toBe(true);
    }
  );
});
