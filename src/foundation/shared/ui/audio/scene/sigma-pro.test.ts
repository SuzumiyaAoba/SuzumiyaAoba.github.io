import {
  Box3,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Raycaster,
  Texture,
  Vector3,
} from "three";
import { expect, it } from "vite-plus/test";
import type { Object3D } from "three";
import { createSigmaPro } from "./sigma-pro";
import { sigmaLetteringGeometry } from "./sigma-pro-lettering";
import { SIGMA_BOARD, sigmaBoardPoint } from "./sigma-pro-board-parts";
import { SIGMA_FRONT } from "./sigma-pro-geometry";

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

it("builds the complete portable model without any bitmap textures", () => {
  const model = createSigmaPro();
  let texturedMaterials = 0;
  model.group.traverse((part) => {
    if (!isMesh(part)) {
      return;
    }
    const materials = Array.isArray(part.material)
      ? part.material
      : [part.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) {
          texturedMaterials += 1;
        }
      }
    }
  });
  expect(texturedMaterials).toBe(0);
  model.dispose();
});

it("raises the amplifier transistors and capacitors above the board as separate solid parts", () => {
  expect.hasAssertions();
  const model = createSigmaPro();
  const matrix = new Matrix4();
  const position = new Vector3();
  let transistors = 0;
  let capacitors = 0;
  const transistorPositions: number[] = [];
  const transistorHeights: number[] = [];
  model.group.traverse((part) => {
    if (!(part instanceof InstancedMesh)) {
      return;
    }
    if (part.name.startsWith("Discrete amplifier power transistor:")) {
      transistors += part.count;
      for (let index = 0; index < part.count; index += 1) {
        part.getMatrixAt(index, matrix);
        position.setFromMatrixPosition(matrix);
        transistorPositions.push(position.y);
        transistorHeights.push(matrix.elements[5] ?? 0);
      }
    }
    if (part.name.startsWith("Multilayer ceramic capacitor:")) {
      capacitors += part.count;
    }
  });
  expect(transistors).toBe(8);
  expect(capacitors).toBeGreaterThan(50);
  for (const y of transistorPositions) {
    expect(y).toBeGreaterThan(SIGMA_BOARD.top + 0.5);
  }
  for (const height of transistorHeights) {
    expect(height).toBeCloseTo(1.05);
  }
  model.dispose();
});

it("drills the plated vias all the way through the PCB substrate", () => {
  const model = createSigmaPro();
  model.group.updateMatrixWorld(true);
  const board = model.group.getObjectByName(
    "Black solder-mask PCB with drilled through vias"
  );
  expect(board).toBeInstanceOf(Mesh);
  if (!board) {
    throw new Error("Missing PCB substrate.");
  }
  expect(new Box3().setFromObject(board).max.y).toBeCloseTo(SIGMA_BOARD.top);
  const [x, z] = sigmaBoardPoint(194, 205);
  const ray = new Raycaster(new Vector3(x, 25, z), new Vector3(0, -1, 0));
  expect(ray.intersectObject(board)).toHaveLength(0);
  ray.set(new Vector3(x + 0.4, 25, z), new Vector3(0, -1, 0));
  expect(ray.intersectObject(board).length).toBeGreaterThan(0);
  model.dispose();
});

