// @vitest-environment jsdom

import { act } from "react";
import type { ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import type { CinemaMap } from "./cinema-map";
import type { ContinuousFlow } from "./continuous-flow";
import {
  CINEMA_CHAPTERS,
  CINEMA_DURATION,
  cinemaFrame,
} from "./cinema-timeline";
import { LlmAnatomyLab } from "./generation-lab";
import { DEFAULT_FLOW_IDS } from "./generation-math";

type MapProps = ComponentProps<typeof CinemaMap>;
type FlowProps = ComponentProps<typeof ContinuousFlow>;

const playback = vi.hoisted(() => ({
  elapsed: 0,
  reducedMotion: false,
  replay: vi.fn<() => void>(),
  seek: vi.fn<(time: number) => void>(),
  configuration:
    vi.fn<
      (
        paused: boolean,
        rate: number,
        duration: number,
        frameInterval: number
      ) => void
    >(),
}));

const panes = vi.hoisted(() => ({
  map: vi.fn<(props: MapProps) => void>(),
  flow: vi.fn<(props: FlowProps) => void>(),
}));

vi.mock(import("./generation-playback"), () => ({
  GENERATION_ANIMATION_DURATION: 36_000 as const,
  useGenerationPlayback: (
    _ref: unknown,
    paused: boolean,
    rate?: number,
    duration?: number,
    frameInterval?: number
  ) => {
    playback.configuration(
      paused,
      rate ?? 1,
      duration ?? 36_000,
      frameInterval ?? 50
    );
    return {
      elapsed: playback.elapsed,
      reducedMotion: playback.reducedMotion,
      replay: playback.replay,
      seek: playback.seek,
    };
  },
}));

vi.mock(import("./cinema-map"), () => ({
  CinemaMap: (props: MapProps) => {
    panes.map(props);
    return <section aria-label="全体の現在位置" />;
  },
}));

vi.mock(import("./continuous-flow"), () => ({
  ContinuousFlow: (props: FlowProps) => {
    panes.flow(props);
    return <section aria-label="全体を連続して流れる演算アニメーション" />;
  },
}));

let host: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  playback.elapsed = 0;
  playback.reducedMotion = false;
  vi.clearAllMocks();
  playback.replay.mockImplementation(() => {
    playback.elapsed = 0;
  });
  playback.seek.mockImplementation((time) => {
    playback.elapsed = time;
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host.remove();
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => root?.render(<LlmAnatomyLab />));
}

function flowProps() {
  const map = panes.map.mock.lastCall?.[0];
  const flow = panes.flow.mock.lastCall?.[0];
  if (!(map && flow)) {
    throw new Error(
      "全体構造と連続した演算アニメーションの両方が描画されていない"
    );
  }
  return { map, flow };
}

function chapterTime(id: string, fraction: number): number {
  const chapter = CINEMA_CHAPTERS.find((candidate) => candidate.id === id);
  if (!chapter) {
    throw new Error(`章${id}が見つからない`);
  }
  return chapter.start + chapter.duration * fraction;
}

function clickButton(text: string) {
  const button = [...host.querySelectorAll("button")].find(
    (candidate) => candidate.textContent === text
  );
  if (!button) {
    throw new Error(`操作ボタンが見つからない: ${text}`);
  }
  act(() => button.click());
}

function seekTime(time: number) {
  const input = host.querySelector('input[type="range"]');
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("時間軸が見つからない");
  }
  act(() => {
    if (!descriptor?.set) {
      throw new Error("時間軸の値を設定できない");
    }
    descriptor.set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("開始操作なしで171秒の自動再生を始め、全体の現在地と演算を同期して記事へ戻れる", async () => {
  await render();
  const { map, flow } = flowProps();
  const frame = cinemaFrame(flow.elapsed);
  expect(playback.configuration.mock.lastCall).toStrictEqual([
    false,
    1,
    CINEMA_DURATION,
    16,
  ]);
  expect(host.textContent).toContain("自動再生中");
  expect(flow.elapsed).toBe(0);
  expect(frame.stage).toBe("input");
  expect(map.stage).toBe(frame.stage);
  expect(map.progress).toBe(frame.progress);
  expect(flow.trace.ids).toStrictEqual(DEFAULT_FLOW_IDS);
  expect(host.querySelector("[data-llm-lab]")).not.toBeNull();
  expect(host.querySelector("[data-cinema-viewport]")).not.toBeNull();
  expect(host.querySelector("input[type=range]")?.getAttribute("max")).toBe(
    String(CINEMA_DURATION)
  );
  expect(
    host.querySelector("input[type=range]")?.getAttribute("aria-valuetext")
  ).toBe(frame.title);
  expect(host.querySelector("[data-cinema-explanation]")?.textContent).toBe(
    frame.explanation
  );
  expect(host.querySelector("a")?.getAttribute("href")).toBe(
    "/blog/post/2026-10-22-llm-anatomy/"
  );
  expect(host.querySelector("a")?.textContent).toBe("解説記事へ戻る");
});

it("全体を流れる時間が進んでも同じtraceを保ち、全体図と説明を同期する", async () => {
  playback.elapsed = chapterTime("embedding", 0.2);
  await render();
  const initial = flowProps();
  expect(initial.flow.elapsed).toBe(playback.elapsed);
  expect(initial.map.stage).toBe("embedding");
  expect(initial.map.progress).toBe(cinemaFrame(initial.flow.elapsed).progress);

  playback.elapsed = chapterTime("embedding", 0.7);
  await render();
  const added = flowProps();
  expect(added.flow.elapsed).toBe(playback.elapsed);
  expect(added.map.stage).toBe("embedding");
  expect(added.map.progress).toBe(initial.map.progress);
  expect(added.map.progress).toBe(cinemaFrame(added.flow.elapsed).progress);
  expect(added.flow.trace).toBe(initial.flow.trace);
  expect(added.flow.selection).toBe(initial.flow.selection);

  playback.elapsed = chapterTime("contract", 0.5);
  await render();
  const contracted = flowProps();
  expect(contracted.flow.elapsed).toBe(playback.elapsed);
  expect(contracted.map.stage).toBe("mlp");
  expect(contracted.map.progress).toBe(
    cinemaFrame(contracted.flow.elapsed).progress
  );
  expect(contracted.flow.trace).toBe(initial.flow.trace);
  expect(contracted.flow.selection).toBe(initial.flow.selection);
  expect(
    host.querySelector<HTMLElement>("[data-cinema-chapter]")?.dataset[
      "cinemaChapter"
    ]
  ).toBe("contract");
});

it("一時停止・再開・再視聴と速度変更を再生処理へ渡す", async () => {
  await render();
  clickButton("一時停止");
  expect(playback.configuration.mock.lastCall).toStrictEqual([
    true,
    1,
    CINEMA_DURATION,
    16,
  ]);
  expect(host.textContent).toContain("停止中");
  clickButton("再開");
  expect(playback.configuration.mock.lastCall).toStrictEqual([
    false,
    1,
    CINEMA_DURATION,
    16,
  ]);

  clickButton("一時停止");
  clickButton("もう一度見る");
  expect(playback.replay).toHaveBeenCalledOnce();
  expect(playback.configuration.mock.lastCall).toStrictEqual([
    false,
    1,
    CINEMA_DURATION,
    16,
  ]);

  const select = host.querySelector("select");
  if (!select) {
    throw new Error("再生速度の選択欄が見つからない");
  }
  act(() => {
    select.value = "2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(playback.configuration.mock.lastCall).toStrictEqual([
    false,
    2,
    CINEMA_DURATION,
    16,
  ]);
});

it("171秒の最後まで同じ図を保ち、完了後は再視聴で先頭から流す", async () => {
  playback.elapsed = chapterTime("contract", 0.5);
  await render();
  const initial = flowProps();
  const canvas = host.querySelector(
    'section[aria-label="全体を連続して流れる演算アニメーション"]'
  );

  playback.elapsed = CINEMA_DURATION;
  await render();
  const completed = flowProps();
  expect(completed.flow.elapsed).toBe(CINEMA_DURATION);
  expect(completed.flow.trace).toBe(initial.flow.trace);
  expect(completed.flow.selection).toBe(initial.flow.selection);
  expect(completed.map.stage).toBe("return");
  expect(completed.map.progress).toBe(1);
  expect(host.textContent).toContain("一巡が完了");
  expect(host.querySelector("button")?.disabled).toBe(true);
  expect(
    host.querySelector(
      'section[aria-label="全体を連続して流れる演算アニメーション"]'
    )
  ).toBe(canvas);

  clickButton("もう一度見る");
  expect(playback.replay).toHaveBeenCalledOnce();
  await render();
  expect(flowProps().flow.elapsed).toBe(0);
  expect(flowProps().flow.trace).toBe(initial.flow.trace);
});

it("時間軸を動かした時点で停止し、指定した時刻へ移動する", async () => {
  await render();
  const target = chapterTime("gelu", 0.5);
  seekTime(target);
  expect(playback.seek).toHaveBeenCalledExactlyOnceWith(target);
  expect(playback.configuration.mock.lastCall).toStrictEqual([
    true,
    1,
    CINEMA_DURATION,
    16,
  ]);
  expect(host.textContent).toContain("停止中");
  const { map, flow } = flowProps();
  const frame = cinemaFrame(target);
  expect(flow.elapsed).toBe(target);
  expect(map.stage).toBe(frame.stage);
  expect(map.progress).toBe(frame.progress);
  expect(
    host.querySelector("input[type=range]")?.getAttribute("aria-valuetext")
  ).toBe(frame.title);
  expect(playback.replay).not.toHaveBeenCalled();
});

it("動きを減らす設定では完了した静止画から、時間軸で連続する図の時刻を選べる", async () => {
  playback.reducedMotion = true;
  await render();
  const completed = flowProps();
  expect(host.textContent).toContain("静止表示");
  expect(host.querySelector("button")).toBeNull();
  expect(host.querySelector("select")).toBeNull();
  expect(completed.map.stage).toBe("return");
  expect(completed.map.progress).toBe(1);
  expect(completed.flow.elapsed).toBe(CINEMA_DURATION);
  expect(host.querySelector("input[type=range]")?.getAttribute("value")).toBe(
    String(CINEMA_DURATION)
  );

  const target = chapterTime("score-mask", 0.75);
  seekTime(target);
  const earlier = flowProps();
  const frame = cinemaFrame(target);
  expect(earlier.flow.elapsed).toBe(target);
  expect(earlier.map.stage).toBe("attention");
  expect(earlier.map.stage).toBe(frame.stage);
  expect(earlier.map.progress).toBe(frame.progress);
  expect(earlier.flow.trace).toBe(completed.flow.trace);
  expect(earlier.flow.selection).toBe(completed.flow.selection);
  expect(
    host.querySelector("input[type=range]")?.getAttribute("aria-valuetext")
  ).toBe(frame.title);
  expect(playback.seek).not.toHaveBeenCalled();
  expect(playback.replay).not.toHaveBeenCalled();
});
