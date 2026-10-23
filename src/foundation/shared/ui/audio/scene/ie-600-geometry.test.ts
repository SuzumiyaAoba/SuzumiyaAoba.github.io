import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import {
  ie600BoreGeometry,
  ie600ContactSleeveGeometry,
  ie600EarTipGeometry,
  ie600MmcxPinGeometry,
  ie600SocketRimGeometry,
  ie600BalancedPlugBodyGeometry,
  ie600ShellGeometry,
  ie600TipGuardGeometry,
} from "./ie-600-geometry";

it("シリコンのイヤーチップの中央を開け、傘の厚みを保つ", () => {
  const geometry = ie600EarTipGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const tip = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 12), new Vector3(0, 0, -1));
  expect(ray.intersectObject(tip)).toHaveLength(0);
  ray.set(new Vector3(5, 0, 12), new Vector3(0, 0, -1));
  expect(ray.intersectObject(tip).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("イヤーチップの裾を薄く広げ、軸との間に空洞を残す", () => {
  const geometry = ie600EarTipGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const tip = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(4, 0, -1), new Vector3(0, 0, 1));
  expect(ray.intersectObject(tip)[0]?.point.z).toBeGreaterThan(5);
  ray.set(new Vector3(12, 0.5, 1.2), new Vector3(-1, 0, 0));
  const [outer, inner] = ray.intersectObject(tip);
  expect(outer?.point.x).toBeGreaterThan(6);
  const skirtThickness = (outer?.point.x ?? 0) - (inner?.point.x ?? 0);
  expect(skirtThickness).toBeGreaterThan(0.3);
  expect(skirtThickness).toBeLessThan(0.7);
  geometry.dispose();
  material.dispose();
});

