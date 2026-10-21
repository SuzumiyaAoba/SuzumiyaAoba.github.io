import { BoxGeometry, CircleGeometry, Object3D, RingGeometry } from "three";
import type { BufferGeometry, Material, Matrix4 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { sigmaLetteringGeometry } from "./sigma-pro-lettering";
import type { SigmaParts } from "./sigma-pro-parts";
import { SIGMA_WINDOW } from "./sigma-pro-geometry";

export const SIGMA_BOARD = {
  width: SIGMA_WINDOW.width - 0.4,
  depth: SIGMA_WINDOW.depth - 0.4,
  top: 17.15,
  thickness: 0.85,
  bevel: 0.025,
  referenceWidth: 1024,
  referenceHeight: 1536,
} as const;

/** Coordinates measured from Questyle's top view; only numeric layout data is used. */
export function sigmaBoardPoint(x: number, y: number) {
  return [
    (x / SIGMA_BOARD.referenceWidth - 0.5) * SIGMA_BOARD.width,
    SIGMA_WINDOW.z +
      (y / SIGMA_BOARD.referenceHeight - 0.5) * SIGMA_BOARD.depth,
  ] as const;
}

type Batch = {
  geometry: BufferGeometry;
  material: Material;
  matrices: Matrix4[];
  name: string;
};

export function createSigmaBoardParts(parts: SigmaParts) {
  const batches = new Map<string, Batch>();
  const lettering = new Map<Material, BufferGeometry[]>();
  const transform = new Object3D();
  const batch = (
    key: string,
    material: Material,
    geometry: () => BufferGeometry
  ) => {
    let value = batches.get(key);
    if (!value) {
      value = { geometry: geometry(), material, matrices: [], name: key };
      batches.set(key, value);
    }
    return value;
  };
  const box = (
    x: number,
    y: number,
    width: number,
    depth: number,
    height: number,
    material: Material,
    name: string,
    lift = 0,
    rounded = true,
    angle = 0
  ) => {
    const [px, pz] = sigmaBoardPoint(x, y);
    transform.position.set(px, SIGMA_BOARD.top + height / 2 + lift, pz);
    transform.rotation.set(0, angle, 0);
    transform.scale.set(
      (width / SIGMA_BOARD.referenceWidth) * SIGMA_BOARD.width,
      height,
      (depth / SIGMA_BOARD.referenceHeight) * SIGMA_BOARD.depth
    );
    transform.updateMatrix();
    batch(`${name}:${material.uuid}`, material, () =>
      rounded
        ? new RoundedBoxGeometry(1, 1, 1, 1, 0.09)
        : new BoxGeometry(1, 1, 1)
    ).matrices.push(transform.matrix.clone());
  };
  const trace = (
    points: readonly (readonly [number, number])[],
    width = 1.7,
    material: Material = parts.traces,
    lift = 0.008
  ) => {
    for (let index = 1; index < points.length; index += 1) {
      const start = points[index - 1];
      const end = points[index];
      if (!(start && end)) {
        continue;
      }
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const xScale = SIGMA_BOARD.width / SIGMA_BOARD.referenceWidth;
      const zScale = SIGMA_BOARD.depth / SIGMA_BOARD.referenceHeight;
      box(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        Math.hypot(dx * xScale, dy * zScale) / xScale,
        width,
        0.012,
        material,
        material === parts.silkscreen
          ? "Geometric PCB silkscreen"
          : "Copper routing under solder mask",
        lift,
        false,
        -Math.atan2(dy * zScale, dx * xScale)
      );
    }
  };
  const outline = (x: number, y: number, width: number, depth: number) => {
    trace(
      [
        [x - width / 2, y - depth / 2],
        [x + width / 2, y - depth / 2],
        [x + width / 2, y + depth / 2],
        [x - width / 2, y + depth / 2],
        [x - width / 2, y - depth / 2],
      ],
      1.1,
      parts.silkscreen,
      0.024
    );
  };
  const passive = (
    x: number,
    y: number,
    width: number,
    depth: number,
    capacitor = false
  ) => {
    const alongX = width > depth;
    const lead = Math.min(width, depth) * 0.32;
    outline(x, y, width + 6, depth + 5);
    for (const side of [-1, 1]) {
      const px = x + (alongX ? (side * (width - lead)) / 2 : 0);
      const py = y + (alongX ? 0 : (side * (depth - lead)) / 2);
      box(
        px,
        py,
        alongX ? lead + 3 : width + 2,
        alongX ? depth + 2 : lead + 3,
        0.1,
        parts.solder,
        "Reflow solder fillets"
      );
      box(
        px,
        py,
        alongX ? lead : width,
        alongX ? depth : lead,
        0.35,
        parts.solder,
        "Tinned passive end caps",
        0.1
      );
    }
    box(
      x,
      y,
      alongX ? width - lead : width,
      alongX ? depth : depth - lead,
      capacitor ? 0.42 : 0.3,
      capacitor ? parts.ceramic : parts.packageSurface,
      capacitor ? "Multilayer ceramic capacitor" : "Thick-film chip resistor",
      0.12
    );
    if (!capacitor && width > 17) {
      box(
        x,
        y,
        alongX ? 4 : width * 0.7,
        alongX ? depth * 0.65 : 4,
        0.006,
        parts.packageInk,
        "Resistor top identification stripe",
        0.425,
        false
      );
    }
  };
  const lead = (x: number, y: number, acrossX: boolean, direction: number) => {
    box(
      x,
      y,
      acrossX ? 10 : 2,
      acrossX ? 2 : 10,
      0.12,
      parts.solder,
      "IC solder lands",
      0.015
    );
    box(
      x,
      y,
      acrossX ? 6 : 1.7,
      acrossX ? 1.7 : 6,
      0.11,
      parts.solder,
      "Gull-wing lead toe",
      0.12
    );
    box(
      x - (acrossX ? direction * 3 : 0),
      y - (acrossX ? 0 : direction * 3),
      1.7,
      1.7,
      0.37,
      parts.solder,
      "Gull-wing lead riser",
      0.12
    );
  };
  const chip = (
    x: number,
    y: number,
    width: number,
    depth: number,
    pins: number,
    name: string,
    layout: "quad" | "dual" | "sot23" = "quad"
  ) => {
    outline(x, y, width + 6, depth + 6);
    box(x, y, width, depth, 0.72, parts.packageSurface, name, 0.12);
    if (layout === "sot23") {
      lead(x - width / 2 - 5, y - depth * 0.3, true, -1);
      lead(x - width / 2 - 5, y + depth * 0.3, true, -1);
      lead(x + width / 2 + 5, y, true, 1);
      return;
    }
    for (let pin = 0; pin < pins; pin += 1) {
      const span = (pin / (pins - 1) - 0.5) * 0.8;
      for (const side of [-1, 1]) {
        if (layout === "quad") {
          lead(x + width * span, y + side * (depth / 2 + 5), false, side);
        }
        lead(x + side * (width / 2 + 5), y + depth * span, true, side);
      }
    }
    box(
      x - width * 0.35,
      y - depth * 0.35,
      3,
      3,
      0.007,
      parts.packageInk,
      "Moulded IC pin-one marker",
      0.845
    );
  };
  const text = (
    value: string,
    x: number,
    y: number,
    height: number,
    lift = 0.87,
    angle = 0,
    material: Material = parts.packageInk
  ) => {
    const [px, pz] = sigmaBoardPoint(x, y);
    const geometry = sigmaLetteringGeometry(value, height);
    geometry.rotateX(-Math.PI / 2);
    geometry.rotateY(angle);
    geometry.translate(px, SIGMA_BOARD.top + lift, pz);
    const outlines = lettering.get(material) ?? [];
    outlines.push(geometry);
    lettering.set(material, outlines);
  };
  const via = (x: number, y: number) => {
    const [px, pz] = sigmaBoardPoint(x, y);
    transform.position.set(px, SIGMA_BOARD.top + 0.023, pz);
    transform.rotation.set(-Math.PI / 2, 0, 0);
    transform.scale.setScalar(1);
    transform.updateMatrix();
    batch(
      "Plated through-hole annuli",
      parts.solder,
      () => new RingGeometry(0.12, 0.24, 12)
    ).matrices.push(transform.matrix.clone());
  };
  const glassDot = (x: number, y: number, radius: number) => {
    const [px, pz] = sigmaBoardPoint(x, y);
    transform.position.set(px, 19.555, pz);
    transform.rotation.set(-Math.PI / 2, 0, 0);
    transform.scale.setScalar(radius);
    transform.updateMatrix();
    batch(
      "Individual ceramic frit dots beneath glass",
      parts.insulator,
      () => new CircleGeometry(1, 10)
    ).matrices.push(transform.matrix.clone());
  };
  return {
    box,
    trace,
    outline,
    passive,
    chip,
    text,
    via,
    glassDot,
    finish() {
      for (const { geometry, material, matrices, name } of batches.values()) {
        const mesh = parts.instanced(geometry, material, matrices.length, name);
        for (const [index, matrix] of matrices.entries()) {
          mesh.setMatrixAt(index, matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        if (
          material === parts.traces ||
          material === parts.silkscreen ||
          name === "Individual ceramic frit dots beneath glass"
        ) {
          mesh.userData["castShadow"] = false;
        }
      }
      for (const [material, sources] of lettering) {
        const geometry = mergeGeometries(sources);
        for (const source of sources) {
          source.dispose();
        }
        const mesh = parts.mesh(
          geometry,
          material,
          [0, 0, 0],
          "Solid IC and PCB lettering outlines"
        );
        mesh.userData["castShadow"] = false;
      }
    },
  };
}

export type SigmaBoardParts = ReturnType<typeof createSigmaBoardParts>;
