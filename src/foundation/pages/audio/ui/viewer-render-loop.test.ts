// @vitest-environment jsdom

import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { createViewerRenderLoop } from "./viewer-render-loop";

let notifyResize: () => void;
let notifyVisibility: (entries: { isIntersecting: boolean }[]) => void;
let loop: ReturnType<typeof createViewerRenderLoop> | undefined;
let container: HTMLDivElement;
let hidden: boolean;
const frames = new Map<number, FrameRequestCallback>();
const render = vi.fn<() => void>();
const resize = vi.fn<(width: number, height: number) => void>();
const disconnectResize = vi.fn<() => void>();
const disconnectVisibility = vi.fn<() => void>();
const measureBounds = vi.fn<() => DOMRect>();

function SizeObserver(this: unknown, onResize: () => void) {
  notifyResize = onResize;
  return { observe() {}, disconnect: disconnectResize };
}

function VisibilityObserver(this: unknown, onEntries: typeof notifyVisibility) {
  notifyVisibility = onEntries;
  return { observe() {}, disconnect: disconnectVisibility };
}

beforeEach(() => {
  vi.clearAllMocks();
  frames.clear();
  hidden = false;
  let nextFrame = 0;
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("requestAnimationFrame", (onFrame: FrameRequestCallback) => {
    nextFrame += 1;
    frames.set(nextFrame, onFrame);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) =>
    frames.delete(frame)
  );
  vi.stubGlobal("ResizeObserver", SizeObserver);
  vi.stubGlobal("IntersectionObserver", VisibilityObserver);
  container = document.createElement("div");
  measureBounds.mockReturnValue(new DOMRect(0, 0, 640, 480));
  vi.spyOn(container, "getBoundingClientRect").mockImplementation(
    measureBounds
  );
});

afterEach(() => {
  loop?.dispose();
  loop = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function flushFrame() {
  for (const [id, onFrame] of frames) {
    frames.delete(id);
    onFrame(0);
  }
}

it("同じフレームの変更をまとめ、静止中は描画を繰り返さない", () => {
  loop = createViewerRenderLoop({ container, render, resize });
  loop.invalidate();
  loop.invalidate();
  expect(frames.size).toBe(1);
  flushFrame();
  expect(render).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  loop.invalidate();
  flushFrame();
  expect(render).toHaveBeenCalledTimes(2);
});

it("画面外に出ると予約済みの描画を取り消し、戻ると再描画する", () => {
  loop = createViewerRenderLoop({ container, render, resize });
  notifyVisibility([{ isIntersecting: false }]);
  loop.invalidate();
  flushFrame();
  expect(render).not.toHaveBeenCalled();
  notifyVisibility([{ isIntersecting: true }]);
  flushFrame();
  expect(render).toHaveBeenCalledTimes(1);
});

it("タブが非表示になった後は予約済みコールバックでも描画せず、復帰時に描画する", () => {
  loop = createViewerRenderLoop({ container, render, resize });
  hidden = true;
  flushFrame();
  expect(render).not.toHaveBeenCalled();
  hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  flushFrame();
  expect(render).toHaveBeenCalledTimes(1);
});

it("コンテキスト喪失中の描画を止め、復元時に1回描画する", () => {
  loop = createViewerRenderLoop({ container, render, resize });
  loop.setActive(false);
  loop.invalidate();
  notifyVisibility([{ isIntersecting: true }]);
  flushFrame();
  expect(render).not.toHaveBeenCalled();
  loop.setActive(true);
  flushFrame();
  expect(render).toHaveBeenCalledTimes(1);
});

it("同じサイズや幅・高さが0の通知ではバッファを作り直さない", () => {
  loop = createViewerRenderLoop({ container, render, resize });
  expect(resize).toHaveBeenLastCalledWith(640, 480);
  notifyResize();
  measureBounds.mockReturnValue(new DOMRect());
  notifyResize();
  expect(resize).toHaveBeenCalledTimes(1);
  measureBounds.mockReturnValue(new DOMRect(0, 0, 320, 240));
  notifyResize();
  expect(resize).toHaveBeenCalledTimes(2);
  expect(resize).toHaveBeenLastCalledWith(320, 240);
});

it("破棄後は描画・リサイズを行わず、監視を解除する", () => {
  loop = createViewerRenderLoop({ container, render, resize });
  loop.dispose();
  loop.invalidate();
  loop.setActive(true);
  notifyVisibility([{ isIntersecting: true }]);
  measureBounds.mockReturnValue(new DOMRect(0, 0, 320, 240));
  notifyResize();
  flushFrame();
  expect(render).not.toHaveBeenCalled();
  expect(resize).toHaveBeenCalledTimes(1);
  expect(disconnectResize).toHaveBeenCalledTimes(1);
  expect(disconnectVisibility).toHaveBeenCalledTimes(1);
});

it("初回のリサイズに失敗しても監視を解除する", () => {
  resize.mockImplementationOnce(() => {
    throw new Error("Resize failed");
  });
  expect(() => createViewerRenderLoop({ container, render, resize })).toThrow(
    "Resize failed"
  );
  expect(disconnectResize).toHaveBeenCalledTimes(1);
  expect(disconnectVisibility).toHaveBeenCalledTimes(1);
});
