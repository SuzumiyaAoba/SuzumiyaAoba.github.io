import {
  Box3,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  Path,
  Shape,
  Vector3,
} from "three";
import type { ModelParts } from "./parts";
import { createReferenceFeet } from "./reference-feet";
import { applySurfaceFinish } from "./surface-finish";
import { createReferenceBottom } from "./reference-bottom";
import type { BottomMount } from "./reference-bottom";

function sidePlate(
  parts: ModelParts,
  x: number,
  material: MeshPhysicalMaterial
) {
  const front = -128;
  const rear = 115.75;
  const bottom = 12.65;
  const top = 83.85;
  const cornerRadius = 2.6;
  const plate = new Shape();
  plate.moveTo(front + cornerRadius, bottom);
  plate.lineTo(rear - cornerRadius, bottom);
  plate.quadraticCurveTo(rear, bottom, rear, bottom + cornerRadius);
  plate.lineTo(rear, top - cornerRadius);
  plate.quadraticCurveTo(rear, top, rear - cornerRadius, top);
  plate.lineTo(front + cornerRadius, top);
  plate.quadraticCurveTo(front, top, front, top - cornerRadius);
  plate.lineTo(front, bottom + cornerRadius);
  plate.quadraticCurveTo(front, bottom, front + cornerRadius, bottom);
  plate.closePath();

  // 両機種とも、前面より手前に張り出した側板に縦長の貫通穴がある。
  const slotCenter = -120;
  const slotBottom = 21.25;
  const slotTop = 73.25;
  const slotRadius = 3.7;
  const handle = new Path();
  handle.moveTo(slotCenter - slotRadius, slotBottom + slotRadius);
  handle.lineTo(slotCenter - slotRadius, slotTop - slotRadius);
  handle.absarc(slotCenter, slotTop - slotRadius, slotRadius, Math.PI, 0, true);
  handle.lineTo(slotCenter + slotRadius, slotBottom + slotRadius);
  handle.absarc(
    slotCenter,
    slotBottom + slotRadius,
    slotRadius,
    0,
    Math.PI,
    true
  );
  handle.closePath();
  plate.holes.push(handle);
  for (const y of [20, 75]) {
    for (const z of [-96, 72]) {
      const seat = new Path();
      seat.absarc(2.75 - z, y, 1.9, 0, Math.PI * 2, true);
      plate.holes.push(seat);
    }
  }
  const geometry = new ExtrudeGeometry(plate, {
    depth: 6.4,
    bevelEnabled: true,
    bevelSize: 0.65,
    bevelThickness: 0.8,
    bevelSegments: 5,
    curveSegments: 32,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      (positions.getX(index) + 128) / 243.75,
      (positions.getY(index) - 12) / 72.5
    );
  }
  const side = parts.mesh(
    geometry,
    material,
    [x > 0 ? 137.8 : -144.2, 0, 2.75],
    "Aluminium side cheek with carrying slot"
  );
  side.rotation.y = Math.PI / 2;
  for (const y of [20, 75]) {
    for (const z of [-96, 72]) {
      parts.screw([x > 0 ? 144.65 : -144.65, y, z], x > 0 ? "right" : "left");
    }
  }
}

function topCover(parts: ModelParts) {
  const cover = new Shape();
  cover.moveTo(-137, -112.5);
  cover.lineTo(137, -112.5);
  cover.lineTo(137, 112.5);
  cover.lineTo(-137, 112.5);
  cover.closePath();
  const fasteners = [
    [-124, -101],
    [-124, 0],
    [-124, 101],
    [124, -101],
    [124, 0],
    [124, 101],
    [0, 101],
  ] as const;
  for (const [x, z] of fasteners) {
    const hole = new Path();
    hole.absarc(x, 1 - z, 1.85, 0, Math.PI * 2, true);
    cover.holes.push(hole);
  }
  const lid = parts.mesh(
    new ExtrudeGeometry(cover, {
      depth: 1.2,
      bevelEnabled: true,
      bevelSize: 0.15,
      bevelThickness: 0.15,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    parts.silver,
    [0, 80.65, 1],
    "Brushed aluminium lid with countersunk fastener bores"
  );
  lid.rotation.x = -Math.PI / 2;
  for (const [x, z] of fasteners) {
    parts.screw([x, 81.66, z], "top");
  }
}

export function createReferenceChassis(
  parts: ModelParts,
  bottomMounts: readonly BottomMount[] = []
) {
  // 空洞を保ち、メーターや端子の凹部へ内部ブロックを突き出さない。
  for (const z of [-98, 100]) {
    parts.box(
      [268, 62, 1],
      [0, 46, z],
      parts.black,
      "Recessed internal shield",
      0.3
    );
  }
  topCover(parts);
  createReferenceBottom(parts, bottomMounts);
  const sideFinish = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0xc1_c4_c7,
      metalness: 0.68,
      roughness: 0.44,
      envMapIntensity: 0.9,
    }),
    { scale: [20, 20, 20], relief: 0.002, roughness: 0.04 }
  );
  for (const x of [-141, 141]) {
    sidePlate(parts, x, sideFinish);
    parts.box(
      [0.6, 66, 224],
      [Math.sign(x) * 136.8, 47, 0],
      parts.steel,
      "Side-cover seam",
      0.1
    );
  }
  createReferenceFeet(parts);
  for (const x of [-129, 129]) {
    for (const z of [-99, -25, 50, 101]) {
      parts.screw([x, 12.27, z], "bottom", true);
    }
  }
}

export function fitReferenceDimensions(parts: ModelParts) {
  const bounds = new Box3().setFromObject(parts.root);
  const size = bounds.getSize(new Vector3());
  parts.root.scale.set(290 / size.x, 84.5 / size.y, 248.7 / size.z);
  parts.root.position.y = -bounds.min.y * parts.root.scale.y;
}
