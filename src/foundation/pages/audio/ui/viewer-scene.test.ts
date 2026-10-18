import {
  BoxGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Texture,
  WebGLRenderer,
} from "three";
import type * as Three from "three";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import type { AudioModelBuilder } from "../model/viewer";
import { createViewerScene } from "./viewer-scene";

const { disposeEnvironment } = vi.hoisted(() => ({
  disposeEnvironment: vi.fn<() => void>(),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock -- GPUを使わない部分モックとして必要なメソッドだけを実装する。
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof Three>();
  return {
    ...actual,
    WebGLRenderer: RendererStub,
    PMREMGenerator: function PMREMGenerator(this: unknown) {
      return {
        fromScene() {
          return { texture: new actual.Texture(), dispose: disposeEnvironment };
        },
        dispose() {},
      };
    },
  };
});

function RendererStub(this: unknown) {
  return {};
}

let resources: ReturnType<typeof createViewerScene> | undefined;
let modelChanged: (() => void) | undefined;
let group: Group;
let mesh: Mesh<BoxGeometry, MeshStandardMaterial>;
const onChange = vi.fn<() => void>();
const disposeModel = vi.fn<() => void>();

beforeEach(() => {
  vi.clearAllMocks();
  group = new Group();
  mesh = new Mesh(new BoxGeometry(20, 20, 20), new MeshStandardMaterial());
  group.add(mesh);
});

afterEach(() => {
  resources?.dispose();
  resources = undefined;
  mesh.geometry.dispose();
  mesh.material.dispose();
});

function createScene(setHeadphones?: (model: string) => void) {
  const builder: AudioModelBuilder = (notify) => {
    modelChanged = notify;
    // 同期の初期化通知も安全に受け付ける。
    notify?.();
    return {
      group,
      dispose: disposeModel,
      ...(setHeadphones ? { setHeadphones } : {}),
    };
  };
  resources = createViewerScene(
    new WebGLRenderer(),
    "system",
    builder,
    onChange
  );
  const light = resources.scene.children.find(
    (part) => part instanceof DirectionalLight && part.castShadow
  );
  if (!(light instanceof DirectionalLight)) {
    throw new Error("Shadow light is missing");
  }
  return { ...resources, light };
}

it("初回の影と行列を準備し、自動での再計算を止める", () => {
  const { scene, light } = createScene();
  expect(scene.environment).toBeInstanceOf(Texture);
  expect(scene.matrixWorldAutoUpdate).toBe(false);
  expect(light.shadow.autoUpdate).toBe(false);
  expect(light.shadow.needsUpdate).toBe(true);
  expect(mesh.castShadow).toBe(true);
  expect(mesh.receiveShadow).toBe(true);
});

it("モデルの変更通知で行列と影を更新し、再描画を要求する", () => {
  const { light } = createScene();
  light.shadow.needsUpdate = false;
  group.position.x = 120;
  mesh.position.x = 30;
  onChange.mockClear();
  modelChanged?.();
  expect(mesh.matrixWorld.elements[12]).toBe(150);
  expect(light.shadow.needsUpdate).toBe(true);
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("遅延生成したヘッドホンにも影とワールド座標を設定する", async () => {
  const added = new Mesh(mesh.geometry, mesh.material);
  const { setHeadphones, light } = createScene(() => {
    added.position.x = 390;
    group.add(added);
  });
  light.shadow.needsUpdate = false;
  await setHeadphones("clear-mg-pro");
  expect(added.castShadow).toBe(true);
  expect(added.receiveShadow).toBe(true);
  expect(added.matrixWorld.elements[12]).toBe(390);
  expect(light.shadow.needsUpdate).toBe(true);
});

it("透過印刷は影を落とさず、アルファテストを使うメッシュは影を落とす", () => {
  const { refresh } = createScene();
  mesh.material.transparent = true;
  refresh();
  expect(mesh.castShadow).toBe(false);
  mesh.material.alphaTest = 0.5;
  refresh();
  expect(mesh.castShadow).toBe(true);
  mesh.userData["castShadow"] = false;
  refresh();
  expect(mesh.castShadow).toBe(false);
});

it("破棄後のモデル通知では描画を要求しない", () => {
  const scene = createScene();
  scene.dispose();
  resources = undefined;
  onChange.mockClear();
  modelChanged?.();
  expect(onChange).not.toHaveBeenCalled();
  expect(disposeModel).toHaveBeenCalledTimes(1);
  expect(disposeEnvironment).toHaveBeenCalledTimes(1);
});
