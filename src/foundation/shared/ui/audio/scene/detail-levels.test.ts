import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
} from "three";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { createDetailLevels } from "./detail-levels";

const disposals: (() => void)[] = [];
afterEach(() => {
  for (const dispose of disposals) {
    dispose();
  }
  disposals.length = 0;
});

function fixture() {
  const detail = createDetailLevels();
  const low = new BoxGeometry(10, 10, 10);
  const high = new BoxGeometry(10, 10, 10, 8, 8, 8);
  const material = new MeshStandardMaterial();
  const build = vi.fn<() => BoxGeometry>().mockReturnValue(high);
  const mesh = detail.add(new Mesh(low, material), {
    radius: 10,
    pixels: 100,
    build,
  });
  const camera = new PerspectiveCamera(35, 1, 0.5, 3000);
  const root = new Group();
  root.add(mesh);
  root.updateMatrixWorld(true);
  disposals.push(() => {
    detail.dispose();
    low.dispose();
    material.dispose();
  });
  return { detail, low, high, build, mesh, camera, root };
}

it("遠景では詳細形状を生成せず、拡大時だけ生成して再利用する", () => {
  const { detail, low, high, build, mesh, camera } = fixture();
  camera.position.z = 1000;
  expect(detail.update(camera, 800)).toBe(false);
  expect(build).not.toHaveBeenCalled();
  camera.position.z = 50;
  expect(detail.update(camera, 800)).toBe(true);
  expect(mesh.geometry).toBe(high);
  camera.position.z = 1000;
  detail.update(camera, 800);
  expect(mesh.geometry).toBe(low);
  camera.position.z = 50;
  detail.update(camera, 800);
  expect(build).toHaveBeenCalledTimes(1);
  const disposed = vi.fn<() => void>();
  high.addEventListener("dispose", disposed);
  detail.dispose();
  detail.dispose();
  expect(disposed).toHaveBeenCalledTimes(1);
});

it("境界付近では詳細を維持し、鏡像の部品でも大きさを正しく判定する", () => {
  const { detail, mesh, camera, root } = fixture();
  root.scale.x = -1;
  root.updateMatrixWorld(true);
  camera.position.z = 50;
  detail.update(camera, 800);
  camera.position.z = 270;
  expect(detail.update(camera, 800)).toBe(false);
  expect(mesh.geometry.getAttribute("position").count).toBeGreaterThan(24);
  camera.position.z = 350;
  expect(detail.update(camera, 800)).toBe(true);
});
