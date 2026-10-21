import { Box3, InstancedMesh, Mesh, Raycaster, Vector3 } from "three";
import type { BufferGeometry, Material, Object3D } from "three";
import { expect, it, vi } from "vitest";
import {
  createCybershaftBnc,
  createStandaloneCybershaftBnc,
  cybershaftCableCurve,
} from "./cybershaft-bnc";

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

it.each([-35, 35])("単体ケーブルの端子 %s の中心ピンと絶縁体が見える", (x) => {
  const cable = createStandaloneCybershaftBnc();
  cable.group.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(x, 7.2, 85), new Vector3(0, 0, -1));
  expect(ray.intersectObject(cable.group)[0]?.object.name).toBe(
    "Exposed BNC gold centre pin"
  );
  ray.set(new Vector3(x + 2, 7.2, 85), new Vector3(0, 0, -1));
  expect(ray.intersectObject(cable.group)[0]?.object.name).toBe(
    "Exposed BNC white dielectric"
  );
  expect(new Box3().setFromObject(cable.group).min.y).toBeGreaterThanOrEqual(0);
  cable.dispose();
});

it.each([
  [new Vector3(0, 0, -1), new Vector3(0, 0, -1)],
  [new Vector3(1, 0, 0), new Vector3(0, 0, -1)],
])(
  "BNC端子の接続位置と出線方向を保つ: %s / %s",
  (startDirection, endDirection) => {
    const start = {
      position: new Vector3(-125, 116, -145),
      direction: startDirection,
    };
    const end = {
      position: new Vector3(-182, 32, -145),
      direction: endDirection,
    };
    const curve = cybershaftCableCurve(start, end);
    expect(curve.getPoint(0).distanceTo(start.position)).toBeLessThan(0.001);
    expect(curve.getPoint(1).distanceTo(end.position)).toBeLessThan(0.001);
    expect(curve.getTangent(0).dot(startDirection)).toBeGreaterThan(0.99);
    expect(curve.getTangent(1).dot(endDirection)).toBeLessThan(-0.99);
    expect(start.position.toArray()).toStrictEqual([-125, 116, -145]);
    expect(end.position.toArray()).toStrictEqual([-182, 32, -145]);
  }
);

it("セミリジッドケーブルを機器背面より外側に配線して床に埋めない", () => {
  const curve = cybershaftCableCurve(
    {
      position: new Vector3(-125, 116, -145),
      direction: new Vector3(0, 0, -1),
    },
    {
      position: new Vector3(-182, 32, -145),
      direction: new Vector3(0, 0, -1),
    }
  );
  const points = curve.getPoints(500);
  expect(Math.max(...points.map((point) => point.z))).toBeLessThanOrEqual(-145);
  expect(Math.min(...points.map((point) => point.y))).toBeGreaterThan(2.1);
});

it("追加したケーブルとBNC端子のGPUリソースを解放する", () => {
  const cable = createCybershaftBnc(
    {
      position: new Vector3(-125, 116, -120),
      direction: new Vector3(0, 0, -1),
    },
    {
      position: new Vector3(-182, 32, -120),
      direction: new Vector3(0, 0, -1),
    }
  );
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const disposed = vi.fn<() => void>();
  let instancedMeshCount = 0;
  cable.group.traverse((part) => {
    if (part instanceof InstancedMesh) {
      part.addEventListener("dispose", disposed);
      instancedMeshCount += 1;
    }
    if (isMesh(part)) {
      geometries.add(part.geometry);
      for (const material of Array.isArray(part.material)
        ? part.material
        : [part.material]) {
        materials.add(material);
      }
    }
  });
  for (const resource of [...geometries, ...materials]) {
    resource.addEventListener("dispose", disposed);
  }
  cable.dispose();
  expect(geometries.size).toBeGreaterThan(0);
  expect(materials.size).toBeGreaterThan(0);
  expect(disposed).toHaveBeenCalledTimes(
    geometries.size + materials.size + instancedMeshCount
  );
});