it("preserves the opening inside vector letter outlines", () => {
  const geometry = sigmaLetteringGeometry("O", 2);
  const material = new MeshBasicMaterial();
  const letter = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 1), new Vector3(0, 0, -1));
  expect(ray.intersectObject(letter)).toHaveLength(0);
  ray.set(new Vector3(0, 0.97, 1), new Vector3(0, 0, -1));
  expect(ray.intersectObject(letter).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("keeps the machined socket recesses visible and the output legends above the bottom cover", () => {
  const model = createSigmaPro();
  model.group.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(-22, 10.5, 100), new Vector3(0, 0, -1));
  const surround = ray
    .intersectObject(model.group)
    .find((hit) => hit.object.userData["castShadow"] !== false);
  expect(surround?.object.name).toBe("6.35mm SE conical CNC counterbore");
  expect(surround?.point.z).toBeLessThan(SIGMA_FRONT + 0.2);
  const bottom = model.group.getObjectByName("Bevelled aluminium bottom cover");
  const front = model.group.getObjectByName(
    "Headphone panel with three bored sockets and recessed volume-knob seat"
  );
  if (!bottom || !front) {
    throw new Error("Missing SIGMA enclosure panels.");
  }
  expect(new Box3().setFromObject(bottom).max.z).toBeLessThan(
    new Box3().setFromObject(front).min.z
  );
  const size = new Box3().setFromObject(model.group).getSize(new Vector3());
  expect(Math.abs(size.x - 85)).toBeLessThan(0.1);
  expect(Math.abs(size.z - 155.7)).toBeLessThan(0.2);
  ray.set(new Vector3(-28, 10.5, 100), new Vector3(0, 0, -1));
  const floor = ray
    .intersectObject(model.group)
    .find((hit) => hit.object.userData["castShadow"] !== false);
  expect(floor?.object.name).toBe("6.35mm SE dark socket interior");
  expect(floor?.point.z).toBeCloseTo(SIGMA_FRONT + 0.08 - 11.2);
  model.dispose();
});

it("recesses USB-C contacts, the RCA receptacle and analogue sockets behind open rear bores", () => {
  const model = createSigmaPro();
  model.group.updateMatrixWorld(true);
  const rear = model.group.getObjectByName(
    "Digital, analogue and charging inputs aligned to the Questyle brochure"
  );
  if (!rear) {
    throw new Error("Missing SIGMA input panel.");
  }
  for (const [x, y, name, depth] of [
    [-33.1, 8.6, "Dark USB-C socket interior", -5.4],
    [-23.6, 8.6, "Dark USB-C socket interior", -5.4],
    [-10.7, 8.6, "Open RCA centre contact", -3.33],
    [19, 12.2, "4.4mm dark socket interior", -10.34],
  ] as const) {
    const ray = new Raycaster(
      rear.localToWorld(new Vector3(x, y, 40)),
      new Vector3(0, 0, -1).transformDirection(rear.matrixWorld)
    );
    const floor = ray
      .intersectObject(model.group)
      .find((hit) => hit.object.userData["castShadow"] !== false);
    expect(floor?.object.name).toBe(name);
    expect(floor && rear.worldToLocal(floor.point).z).toBeCloseTo(depth);
  }
  model.dispose();
});

it("separates clear glass from the circuit and display while retaining four operating indicators", () => {
  const model = createSigmaPro();
  const boardGlass = model.group.getObjectByName(
    "Flush clear glass with physical reflections"
  );
  const screenGlass = model.group.getObjectByName("Flush glossy OLED glass");
  for (const glass of [boardGlass, screenGlass]) {
    if (
      !(glass instanceof Mesh) ||
      !(glass.material instanceof MeshPhysicalMaterial)
    ) {
      throw new Error("Missing physical SIGMA cover glass.");
    }
    expect(glass.material.transmission).toBe(1);
    expect(glass.userData["castShadow"]).toBe(false);
  }
  const rate = model.group.getObjectByName("OLED vector glyphs: 768000");
  if (!rate || !screenGlass || !boardGlass) {
    throw new Error("Missing SIGMA display layers.");
  }
  expect(new Box3().setFromObject(screenGlass).min.y).toBeGreaterThan(
    new Box3().setFromObject(rate).max.y + 0.3
  );
  expect(new Box3().setFromObject(boardGlass).min.y).toBeGreaterThan(
    SIGMA_BOARD.top + 2
  );
  let indicators = 0;
  model.group.traverse((part) => {
    if (
      part instanceof InstancedMesh &&
      part.name.startsWith("Red current-mode amplifier operating indicator:")
    ) {
      indicators += part.count;
    }
  });
  expect(indicators).toBe(4);
  model.dispose();
});

it("seats the side screws in open counterbores instead of drawing a cross over a solid side wall", () => {
  const model = createSigmaPro();
  model.group.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(60, 6.3, 60), new Vector3(-1, 0, 0));
  const [hit] = ray.intersectObject(model.group);
  expect(hit?.object.name).toBe(
    "Beveled screw head with a recessed Phillips drive"
  );
  expect(hit?.point.x).toBeLessThan(42.5);
  model.dispose();
});
