// @vitest-environment jsdom

import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  GENERATION_ANIMATION_DURATION,
  useGenerationPlayback,
} from "./generation-playback";

const observers: MockIntersectionObserver[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly callback: IntersectionObserverCallback;
  readonly records: IntersectionObserverEntry[] = [];
  target: Element | undefined;
  disconnected = false;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "0px";
    this.thresholds = [Number(options?.threshold ?? 0)];
    observers.push(this);
  }

  observe(target: Element) {
    this.target = target;
  }

  unobserve() {
    this.target = undefined;
  }

  disconnect() {
    this.disconnected = true;
  }

  takeRecords() {
    return this.records.splice(0);
  }

  show(ratio = 1) {
    if (!this.target) {
      throw new Error("監視する図がない");
    }
    const rect = this.target.getBoundingClientRect();
    this.callback(
      [
        {
          boundingClientRect: rect,
          intersectionRatio: ratio,
          intersectionRect: rect,
          isIntersecting: ratio > 0,
          rootBounds: null,
          target: this.target,
          time: performance.now(),
        },
      ],
      this
    );
  }
}

let host: HTMLDivElement;
let root: Root;
let mediaQuery: EventTarget;
let reducedMotion = false;
let visible = true;

function PlaybackProbe({
  paused = false,
  rate = 1,
  duration = GENERATION_ANIMATION_DURATION,
}: {
  paused?: boolean;
  rate?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const playback = useGenerationPlayback(ref, paused, rate, duration);
  return (
    <div ref={ref}>
      <output>{playback.elapsed}</output>
      <span>{playback.reducedMotion ? "静止図" : "アニメーション"}</span>
      <button type="button" onClick={playback.replay}>
        もう一度見る
      </button>
      <button type="button" onClick={() => playback.seek(15_000)}>
        途中へ
      </button>
    </div>
  );
}

function observer() {
  const latest = observers.at(-1);
  if (!latest) {
    throw new Error("図の監視が開始されていない");
  }
  return latest;
}

function elapsed() {
  return Number(host.querySelector("output")?.textContent);
}

function advance(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  /* oxlint-disable promise/prefer-await-to-callbacks -- rAFのコールバックを仮想時計で実行するため、タイマーへ転送する。 */
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 16)
  );
  /* oxlint-enable promise/prefer-await-to-callbacks */
  vi.stubGlobal("cancelAnimationFrame", (id: number) =>
    window.clearTimeout(id)
  );
  reducedMotion = false;
  visible = true;
  observers.length = 0;
  mediaQuery = new EventTarget();
  Object.defineProperty(mediaQuery, "matches", {
    get: () => reducedMotion,
  });
  vi.stubGlobal("matchMedia", () => mediaQuery);
  vi.spyOn(document, "hidden", "get").mockImplementation(() => !visible);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("SSRでは経過0の静止フレームを出力する", () => {
  expect(renderToString(<PlaybackProbe />)).toContain("<output>0</output>");
});

it("図が35%以上見えたら操作なしで始まり、画面外の時間を消費しない", () => {
  act(() => root.render(<PlaybackProbe />));
  advance(1000);
  expect(elapsed()).toBe(0);
  expect(observer().thresholds).toStrictEqual([0.35]);
  expect(observer().rootMargin).toBe("0px");
  act(() => observer().show(0.2));
  advance(1000);
  expect(elapsed()).toBe(0);
  act(() => observer().show(0.5));
  advance(1000);
  expect(elapsed()).toBeGreaterThan(900);
  act(() => observer().show(0));
  const stopped = elapsed();
  advance(10_000);
  expect(elapsed()).toBe(stopped);
  act(() => observer().show());
  advance(1000);
  expect(elapsed()).toBeGreaterThan(stopped + 900);
  expect(elapsed()).toBeLessThan(stopped + 1100);
});