it("イヤーチップの根元に金属ノズルを収める空間を残す", () => {
  const geometry = ie600EarTipGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const tip = new Mesh(geometry, material);
  const ray = new Raycaster(
    new Vector3(2.6, 0, -1),
    new Vector3(0, 0, 1),
    0,
    2.5
  );
  expect(ray.intersectObject(tip)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it("ノズルとMMCX端子の筒を塞がない", () => {
  const geometry = ie600BoreGeometry(2.6, 1.3, 4.5);
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const nozzle = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 8), new Vector3(0, 0, -1));
  expect(ray.intersectObject(nozzle)).toHaveLength(0);
  ray.set(new Vector3(2, 0, 8), new Vector3(0, 0, -1));
  expect(ray.intersectObject(nozzle).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("丸い本体からMMCX端子へ伸びる非対称の輪郭を保つ", () => {
  const geometry = ie600ShellGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const shell = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, -2, 12), new Vector3(0, 0, -1));
  expect(ray.intersectObject(shell).length).toBeGreaterThan(0);
  ray.set(new Vector3(3, 10, 12), new Vector3(0, 0, -1));
  expect(ray.intersectObject(shell).length).toBeGreaterThan(0);
  ray.set(new Vector3(-6, 12, 12), new Vector3(0, 0, -1));
  expect(ray.intersectObject(shell)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it("丸い筐体の前面と背面を外側へ向け、縁まで曲面をつなぐ", () => {
  const geometry = ie600ShellGeometry();
  const material = new MeshBasicMaterial();
  const shell = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, -2, 12), new Vector3(0, 0, -1));
  const [front] = ray.intersectObject(shell);
  expect(front?.face?.normal.z).toBeGreaterThan(0);
  expect(front?.point.z).toBeGreaterThan(3);
  ray.set(new Vector3(0, -2, -12), new Vector3(0, 0, 1));
  expect(ray.intersectObject(shell)[0]?.face?.normal.z).toBeLessThan(0);
  ray.set(new Vector3(8.5, -2, 12), new Vector3(0, 0, -1));
  const [edge] = ray.intersectObject(shell);
  expect(edge?.point.z).toBeLessThan(front?.point.z ?? 0);
  geometry.dispose();
  material.dispose();
});

it("イヤーチップの二重の保護格子と中心に通気穴を残す", () => {
  const geometry = ie600TipGuardGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const guard = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 3), new Vector3(0, 0, -1));
  expect(ray.intersectObject(guard)).toHaveLength(0);
  for (const radius of [0.6, 1.12]) {
    ray.set(
      new Vector3(
        Math.cos(Math.PI / 6) * radius,
        Math.sin(Math.PI / 6) * radius,
        3
      ),
      new Vector3(0, 0, -1)
    );
    expect(ray.intersectObject(guard)).toHaveLength(0);
  }
  ray.set(new Vector3(0.7, 0, 3), new Vector3(0, 0, -1));
  expect(ray.intersectObject(guard).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("MMCXの接点スリーブに側面の切れ目を開ける", () => {
  const geometry = ie600ContactSleeveGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const sleeve = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(4, 0, 0.8), new Vector3(-1, 0, 0));
  expect(ray.intersectObject(sleeve)).toHaveLength(0);
  const direction = new Vector3(
    Math.cos(Math.PI / 6),
    Math.sin(Math.PI / 6),
    0
  );
  ray.set(direction.clone().multiplyScalar(4).setZ(0.8), direction.negate());
  expect(ray.intersectObject(sleeve).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("丸い筐体のMMCX差し込み口を金属で塞がない", () => {
  const geometry = ie600ShellGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const shell = new Mesh(geometry, material);
  const axis = new Vector3(-0.4, 1, 0).normalize();
  const origin = new Vector3(4.1, 10.8, 0).addScaledVector(axis, 2);
  const ray = new Raycaster(origin, axis.negate(), 0, 4);
  expect(ray.intersectObject(shell)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it("MMCXの中央ピンの丸い先端を外側へ向ける", () => {
  const geometry = ie600MmcxPinGeometry();
  const material = new MeshBasicMaterial();
  const pin = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0.1, 0, -1), new Vector3(0, 0, 1));
  const [contact] = ray.intersectObject(pin);
  expect(contact?.point.z).toBeGreaterThan(0);
  expect(contact?.point.z).toBeLessThan(0.23);
  expect(contact?.face?.normal.z).toBeLessThan(0);
  geometry.dispose();
  material.dispose();
});

it("MMCXの分割接点に固定リングとその手前の溝を作る", () => {
  const geometry = ie600ContactSleeveGeometry();
  const material = new MeshBasicMaterial();
  const sleeve = new Mesh(geometry, material);
  const direction = new Vector3(
    Math.cos(Math.PI / 6),
    Math.sin(Math.PI / 6),
    0
  );
  const ray = new Raycaster(
    direction.clone().multiplyScalar(4).setZ(1.55),
    direction.clone().negate()
  );
  const [groove] = ray.intersectObject(sleeve);
  ray.set(
    direction.clone().multiplyScalar(4).setZ(1.8),
    direction.clone().negate()
  );
  const [collar] = ray.intersectObject(sleeve);
  expect(groove).toBeDefined();
  expect(collar).toBeDefined();
  const grooveRadius = Math.hypot(groove?.point.x ?? 0, groove?.point.y ?? 0);
  const collarRadius = Math.hypot(collar?.point.x ?? 0, collar?.point.y ?? 0);
  expect(collarRadius - grooveRadius).toBeGreaterThan(0.12);
  geometry.dispose();
  material.dispose();
});

it("MMCXソケットの丸い口元を開けたままにする", () => {
  const geometry = ie600SocketRimGeometry();
  const material = new MeshBasicMaterial();
  const rim = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 3), new Vector3(0, 0, -1));
  expect(ray.intersectObject(rim)).toHaveLength(0);
  ray.set(new Vector3(2.3, 0, 3), new Vector3(0, 0, -1));
  expect(ray.intersectObject(rim)[0]?.point.z).toBeCloseTo(1.3);
  geometry.dispose();
  material.dispose();
});

it("バランスプラグのケーブル根元と差し込み軸をL字でつなぐ", () => {
  const geometry = ie600BalancedPlugBodyGeometry();
  const material = new MeshBasicMaterial();
  const body = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(-10, -5, -6.4), new Vector3(0, 1, 0));
  expect(ray.intersectObject(body).length).toBeGreaterThan(0);
  ray.set(new Vector3(0, -5, 5), new Vector3(0, 1, 0));
  expect(ray.intersectObject(body).length).toBeGreaterThan(0);
  ray.set(new Vector3(-10, -5, 5), new Vector3(0, 1, 0));
  expect(ray.intersectObject(body)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it("ロゴ下の細長い通気孔を曲面に開け、奥まで金属の壁を残す", () => {
  const geometry = ie600ShellGeometry();
  const material = new MeshBasicMaterial();
  const shell = new Mesh(geometry, material);
  const ray = new Raycaster(
    new Vector3(-4.4, -5.9, 8),
    new Vector3(0, 0, -1),
    0,
    6.1
  );
  expect(ray.intersectObject(shell)).toHaveLength(0);
  ray.set(new Vector3(-4.4, -5.9, 1.6), new Vector3(0, 1, 0));
  expect(ray.intersectObject(shell)[0]?.distance).toBeCloseTo(0.42, 2);
  ray.set(new Vector3(-4.4, -5.35, 8), new Vector3(0, 0, -1));
  expect(ray.intersectObject(shell)[0]?.point.z).toBeGreaterThan(2.5);
  geometry.dispose();
  material.dispose();
});
