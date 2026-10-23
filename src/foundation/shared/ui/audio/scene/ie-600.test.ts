import {
  Box3,
  BufferGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Raycaster,
  Vector3,
} from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createIe600 } from "./ie-600";
import { ie600Vent } from "./ie-600-vent";

afterEach(() => vi.unstubAllGlobals());

function noop() {}
function stubCanvas() {
  const context = {
    scale: noop,
    translate: noop,
    rotate: noop,
    fill: noop,
    fillRect: noop,
    strokeText: noop,
    fillText: noop,
    save: noop,
    restore: noop,
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
  vi.stubGlobal("Path2D", noop);
}

it("左右の通気孔とイヤーチップの格子から奥の暗い床まで見通せる", () => {
  stubCanvas();
  const model = createIe600();
  model.group.updateMatrixWorld(true);
  for (const channel of ["Left", "Right"]) {
    const shell = model.group.getObjectByName(`IE 600 ${channel} earpiece`);
    const nozzle = shell?.getObjectByName(
      "IE 600 angled acoustic nozzle and silicone ear tip"
    );
    if (!shell || !nozzle) {
      throw new Error("Missing IE 600 shell or nozzle.");
    }
    const ray = new Raycaster(
      shell.localToWorld(new Vector3(ie600Vent.x, ie600Vent.y, 8)),
      new Vector3(0, 0, -1).transformDirection(shell.matrixWorld)
    );
    expect(ray.intersectObject(shell)[0]?.object.name).toBe(
      "Dark floor inside the shell pressure vent"
    );
    expect(ray.intersectObject(shell)[0]?.distance).toBeCloseTo(
      8 - ie600Vent.floor
    );
    ray.set(
      nozzle.localToWorld(new Vector3(0, 0, 14)),
      new Vector3(0, 0, -1).transformDirection(nozzle.matrixWorld)
    );
    expect(ray.intersectObject(shell)[0]?.object.name).toBe(
      "Recessed acoustic foam behind the ear tip guard"
    );
    expect(ray.intersectObject(shell)[0]?.distance).toBeCloseTo(4.1);
  }
  expect(new Box3().setFromObject(model.group).min.y).toBeCloseTo(0);
  model.dispose();
});

it("外したMMCX端子には奥行きを残し、接続中のグリップと口元は隙間なく重ねる", () => {
  stubCanvas();
  const model = createIe600();
  model.group.updateMatrixWorld(true);
  const left = model.group
    .getObjectByName("IE 600 Left earpiece")
    ?.getObjectByName("Recessed Fidelity (+) MMCX connection");
  const right = model.group
    .getObjectByName("IE 600 Right earpiece")
    ?.getObjectByName("Recessed Fidelity (+) MMCX connection");
  if (!left || !right) {
    throw new Error("Missing MMCX assembly.");
  }
  const ray = new Raycaster(
    left.localToWorld(new Vector3(0, 0, 4)),
    new Vector3(0, 0, -1).transformDirection(left.matrixWorld)
  );
  const [hit] = ray.intersectObject(model.group);
  expect(hit?.object.name).toBe("Dark recessed MMCX socket floor");
  expect(hit?.distance).toBeCloseTo(5.6);
  const grip = right.getObjectByName(
    "Tapered moulded Fidelity MMCX cable grip"
  );
  const rim = right.getObjectByName("Recessed MMCX socket rim");
  if (
    !(grip instanceof Mesh) ||
    !(rim instanceof Mesh) ||
    !(grip.geometry instanceof BufferGeometry) ||
    !(rim.geometry instanceof BufferGeometry)
  ) {
    throw new Error("Missing MMCX grip or collar geometry.");
  }
  grip.geometry.computeBoundingBox();
  rim.geometry.computeBoundingBox();
  expect(
    (grip.geometry.boundingBox?.min.z ?? Infinity) + grip.position.z
  ).toBeLessThan(rim.geometry.boundingBox?.max.z ?? 0);
  model.dispose();
});

it("ケーブルの曲線ごとの微細テクスチャをモデルと一緒に解放する", () => {
  stubCanvas();
  const model = createIe600();
  const jacket = model.group.getObjectByName(
    "Shortened para aramid reinforced main cable translucent jacket"
  );
  if (
    !(jacket instanceof Mesh) ||
    !(jacket.material instanceof MeshPhysicalMaterial) ||
    !jacket.material.bumpMap
  ) {
    throw new Error("Missing cable jacket texture.");
  }
  const dispose = vi.fn<() => void>();
  jacket.material.bumpMap.addEventListener("dispose", dispose);
  model.dispose();
  expect(dispose).toHaveBeenCalledOnce();
});
