// @vitest-environment jsdom

import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
} from "three";
import type * as Three from "three";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import type {
  HeadphoneModel,
  ViewerHandle,
  ViewerStatus,
} from "../model/viewer";
import { createViewerCamera } from "./viewer-camera";
import { createViewerRenderLoop } from "./viewer-render-loop";
import { createAudioViewer } from "./viewer-runtime";
import { createViewerScene } from "./viewer-scene";

const renderer = vi.hoisted(() => ({
  shadowMap: { enabled: false, type: 0 },
  setPixelRatio: vi.fn<Three.WebGLRenderer["setPixelRatio"]>(),
  setSize: vi.fn<Three.WebGLRenderer["setSize"]>(),
  render: vi.fn<Three.WebGLRenderer["render"]>(),
  compileAsync: vi.fn<Three.WebGLRenderer["compileAsync"]>(),
  dispose: vi.fn<Three.WebGLRenderer["dispose"]>(),
  forceContextLoss: vi.fn<Three.WebGLRenderer["forceContextLoss"]>(),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock -- GPUを使わない部分モックとして必要なメソッドだけを実装する。
vi.mock("three", async (importOriginal) => ({
  ...(await importOriginal<typeof Three>()),
  WebGLRenderer: function WebGLRenderer(this: unknown) {
    return renderer;
  },
}));
vi.mock(import("./viewer-scene"), () => ({
  createViewerScene: vi.fn<typeof createViewerScene>(),
}));
vi.mock(import("./viewer-camera"), () => ({
  createViewerCamera: vi.fn<typeof createViewerCamera>(),
}));
vi.mock(import("./viewer-render-loop"), () => ({
  createViewerRenderLoop: vi.fn<typeof createViewerRenderLoop>(),
}));

let viewer: ViewerHandle | undefined;
let canvas: HTMLCanvasElement;
const scene = {
  scene: new Scene(),
  refresh: vi.fn<() => void>(),
  setHeadphones: vi.fn<(selected: HeadphoneModel) => void>(),
  dispose: vi.fn<() => void>(),
} satisfies ReturnType<typeof createViewerScene>;
const camera = {
  camera: new PerspectiveCamera(),
  setView: vi.fn<ViewerHandle["setView"]>(),
  zoom: vi.fn<ViewerHandle["zoom"]>(),
  setInteractive: vi.fn<ViewerHandle["setInteractive"]>(),
  resize: vi.fn<(aspect: number) => void>(),
  dispose: vi.fn<() => void>(),
} satisfies ReturnType<typeof createViewerCamera>;
const loop = {
  invalidate: vi.fn<() => void>(),
  setActive: vi.fn<(enabled: boolean) => void>(),
  dispose: vi.fn<() => void>(),
} satisfies ReturnType<typeof createViewerRenderLoop>;
const onStatus = vi.fn<(status: ViewerStatus) => void>();

beforeEach(() => {
  vi.clearAllMocks();
  renderer.render.mockReset();
  renderer.compileAsync.mockReset().mockResolvedValue(scene.scene);
  scene.setHeadphones.mockReset();
  scene.scene.clear();
  canvas = document.createElement("canvas");
  vi.mocked(createViewerScene)
    .mockReset()
    .mockImplementation((_renderer, _model, _builder, onChange) => {
      onChange?.();
      return scene;
    });
  vi.mocked(createViewerCamera).mockReset().mockReturnValue(camera);
  vi.mocked(createViewerRenderLoop).mockReset().mockReturnValue(loop);
});

afterEach(() => {
  viewer?.dispose();
  viewer = undefined;
});

function create() {
  return createAudioViewer({
    model: "system",
    createModel: () => ({ group: new Group(), dispose() {} }),
    canvas,
    container: document.createElement("div"),
    onStatus,
    onView() {},
  });
}

it("視点変更は再描画だけを要求し、静的な模型と影を更新し直さない", async () => {
  expect.hasAssertions();
  viewer = create();
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  vi.mocked(createViewerCamera).mock.calls[0]?.[0].onChange();
  expect(loop.invalidate).toHaveBeenCalledTimes(1);
  expect(scene.refresh).not.toHaveBeenCalled();
  vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render();
  expect(renderer.render).toHaveBeenCalledWith(scene.scene, camera.camera);
  expect(onStatus).toHaveBeenLastCalledWith("ready");
});

it("コンテキストの復元で影とシェーダーを再生成し、破棄後はイベントを無視する", async () => {
  expect.hasAssertions();
  viewer = create();
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  const lost = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(lost);
  expect(lost.defaultPrevented).toBe(true);
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  expect(onStatus).toHaveBeenLastCalledWith("unavailable");
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(scene.refresh).toHaveBeenCalledTimes(1);
  expect(onStatus).toHaveBeenLastCalledWith("loading");
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render();
  expect(loop.setActive).toHaveBeenLastCalledWith(true);
  expect(onStatus).toHaveBeenLastCalledWith("ready");
  viewer.dispose();
  viewer.dispose();
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(scene.refresh).toHaveBeenCalledTimes(1);
  expect(loop.dispose).toHaveBeenCalledTimes(1);
  expect(camera.dispose).toHaveBeenCalledTimes(1);
  expect(scene.dispose).toHaveBeenCalledTimes(1);
  expect(renderer.dispose).toHaveBeenCalledTimes(1);
  expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
});

it("描画時に失敗した場合も再読み込みできる状態にする", async () => {
  expect.hasAssertions();
  viewer = create();
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  renderer.render.mockImplementationOnce(() => {
    throw new Error("Rendering failed");
  });
  vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render();
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  expect(onStatus).toHaveBeenLastCalledWith("unavailable");
});

it("カメラの初期化に失敗した場合も生成済みのシーンとGPU資源を解放する", () => {
  vi.mocked(createViewerCamera).mockImplementationOnce(() => {
    throw new Error("Camera initialization failed");
  });
  expect(create).toThrow("Camera initialization failed");
  expect(scene.dispose).toHaveBeenCalledTimes(1);
  expect(renderer.dispose).toHaveBeenCalledTimes(1);
  expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
  expect(createViewerRenderLoop).not.toHaveBeenCalled();
});

it("ヘッドホンの遅延生成に失敗した場合も再読み込みできる状態にする", () => {
  viewer = create();
  scene.setHeadphones.mockImplementationOnce(() => {
    throw new Error("Headphone creation failed");
  });
  viewer.setHeadphones?.("clear-mg-pro");
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  expect(onStatus).toHaveBeenLastCalledWith("unavailable");
});

it("シェーダーの準備中は描画せず、最初に描画できたときに操作を有効にする", async () => {
  expect.hasAssertions();
  const pending = Promise.withResolvers<Three.Object3D>();
  renderer.compileAsync.mockReturnValueOnce(pending.promise);
  viewer = create();
  const render = vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render;
  render?.();
  expect(renderer.render).not.toHaveBeenCalled();
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  expect(onStatus).toHaveBeenLastCalledWith("loading");
  pending.resolve(scene.scene);
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  expect(onStatus).toHaveBeenLastCalledWith("loading");
  render?.();
  render?.();
  expect(renderer.render).toHaveBeenCalledTimes(2);
  expect(
    onStatus.mock.calls.filter(([status]) => status === "ready")
  ).toHaveLength(1);
});

it("準備中に破棄したビューアは、遅れて完了しても描画を再開しない", async () => {
  const pending = Promise.withResolvers<Three.Object3D>();
  renderer.compileAsync.mockReturnValueOnce(pending.promise);
  viewer = create();
  viewer.dispose();
  pending.resolve(scene.scene);
  await pending.promise;
  await Promise.resolve();
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  expect(onStatus).not.toHaveBeenCalledWith("ready");
});

it("準備中のコンテキスト喪失後は古い完了通知を無視し、復元後に準備し直す", async () => {
  expect.hasAssertions();
  const initial = Promise.withResolvers<Three.Object3D>();
  const restored = Promise.withResolvers<Three.Object3D>();
  renderer.compileAsync
    .mockReturnValueOnce(initial.promise)
    .mockReturnValueOnce(restored.promise);
  viewer = create();
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  initial.resolve(scene.scene);
  await initial.promise;
  await Promise.resolve();
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  restored.resolve(scene.scene);
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  expect(renderer.compileAsync).toHaveBeenCalledTimes(2);
});

it("シェーダーの準備に失敗した場合も再読み込みできる状態にする", async () => {
  expect.hasAssertions();
  renderer.compileAsync.mockRejectedValueOnce(
    new Error("Shader preparation failed")
  );
  viewer = create();
  await vi.waitFor(() =>
    expect(onStatus).toHaveBeenLastCalledWith("unavailable")
  );
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
});

it("同じヘッドホンの再選択ではモデルとシェーダーを準備し直さない", () => {
  viewer = create();
  viewer.setHeadphones?.("hd-800s");
  expect(scene.setHeadphones).not.toHaveBeenCalled();
  expect(renderer.compileAsync).toHaveBeenCalledTimes(1);
  viewer.setHeadphones?.("clear-mg-pro");
  viewer.setHeadphones?.("clear-mg-pro");
  expect(scene.setHeadphones).toHaveBeenCalledTimes(1);
  expect(renderer.compileAsync).toHaveBeenCalledTimes(2);
});

it("表示中の形状とインスタンスのシェーダーだけを、親子関係を変えずに準備する", () => {
  const geometry = new BoxGeometry();
  const material = new MeshStandardMaterial();
  const visible = new Mesh(geometry, material);
  const hidden = new Group();
  hidden.visible = false;
  hidden.add(new Mesh(geometry, material));
  const instanced = new InstancedMesh(geometry, material, 4);
  scene.scene.add(visible, hidden, instanced);
  viewer = create();
  const [prepared, preparedCamera, target] =
    renderer.compileAsync.mock.calls[0] ?? [];
  expect(preparedCamera).toBe(camera.camera);
  expect(target).toBe(scene.scene);
  expect(prepared?.children).toHaveLength(2);
  expect(prepared?.children[0]).toBeInstanceOf(Mesh);
  expect(prepared?.children[1]).toBeInstanceOf(InstancedMesh);
  expect(prepared?.children[0]).not.toBe(visible);
  expect(visible.parent).toBe(scene.scene);
  expect(instanced.parent).toBe(scene.scene);
  geometry.dispose();
  material.dispose();
  instanced.dispose();
});
