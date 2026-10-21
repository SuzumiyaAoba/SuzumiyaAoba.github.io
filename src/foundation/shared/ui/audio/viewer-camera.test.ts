// @vitest-environment jsdom

import { Vector3 } from "three";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { audioModels, modelViews } from "@/shared/ui/audio/definitions/viewer";
import type {
  AudioModel,
  AudioView,
} from "@/shared/ui/audio/definitions/viewer";
import { createViewerCamera } from "./viewer-camera";
import { getCameraPose } from "./viewer-camera-presets";

let canvas: HTMLCanvasElement;
let viewer: ReturnType<typeof createViewerCamera> | undefined;
const onChange = vi.fn<() => void>();
const onView = vi.fn<(view: AudioView | undefined) => void>();

beforeEach(() => {
  canvas = document.createElement("canvas");
  document.body.append(canvas);
  onChange.mockReset();
  onView.mockReset();
});

afterEach(() => {
  viewer?.dispose();
  viewer = undefined;
  canvas.remove();
});

function create(model: AudioModel = "ud-505") {
  viewer = createViewerCamera({ model, canvas, onChange, onView });
  viewer.resize(1.5);
  return viewer;
}

function key(keyName: string) {
  const event = new KeyboardEvent("keydown", {
    key: keyName,
    cancelable: true,
  });
  canvas.dispatchEvent(event);
  return event;
}

it.each(audioModels)(
  "%s のすべての視点で被写体を画面の中心に収める",
  (model) => {
    const controls = create(model);
    for (const view of modelViews[model]) {
      controls.setView(view);
      controls.camera.updateMatrixWorld(true);
      const target = new Vector3(...getCameraPose(model, view).target);
      const projected = target.project(controls.camera);
      expect(projected.x).toBeCloseTo(0);
      expect(projected.y).toBeCloseTo(0);
      expect(projected.z).toBeGreaterThan(-1);
      expect(projected.z).toBeLessThan(1);
      expect(onView).toHaveBeenLastCalledWith(view);
    }
  }
);

it("選択した視点をリサイズ時に維持し、手動回転後は位置を維持する", () => {
  const controls = create("node-n130");
  controls.setView("front");
  const front = controls.camera.position.clone();
  controls.resize(0.75);
  expect(controls.camera.position.z).toBeGreaterThan(front.z);
  expect(controls.camera.fov).toBe(20);
  expect(onView).toHaveBeenLastCalledWith("front");
  expect(key("ArrowRight").defaultPrevented).toBe(true);
  expect(onView).toHaveBeenLastCalledWith(undefined);
  const rotated = controls.camera.position.clone();
  controls.resize(2);
  expect(controls.camera.position.equals(rotated)).toBe(true);
  expect(controls.camera.aspect).toBe(2);
});

it.each([
  ["ud-505", 65, 1100],
  ["system", 65, 6000],
  ["ie-600", 8, 650],
  ["btr17", 12, 650],
] as const)(
  "%s のズームを距離の範囲内に制限する",
  (model, minimum, maximum) => {
    const controls = create(model);
    const target = new Vector3(...getCameraPose(model, "overview").target);
    for (let count = 0; count < 60; count++) {
      controls.zoom("in");
    }
    expect(controls.camera.position.distanceTo(target)).toBeCloseTo(minimum);
    for (let count = 0; count < 60; count++) {
      controls.zoom("out");
    }
    expect(controls.camera.position.distanceTo(target)).toBeCloseTo(maximum);
    expect(onView).toHaveBeenLastCalledWith(undefined);
  }
);

it("ドラッグ操作が無効でもキーボードでズームと視点リセットができる", () => {
  const controls = create();
  controls.setInteractive(false);
  const overview = controls.camera.position.clone();
  expect(key("+").defaultPrevented).toBe(true);
  expect(controls.camera.position.length()).toBeLessThan(overview.length());
  expect(key("Home").defaultPrevented).toBe(true);
  expect(controls.camera.position.distanceTo(overview)).toBeCloseTo(0);
  expect(onView).toHaveBeenLastCalledWith("overview");
  expect(key("Tab").defaultPrevented).toBe(false);
});

it("破棄後はキーボードイベントに応答しない", () => {
  const controls = create();
  controls.dispose();
  viewer = undefined;
  onChange.mockClear();
  onView.mockClear();
  expect(key("ArrowLeft").defaultPrevented).toBe(false);
  expect(onChange).not.toHaveBeenCalled();
  expect(onView).not.toHaveBeenCalled();
});
