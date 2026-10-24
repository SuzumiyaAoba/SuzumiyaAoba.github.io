import { Box3, InstancedMesh, Mesh, Raycaster, Vector3 } from "three";
import type { BufferGeometry, Material, Object3D } from "three";
import { expect, it, vi } from "vitest";
import { createModelParts } from "./parts";
import { createBncSocket } from "./bnc-socket";
import { bncBayonetGeometry } from "./bnc-geometry";
import {
  createCybershaftBnc,
  createStandaloneCybershaftBnc,
  cybershaftCableCurve,
} from "./cybershaft-bnc";

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

it("BNCカップリングの直線部分を過剰に分割しない", () => {
  const geometry = bncBayonetGeometry();
  expect(geometry.getAttribute("position").count / 3).toBeLessThan(10_000);
  geometry.dispose();
});

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

it("50Ωの絶縁体には深い嵌合穴を設け、接地ばねの間に四本のスリットを残す", () => {
  const model = createStandaloneCybershaftBnc();
  model.group.updateMatrixWorld(true);
  const plug = model.group.getObjectByName(
    "Cybershaft 50Ω BNC plug — First connector"
  );
  if (!plug) {
    throw new Error("Missing BNC plug.");
  }
  const depths: number[] = [];
  for (const radius of [2, 3]) {
    const ray = new Raycaster(
      plug.localToWorld(new Vector3(radius, 0, -1)),
      new Vector3(0, 0, 1).transformDirection(plug.matrixWorld)
    );
    const [hit] = ray.intersectObject(plug);
    expect(hit?.object.name).toBe("Exposed BNC white dielectric");
    depths.push(hit?.distance ?? 0);
  }
  expect(depths[0]).toBeCloseTo(6.4, 1);
  expect(depths[1]).toBeCloseTo(1.5, 1);
  const springs = plug.getObjectByName(
    "Four slotted BNC ground spring contacts"
  );
  if (!springs) {
    throw new Error("Missing ground springs.");
  }
  for (let index = 0; index < 4; index += 1) {
    const angle = (index * Math.PI) / 2;
    const point = new Vector3(Math.cos(angle) * 3.8, Math.sin(angle) * 3.8, -1);
    const ray = new Raycaster(
      plug.localToWorld(point),
      new Vector3(0, 0, 1).transformDirection(plug.matrixWorld)
    );
    expect(ray.intersectObject(springs)).toHaveLength(0);
  }
  model.dispose();
});

it("接続時にソケットの二本のピンがロック溝へ入り、金属筒がカップリングに収まる", () => {
  const parts = createModelParts({ brushed: false });
  createBncSocket(parts, [0, 0, 0]);
  parts.root.updateMatrixWorld(true);
  const cable = createCybershaftBnc(
    { position: new Vector3(0, 0, 10.1), direction: new Vector3(0, 0, 1) },
    { position: new Vector3(60, 0, 10.1), direction: new Vector3(0, 0, 1) }
  );
  cable.group.updateMatrixWorld(true);
  const collar = cable.group.getObjectByName(
    "BNC rotating collar with two open L shaped bayonet slots"
  );
  if (!collar) {
    throw new Error("Missing BNC coupling.");
  }
  const rays = [-1, 1].map(
    (side) =>
      new Raycaster(
        new Vector3(side * 9, 0, 6.65),
        new Vector3(-side, 0, 0),
        0,
        4.1
      )
  );
  for (const ray of rays) {
    expect(ray.intersectObject(collar)).toHaveLength(0);
    expect(ray.intersectObject(parts.root)[0]?.object.name).toBe(
      "Cylindrical BNC bayonet locking pin"
    );
  }
  const opening = new Raycaster(
    new Vector3(4.85, 0, 11),
    new Vector3(0, 0, -1),
    0,
    8
  );
  expect(opening.intersectObject(collar)).toHaveLength(0);
  expect(opening.intersectObject(parts.root)).toHaveLength(0);
  parts.dispose();
  cable.dispose();
});