it("非表示タブでは止まり、戻った後に残りの時間を進める", () => {
  act(() => root.render(<PlaybackProbe />));
  act(() => observer().show());
  advance(1000);
  act(() => {
    visible = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const stopped = elapsed();
  advance(10_000);
  expect(elapsed()).toBe(stopped);
  act(() => {
    visible = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  advance(1000);
  expect(elapsed()).toBeGreaterThan(stopped + 900);
  expect(elapsed()).toBeLessThan(stopped + 1100);
});

it("詳細の確認中は停止し、閉じると同じ場所から再開する", () => {
  act(() => root.render(<PlaybackProbe />));
  act(() => observer().show());
  advance(1000);
  act(() => root.render(<PlaybackProbe paused />));
  expect(observer().disconnected).toBe(true);
  const stopped = elapsed();
  advance(10_000);
  expect(elapsed()).toBe(stopped);
  act(() => root.render(<PlaybackProbe />));
  act(() => observer().show());
  advance(1000);
  expect(elapsed()).toBeGreaterThan(stopped + 900);
  expect(elapsed()).toBeLessThan(stopped + 1100);
});

it("最後まで一度だけ再生し、明示的な再生操作で最初へ戻る", () => {
  act(() => root.render(<PlaybackProbe />));
  act(() => observer().show());
  advance(GENERATION_ANIMATION_DURATION + 100);
  expect(elapsed()).toBe(GENERATION_ANIMATION_DURATION);
  expect(vi.getTimerCount()).toBe(0);
  advance(10_000);
  expect(elapsed()).toBe(GENERATION_ANIMATION_DURATION);
  const button = host.querySelector("button");
  if (!button) {
    throw new Error("再生ボタンがない");
  }
  act(() => button.click());
  expect(elapsed()).toBe(0);
  act(() => observer().show());
  advance(1000);
  expect(elapsed()).toBeGreaterThan(900);
});

it("動きを減らす設定では自動再生せず、最終静止図を見せる", () => {
  reducedMotion = true;
  act(() => root.render(<PlaybackProbe />));
  expect(elapsed()).toBe(GENERATION_ANIMATION_DURATION);
  expect(host.textContent).toContain("静止図");
  expect(observers).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});

it("長い計算解説は記事プレビューの36秒を超えて続き、指定した終端で止まる", () => {
  const duration = 90_000;
  act(() => root.render(<PlaybackProbe duration={duration} />));
  act(() => observer().show());
  advance(40_000);
  expect(elapsed()).toBeGreaterThan(GENERATION_ANIMATION_DURATION);
  expect(elapsed()).toBeLessThan(duration);
  advance(60_000);
  expect(elapsed()).toBe(duration);
  expect(vi.getTimerCount()).toBe(0);
});

it("再生中に動きを減らす設定へ変わると静止図に切り替える", () => {
  act(() => root.render(<PlaybackProbe />));
  act(() => observer().show());
  advance(1000);
  act(() => {
    reducedMotion = true;
    mediaQuery.dispatchEvent(new Event("change"));
  });
  expect(elapsed()).toBe(GENERATION_ANIMATION_DURATION);
  expect(observer().disconnected).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("IntersectionObserverが使えない環境では自動再生しない", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  act(() => root.render(<PlaybackProbe />));
  advance(10_000);
  expect(elapsed()).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});

it("ゆっくり再生でも同じ計算時刻を使い、途中へ移った位置から再開する", () => {
  act(() => root.render(<PlaybackProbe rate={1 / 3} />));
  act(() => observer().show());
  advance(3000);
  expect(elapsed()).toBeGreaterThan(950);
  expect(elapsed()).toBeLessThan(1050);
  const [, seekButton] = host.querySelectorAll("button");
  if (!seekButton) {
    throw new Error("移動ボタンがない");
  }
  act(() => seekButton.click());
  expect(elapsed()).toBe(15_000);
  act(() => observer().show());
  advance(3000);
  expect(elapsed()).toBeGreaterThan(15_950);
  expect(elapsed()).toBeLessThan(16_050);
});
