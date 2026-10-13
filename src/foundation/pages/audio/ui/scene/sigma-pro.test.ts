import {
  Box3,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Texture,
  Vector3,
} from "three";
import { expect, it } from "vite-plus/test";
import type { Object3D } from "three";
import { createSigmaPro } from "./sigma-pro";
import { sigmaLetteringGeometry } from "./sigma-pro-lettering";
import { SIGMA_BOARD, sigmaBoardPoint } from "./sigma-pro-board-parts";

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
