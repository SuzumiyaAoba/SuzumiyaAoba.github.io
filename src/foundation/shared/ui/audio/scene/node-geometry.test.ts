import { Box3, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { afterEach, expect, it, vi } from "vitest";
import {
  nodeFrontGeometry,
  nodeRearPanelGeometry,
  nodeShellGeometry,
  nodeVentGeometry,
} from "./node-geometry";
import { createNodeParts } from "./node-parts";
import { createNodeRear } from "./node-rear";
import { createNodeN130 } from "./node-n130";
import { createNodeTop } from "./node-top";

afterEach(() => vi.unstubAllGlobals());

function noop() {}

function stubLetteringCanvas() {
  const context = {
    scale: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    closePath: noop,
    stroke: noop,
    fillRect: noop,
    fillText: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
}

it("筐体の天面と側面を滑らかな稜線でつなぎ、背面パネルの後ろを開ける", () => {
  const geometry = nodeShellGeometry(true);
  const material = new MeshBasicMaterial();
  const shell = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(95, 80, 0), new Vector3(0, -1, 0));
  const [top] = ray.intersectObject(shell);
  expect(top?.point.y).toBeCloseTo(46);
  expect(top?.normal?.y).toBeCloseTo(1);
  ray.set(new Vector3(150, 45 + Math.SQRT1_2, 0), new Vector3(-1, 0, 0));
  const [edge] = ray.intersectObject(shell);
  expect(edge?.point.x).toBeCloseTo(109 + Math.SQRT1_2, 2);
  expect(edge?.normal?.x).toBeCloseTo(Math.SQRT1_2, 2);
  expect(edge?.normal?.y).toBeCloseTo(Math.SQRT1_2, 2);
  ray.set(new Vector3(27.5, 33, -100), new Vector3(0, 0, 1));
  expect(ray.intersectObject(shell)).toHaveLength(0);
  ray.ray.origin.y = 43;
  expect(ray.intersectObject(shell).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("前面ジャックと背面の全接続端子を筐体で塞がない", () => {
  const front = nodeFrontGeometry();
  const rear = nodeRearPanelGeometry();
  const material = new MeshBasicMaterial();
  const face = new Mesh(front, material);
  const panel = new Mesh(rear, material);
  const ray = new Raycaster(new Vector3(0, 15, 10), new Vector3(0, 0, -1));
  expect(ray.intersectObject(face)).toHaveLength(0);
  ray.ray.origin.x = 3;
  expect(ray.intersectObject(face).length).toBeGreaterThan(0);
  for (const [x, y] of [
    [-85, 25],
    [-70, 25],
    [-54, 25],
    [-39, 25],
    [-23.5, 25],
    [-9.5, 20.9],
    [2.5, 20.9],
    [12.5, 20.9],
    [27.5, 33],
    [27.5, 21.4],
    [54, 22.5],
    [81.5, 23.8],
  ] as const) {
    ray.ray.origin.set(x, y, 10);
    expect(ray.intersectObject(panel)).toHaveLength(0);
  }
  front.dispose();
  rear.dispose();
  material.dispose();
});

it("タッチパネルの通気穴を貫通させ、外周の縁を途切れさせない", () => {
  const geometry = nodeVentGeometry();
  const material = new MeshBasicMaterial();
  const vent = new Mesh(geometry, material);
  const ray = new Raycaster(
    new Vector3(68.25, Math.sqrt(3) * 0.65, 5),
    new Vector3(0, 0, -1)
  );
  expect(ray.intersectObject(vent)).toHaveLength(0);
  ray.ray.origin.set(71.8, 0, 5);
  expect(ray.intersectObject(vent).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("USB・HDMI・電源・RCA の開口から奥の床まで見通せる", () => {
  const parts = createNodeParts();
  createNodeRear({ ...parts, print: () => new Mesh(undefined, parts.black) });
  parts.root.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, 1));
  for (const [x, y, expected] of [
    [27.5, 19.6, "LAN/USB recessed interior"],
    [54, 24.6, "Recessed HDMI socket interior"],
    [81.5, 23.8, "Figure-eight inlet interior"],
    [2.5, 20.9, "Deep 3.5 mm input/trigger jack"],
    [-85, 25, "RCA female socket floor"],
  ] as const) {
    ray.ray.origin.set(-x, y, -90);
    const [hit] = ray.intersectObject(parts.root);
    expect(hit?.object.name).toBe(expected);
  }
  parts.dispose();
});

it("公表寸法を不自然な縮尺補正なしに再現し、筐体が端子の奥を塞がない", () => {
  stubLetteringCanvas();
  const model = createNodeN130();
  const bounds = new Box3().setFromObject(model.group);
  const size = bounds.getSize(new Vector3());
  expect(size.x).toBeCloseTo(220);
  expect(size.y).toBeCloseTo(46);
  expect(size.z).toBeCloseTo(146);
  expect(bounds.min.y).toBeCloseTo(0);
  for (const scale of model.group.scale.toArray()) {
    expect(scale).toBeGreaterThan(0.995);
    expect(scale).toBeLessThan(1.005);
  }
  const rear = model.group.getObjectByName("NODE N130 rear connections");
  if (!rear) {
    throw new Error("Missing NODE rear assembly.");
  }
  const origin = rear.localToWorld(new Vector3(27.5, 19.6, 30));
  const direction = new Vector3(0, 0, -1).transformDirection(rear.matrixWorld);
  const ray = new Raycaster(origin, direction);
  // 透明な印字面の空白部分は Raycaster が alpha を判定しないため除外する。
  const usb = ray
    .intersectObject(model.group)
    .find((hit) => hit.object.userData["castShadow"] !== false);
  expect(usb?.object.name).toBe("LAN/USB recessed interior");
  const rimOrigin = rear.localToWorld(new Vector3(101.5, 40.5, 30));
  ray.ray.origin.copy(rimOrigin);
  expect(ray.intersectObject(model.group).length).toBeGreaterThan(0);
  ray.set(new Vector3(108, -5, 0), new Vector3(0, 1, 0));
  const [underside] = ray.intersectObject(model.group);
  expect(underside?.object.name).toBe("Molded underside return");
  model.dispose();
});

it("通気板をポケットの床で埋めず、穿孔の奥に暗い空間を残す", () => {
  const parts = createNodeParts();
  createNodeTop({ ...parts, print: () => new Mesh(undefined, parts.black) });
  parts.root.updateMatrixWorld(true);
  const ray = new Raycaster(
    new Vector3(68.25, 60, -Math.sqrt(3) * 0.65),
    new Vector3(0, -1, 0)
  );
  const [hole] = ray.intersectObject(parts.root);
  expect(hole?.object.name).toBe("Recessed touch-panel pocket");
  ray.ray.origin.set(69.4, 60, -1.4);
  const [web] = ray.intersectObject(parts.root);
  expect(web?.object.name).toBe(
    "Continuous perforated touch-panel ventilation surround"
  );
  expect((web?.point.y ?? 0) - (hole?.point.y ?? 0)).toBeGreaterThan(0.4);
  parts.dispose();
});
