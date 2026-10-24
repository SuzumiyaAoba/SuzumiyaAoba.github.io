// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { LlmGenerationFlow } from "./generation-demo";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";

const playback = vi.hoisted(() => ({
  elapsed: 0,
  reducedMotion: false,
  replay: vi.fn<() => void>(),
  pause: vi.fn<(paused: boolean) => void>(),
}));

vi.mock(import("./generation-playback"), () => ({
  GENERATION_ANIMATION_DURATION: 36_000 as const,
  useGenerationPlayback: (_ref: unknown, paused: boolean) => {
    playback.pause(paused);
    return {
      elapsed: playback.elapsed,
      reducedMotion: playback.reducedMotion,
      replay: playback.replay,
      seek: vi.fn<(time: number) => void>(),
    };
  },
}));

vi.mock(import("./generation-inspector"), () => ({
  GenerationInspector: ({
    initialStep,
    initialIds,
    initialDraw,
  }: {
    initialStep?: number;
    initialIds?: readonly number[];
    initialDraw?: number;
  }) => (
    <div
      data-inspector
      data-step={initialStep}
      data-ids={initialIds?.join(", ")}
      data-draw={initialDraw}
    />
  ),
}));

const WHITESPACE = /\s+/gu;
let host: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  playback.elapsed = 0;
  playback.reducedMotion = false;
  playback.replay.mockClear();
  playback.pause.mockClear();
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
  await act(async () => root?.render(<LlmGenerationFlow />));
}

function normalizedText(element: Element | null): string {
  return element?.textContent?.replace(WHITESPACE, " ").trim() ?? "";
}

function buttonWithText(text: string): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find(
    (candidate) => normalizedText(candidate) === text
  );
  if (!button) {
    throw new Error(`操作ボタンが見つからない: ${text}`);
  }
  return button;
}

function clickButton(text: string) {
  act(() => buttonWithText(text).click());
}

async function toggleDetails(open: boolean) {
  const details = host.querySelector("details");
  if (!details) {
    throw new Error("計算の詳細が見つからない");
  }
  await act(async () => {
    details.open = open;
    details.dispatchEvent(new Event("toggle"));
  });
}

it("最初はアニメーションを示し、計算段階や入力の操作と計算表を詳細の外へ出さない", async () => {
  await render();
  expect(normalizedText(host.querySelector("[data-story-title]"))).toBe(
    "文章を、トークンIDの列に変える"
  );
  expect(host.querySelector("details")?.open).toBe(false);
  expect(host.querySelector("[data-inspector]")).toBeNull();
  expect(host.querySelector("nav")).toBeNull();
  expect(host.querySelector("input")).toBeNull();
  expect(host.querySelector("table")).toBeNull();
  expect(
    [...host.querySelectorAll("button")].map(normalizedText)
  ).toStrictEqual(["一時停止", "もう一度見る"]);
  expect(playback.pause.mock.lastCall?.[0]).toBe(false);
});

it("時間に合わせて説明を進め、停止と再開と再視聴を再生処理へ渡す", async () => {
  playback.elapsed = 8000;
  await render();
  expect(normalizedText(host.querySelector("[data-story-title]"))).toBe(
    "参照先から、重みに応じて情報を集める"
  );
  expect(normalizedText(host.querySelector("li[aria-current='step']"))).toBe(
    "文脈の計算"
  );
  expect(host.querySelector("progress")?.value).toBe(8000);
  clickButton("一時停止");
  expect(playback.pause.mock.lastCall?.[0]).toBe(true);
  expect(buttonWithText("再開").getAttribute("aria-pressed")).toBe("true");
  clickButton("再開");
  expect(playback.pause.mock.lastCall?.[0]).toBe(false);

  playback.elapsed = 36_000;
  await render();
  expect(
    host.querySelector<HTMLElement>("[data-story-completed]")?.dataset[
      "storyCompleted"
    ]
  ).toBe("true");
  expect(host.textContent).toContain(
    "一巡が完了。選んだIDが、次の入力へ戻った。"
  );
  expect(
    [...host.querySelectorAll("button")].map(normalizedText)
  ).toStrictEqual(["もう一度見る"]);
  clickButton("もう一度見る");
  expect(playback.replay).toHaveBeenCalledOnce();

  playback.reducedMotion = true;
  await render();
  expect(host.querySelector("button")).toBeNull();
  expect(host.textContent).toContain(
    "動きを減らす設定に合わせて、完了した図を表示している。"
  );
});

it("詳細を開く時点の段階を保持し、その間だけ再生を止め、閉じると詳細をアンマウントする", async () => {
  playback.elapsed = 15_000;
  await render();
  expect(host.querySelector("[data-inspector]")).toBeNull();
  await toggleDetails(true);
  expect(playback.pause.mock.lastCall?.[0]).toBe(true);
  expect(buttonWithText("一時停止").disabled).toBe(true);
  expect(buttonWithText("もう一度見る").disabled).toBe(true);
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["step"]
  ).toBe("4");
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["ids"]
  ).toBe("0, 1, 2");
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["draw"]
  ).toBe("0.62");

  playback.elapsed = 27_000;
  await render();
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["step"]
  ).toBe("4");
  await toggleDetails(false);
  expect(host.querySelector("[data-inspector]")).toBeNull();
  expect(playback.pause.mock.lastCall?.[0]).toBe(false);
  expect(buttonWithText("一時停止").disabled).toBe(false);

  await toggleDetails(true);
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["step"]
  ).toBe("7");
});

it("次の予測へ戻る場面の詳細は、確定したIDを追加した入力から始まる", async () => {
  playback.elapsed = 35_500;
  await render();
  await toggleDetails(true);
  const selected = chooseGeneration(runGeneration(DEFAULT_FLOW_IDS), 0.62);
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["step"]
  ).toBe("0");
  expect(
    host.querySelector<HTMLElement>("[data-inspector]")?.dataset["ids"]
  ).toBe([...DEFAULT_FLOW_IDS, selected.id].join(", "));
});
