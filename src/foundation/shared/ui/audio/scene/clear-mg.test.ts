import {
  Box3,
  BufferGeometry,
  BufferAttribute,
  InstancedMesh,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Raycaster,
  Vector3,
} from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createClearMgPro } from "./clear-mg-pro";
import {
  clearMgBandPerforations,
  clearMgPadPerforations,
} from "./clear-mg-geometry";

afterEach(() => vi.unstubAllGlobals());

function noop() {}
function stubCanvas() {
  const context = {
    scale: noop,
    translate: noop,
    rotate: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    ellipse: noop,
    quadraticCurveTo: noop,
    closePath: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    fillText: noop,
    putImageData: noop,
    createImageData: (width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    }),
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
  vi.stubGlobal("Path2D", noop);
}

it("傾けた左右のカップでもスライダーを袖に接続し、3.5 mm端子の奥を筐体で塞がない", () => {
  stubCanvas();
  const model = createClearMgPro();
  model.group.updateMatrixWorld(true);
  for (const [side, name] of [
    [-1, "left"],
    [1, "right"],
  ] as const) {
    const cup = model.group.getObjectByName(
      `Clear Mg Professional ${name} ear cup`
    );
    const socket = cup?.getObjectByName(
      "Recessed detachable 3.5 mm cable socket"
    );
    if (!cup || !socket) {
      throw new Error("Missing ear cup or socket.");
    }
    const stem = model.group.worldToLocal(
      cup.localToWorld(new Vector3(0, 85.5, 5.1))
    );
    expect(stem.toArray()).toStrictEqual([
      expect.closeTo(side * 86.5),
      expect.closeTo(149),
      expect.closeTo(0),
    ]);
    const yoke = cup.getObjectByName(
      "Solid aluminum arch yoke and adjustment stem"
    );
    if (!(yoke instanceof Mesh) || !(yoke.geometry instanceof BufferGeometry)) {
      throw new Error("Missing aluminum yoke.");
    }
    const geometry: unknown = yoke.geometry;
    if (!(geometry instanceof BufferGeometry)) {
      throw new Error("Missing yoke geometry.");
    }
    const positions: unknown = geometry.getAttribute("position");
    if (!(positions instanceof BufferAttribute)) {
      throw new Error("Missing yoke positions.");
    }
    let inside = 0;
    let radialExtent = 0;
    let transverseExtent = 0;
    for (let index = 0; index < positions.count; index += 1) {
      const point = model.group
        .worldToLocal(
          yoke.localToWorld(new Vector3().fromBufferAttribute(positions, index))
        )
        .sub(new Vector3(side * 86.5, 152.5, 0))
        .applyAxisAngle(new Vector3(0, 0, 1), -side * 0.267);
      if (point.y > -7.5) {
        radialExtent = Math.max(radialExtent, Math.abs(point.x));
        transverseExtent = Math.max(transverseExtent, Math.abs(point.z));
        inside += 1;
      }
    }
    expect(inside).toBeGreaterThan(0);
    expect(radialExtent).toBeLessThan(5.5);
    expect(transverseExtent).toBeLessThan(14);
    const ray = new Raycaster(
      socket.localToWorld(new Vector3(0, 0, 2)),
      new Vector3(0, 0, -1).transformDirection(socket.matrixWorld)
    );
    const hit = ray
      .intersectObject(cup)
      .find(({ object }) => object.userData["castShadow"] !== false);
    expect(hit?.object.name).toBe("Deep 3.5 mm connector bore");
    expect(hit?.distance).toBeCloseTo(12.1);
  }
  expect(new Box3().setFromObject(model.group).min.y).toBeCloseTo(0);
  model.dispose();
});

