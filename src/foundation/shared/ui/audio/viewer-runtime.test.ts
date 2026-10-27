// @vitest-environment jsdom

import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderTarget,
} from "three";
import type * as Three from "three";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import type {
  HeadphoneModel,
  ViewerHandle,
  ViewerStatus,
} from "@/shared/ui/audio/definitions/viewer";
import { createViewerCamera } from "./viewer-camera";
import { createViewerRenderLoop } from "./viewer-render-loop";
import { createAudioViewer } from "./viewer-runtime";
import { createViewerScene } from "./viewer-scene";
import { createViewerEnvironment } from "./viewer-environment";
import { upgradeAudioTextures } from "./scene/texture-images";

const renderer = vi.hoisted(() => ({
  shadowMap: { enabled: false, type: 0 },
  transmissionResolutionScale: 1,
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
vi.mock(import("./viewer-environment"), () => ({
  createViewerEnvironment: vi.fn<typeof createViewerEnvironment>(),
}));
vi.mock(import("./scene/texture-images"), () => ({
  upgradeAudioTextures: vi.fn<typeof upgradeAudioTextures>(),
}));

let viewer: ViewerHandle | undefined;
let canvas: HTMLCanvasElement;
const scene = {
  scene: new Scene(),
  refresh: vi.fn<() => void>(),
  setHeadphones: vi.fn<(selected: HeadphoneModel) => Promise<void>>(),
  updateDetail: vi.fn<ReturnType<typeof createViewerScene>["updateDetail"]>(),
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
  scene.setHeadphones.mockReset().mockResolvedValue(undefined);
  scene.updateDetail.mockReset().mockReturnValue(false);
  vi.mocked(createViewerEnvironment)
    .mockReset()
    .mockReturnValue(new WebGLRenderTarget(1, 1));
  vi.mocked(upgradeAudioTextures).mockReset().mockResolvedValue(false);
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
  scene.refresh.mockClear();
  vi.mocked(createViewerCamera).mock.calls[0]?.[0].onChange();
  expect(loop.invalidate).toHaveBeenCalledTimes(1);
  expect(scene.refresh).not.toHaveBeenCalled();
  vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render();
  expect(renderer.render).toHaveBeenCalledWith(scene.scene, camera.camera);
  expect(onStatus).toHaveBeenLastCalledWith("ready");
});

it("ガラス越しの表示は画面が小さいとき原寸で描き、大きな画面では画素数を制限する", () => {
  viewer = create();
  const resize = vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].resize;
  if (!resize) {
    throw new Error("Missing viewer resize handler.");
  }
  resize(400, 300);
  expect(renderer.transmissionResolutionScale).toBe(1);
  resize(2400, 1600);
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  expect(renderer.transmissionResolutionScale).toBeCloseTo(
    Math.sqrt(2_000_000 / (2400 * 1600 * pixelRatio ** 2))
  );
  resize(400, 300);
  expect(renderer.transmissionResolutionScale).toBe(1);
});

it("コンテキストの復元で影とシェーダーを再生成し、破棄後はイベントを無視する", async () => {
  expect.hasAssertions();
  viewer = create();
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  scene.refresh.mockClear();
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

it.each(["in", "out"] as const)(
  "ズームによる詳細切り替えではロード表示に戻らず、操作を続けられる (%s)",
  async (direction) => {
    expect.hasAssertions();
    viewer = create();
    await vi.waitFor(() =>
      expect(loop.setActive).toHaveBeenLastCalledWith(true)
    );
    const render = vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render;
    render?.();
    expect(onStatus).toHaveBeenLastCalledWith("ready");
    onStatus.mockClear();
    renderer.render.mockClear();

    const pending = Promise.withResolvers<Three.Object3D>();
    renderer.compileAsync.mockReturnValueOnce(pending.promise);
    scene.updateDetail.mockReturnValueOnce(true);
    viewer.zoom(direction);
    render?.();
    expect(onStatus).not.toHaveBeenCalled();
    render?.();
    expect(renderer.render).not.toHaveBeenCalled();
    viewer.zoom(direction);
    expect(camera.zoom).toHaveBeenCalledTimes(2);
    expect(camera.zoom).toHaveBeenLastCalledWith(direction);

    pending.resolve(scene.scene);
    await vi.waitFor(() =>
      expect(loop.setActive).toHaveBeenLastCalledWith(true)
    );
    render?.();
    expect(renderer.render).toHaveBeenCalledWith(scene.scene, camera.camera);
    expect(onStatus).not.toHaveBeenCalled();
  }
);

it("詳細切り替えの準備中に製品を変更すると、古い完了通知を無視してロード表示にする", async () => {
  expect.hasAssertions();
  viewer = create();
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  const render = vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render;
  render?.();
  const detail = Promise.withResolvers<Three.Object3D>();
  const model = Promise.withResolvers<Three.Object3D>();
  renderer.compileAsync
    .mockReturnValueOnce(detail.promise)
    .mockReturnValueOnce(model.promise);
  scene.updateDetail.mockReturnValueOnce(true);
  render?.();
  expect(onStatus).toHaveBeenLastCalledWith("ready");

  viewer.setModel("ud-505", buildModel);
  expect(onStatus).toHaveBeenLastCalledWith("loading");
  detail.resolve(scene.scene);
  await detail.promise;
  await Promise.resolve();
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
  model.resolve(scene.scene);
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  render?.();
  expect(onStatus).toHaveBeenLastCalledWith("ready");
});

it("詳細切り替えの準備に失敗した場合は再読み込みできる状態にする", async () => {
  expect.hasAssertions();
  viewer = create();
  await vi.waitFor(() => expect(loop.setActive).toHaveBeenLastCalledWith(true));
  const render = vi.mocked(createViewerRenderLoop).mock.calls[0]?.[0].render;
  render?.();
  renderer.compileAsync.mockRejectedValueOnce(
    new Error("Detail shader preparation failed")
  );
  scene.updateDetail.mockReturnValueOnce(true);
  render?.();
  await vi.waitFor(() =>
    expect(onStatus).toHaveBeenLastCalledWith("unavailable")
  );
  expect(loop.setActive).toHaveBeenLastCalledWith(false);
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

it("同じヘッドホンの再選択ではモデルとシェーダーを準備し直さない", async () => {
  expect.hasAssertions();
  viewer = create();
  viewer.setHeadphones?.("hd-800s");
  expect(scene.setHeadphones).not.toHaveBeenCalled();
  expect(renderer.compileAsync).toHaveBeenCalledTimes(1);
  viewer.setHeadphones?.("clear-mg-pro");
  viewer.setHeadphones?.("clear-mg-pro");
  expect(scene.setHeadphones).toHaveBeenCalledTimes(1);
  await vi.waitFor(() =>
    expect(renderer.compileAsync).toHaveBeenCalledTimes(2)
  );
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

it("製品を戻るとシーンと描画環境を再利用し、上限を超えた資源だけを解放する", () => {
  const second = {
    ...scene,
    scene: new Scene(),
    refresh: vi.fn<() => void>(),
    dispose: vi.fn<() => void>(),
  };
  const third = {
    ...scene,
    scene: new Scene(),
    refresh: vi.fn<() => void>(),
    dispose: vi.fn<() => void>(),
  };
  vi.mocked(createViewerScene)
    .mockReturnValueOnce(scene)
    .mockReturnValueOnce(second)
    .mockReturnValueOnce(third);

  viewer = create();
  viewer.setModel("ud-505", buildModel);
  scene.refresh.mockClear();
  viewer.setModel("system", buildModel);
  expect(createViewerScene).toHaveBeenCalledTimes(2);
  expect(createViewerEnvironment).toHaveBeenCalledTimes(1);
  expect(renderer.dispose).not.toHaveBeenCalled();
  expect(renderer.forceContextLoss).not.toHaveBeenCalled();
  expect(scene.refresh).not.toHaveBeenCalled();
  viewer.setModel("hd-800s", buildModel);
  expect(second.dispose).toHaveBeenCalledTimes(1);
  expect(scene.dispose).not.toHaveBeenCalled();
  viewer.dispose();
  expect(scene.dispose).toHaveBeenCalledTimes(1);
  expect(second.dispose).toHaveBeenCalledTimes(1);
  expect(third.dispose).toHaveBeenCalledTimes(1);
});

function buildModel() {
  return { group: new Group(), dispose() {} };
}