it("パッドとヘッドバンドの穿孔の後ろにフォームを残し、背景の白い漏れを防ぐ", () => {
  stubCanvas();
  const model = createClearMgPro();
  model.group.updateMatrixWorld(true);
  const cup = model.group.getObjectByName("Clear Mg Professional left ear cup");
  if (!cup) {
    throw new Error("Missing ear cup.");
  }
  const assemblies = [
    {
      parent: cup,
      holes: clearMgPadPerforations(),
      core: "Dark memory foam inside the removable ear cushion",
      bore: "Recessed perforation walls and floors beneath the fabric openings",
    },
    {
      parent: model.group,
      holes: clearMgBandPerforations(),
      core: "Dark headband foam behind the perforated lining",
      bore: "Recessed bores beneath the perforated headband lining",
    },
  ];
  for (const { parent, holes, core: coreName, bore: boreName } of assemblies) {
    const core = parent.getObjectByName(coreName);
    const bores = parent.getObjectByName(boreName);
    if (!core || !(bores instanceof InstancedMesh)) {
      throw new Error("Missing foam core or perforation bores.");
    }
    expect(bores.count).toBe(holes.length);
    for (const hole of holes.filter((_, index) => index % 51 === 0)) {
      const ray = new Raycaster(
        parent.localToWorld(
          hole.position.clone().addScaledVector(hole.normal, 0.2)
        ),
        hole.normal.clone().negate().transformDirection(parent.matrixWorld),
        0,
        2.5
      );
      expect(
        ray.intersectObject(core).length,
        JSON.stringify({
          coreName,
          u: hole.u,
          v: hole.v,
          position: hole.position.toArray(),
          normal: hole.normal.toArray(),
        })
      ).toBeGreaterThan(0);
      const [floor] = ray.intersectObject(bores);
      expect(floor?.distance).toBeCloseTo(1.3, 1);
    }
  }
  const leather = model.group.getObjectByName(
    "Rounded leather headband with a continuous cross section"
  );
  if (
    !(leather instanceof Mesh) ||
    !(leather.material instanceof MeshPhysicalMaterial)
  ) {
    throw new Error("Missing leather material.");
  }
  expect(leather.material.map).not.toBe(leather.material.bumpMap);
  model.dispose();
});

it("メダリオンの三つのねじに実際の工具穴を作り、Focalの金属エンブレムに厚みを残す", () => {
  stubCanvas();
  const model = createClearMgPro();
  model.group.updateMatrixWorld(true);
  const cup = model.group.getObjectByName(
    "Clear Mg Professional right ear cup"
  );
  if (!cup) {
    throw new Error("Missing ear cup.");
  }
  for (const angle of [-Math.PI / 3, Math.PI / 3, Math.PI]) {
    const ray = new Raycaster(
      cup.localToWorld(
        new Vector3(Math.sin(angle) * 16.8, Math.cos(angle) * 16.8, 20)
      ),
      new Vector3(0, 0, -1).transformDirection(cup.matrixWorld)
    );
    const hit = ray
      .intersectObject(cup)
      .find(
        ({ object }) =>
          object instanceof Mesh &&
          object.material instanceof Material &&
          !object.material.transparent
      );
    expect(hit?.object.name).toBe("Dark floor beneath the screw drive");
  }
  const emblem = cup.getObjectByName(
    "Raised metal Focal emblem with the original continuous outline"
  );
  if (
    !(emblem instanceof Mesh) ||
    !(emblem.geometry instanceof BufferGeometry)
  ) {
    throw new Error("Missing metal emblem.");
  }
  emblem.geometry.computeBoundingBox();
  expect(emblem.geometry.boundingBox?.getSize(new Vector3()).z).toBeGreaterThan(
    0.4
  );
  model.dispose();
});

it("耳側の保護グリルを外側の金属グリルとは別の暗い仕上げにする", () => {
  stubCanvas();
  const model = createClearMgPro();
  const cup = model.group.getObjectByName("Clear Mg Professional left ear cup");
  const inner = cup?.getObjectByName("M-profile internal protective honeycomb");
  const outer = cup?.getObjectByName(
    "Convex graduated external honeycomb grille"
  );
  if (
    !(inner instanceof Mesh) ||
    !(outer instanceof Mesh) ||
    !(inner.material instanceof MeshStandardMaterial) ||
    !(outer.material instanceof MeshStandardMaterial)
  ) {
    throw new Error("Missing Clear Mg grille materials.");
  }
  expect(inner.material).not.toBe(outer.material);
  expect(inner.material.color.getHex()).toBeLessThan(
    outer.material.color.getHex()
  );
  model.dispose();
});
