import { Box3, ExtrudeGeometry, Path, Shape, Vector3 } from "three";
import type { ModelParts } from "./parts";

function sidePlate(parts: ModelParts, x: number) {
  const front = -128;
  const rear = 115.75;
  const bottom = 12;
  const top = 84.5;
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
    parts.silver,
    [x > 0 ? 137.8 : -144.2, 0, 2.75],
    "Aluminium side cheek with carrying slot"
  );
  side.rotation.y = Math.PI / 2;
  for (const y of [20, 75]) {
    for (const z of [-96, 72]) {
      parts.screw([x > 0 ? 145.05 : -145.05, y, z], x > 0 ? "right" : "left");
    }
  }
}

function pinPointFeet(parts: ModelParts) {
  for (const [x, z] of [
    [-104, 88],
    [104, 88],
    [0, -83],
  ] as const) {
    const upper = parts.lathe(
      [
        [0, 5],
        [19.8, 5],
        [20.5, 5.5],
        [20.5, 11.5],
        [19.8, 12],
        [0, 12],
      ],
      [x, 0, z],
      parts.footMetal,
      "Pin-point foot upper cup"
    );
    upper.rotation.x = 0;
    const lower = parts.lathe(
      [
        [0, 0],
        [19.8, 0],
        [20.5, 0.4],
        [20.5, 3],
        [19.8, 3.4],
        [0, 3.4],
      ],
      [x, 0, z],
      parts.footMetal,
      "Pin-point foot lower cup"
    );
    lower.rotation.x = 0;
    const flange = parts.lathe(
      [
        [0, 3.4],
        [7.8, 3.4],
        [7.8, 4.5],
        [9, 4.5],
        [9, 4.8],
        [0, 4.8],
      ],
      [x, 0, z],
      parts.steel,
      "Pin-point support flange"
    );
    flange.rotation.x = 0;
    const spike = parts.lathe(
      [
        [0, 4.8],
        [2.3, 5.6],
        [2.3, 6],
        [0, 6],
      ],
      [x, 0, z],
      parts.turned,
      "Pin-point support spike"
    );
    spike.rotation.x = 0;
  }
}

export function createReferenceChassis(parts: ModelParts) {
  parts.box(
    [272, 64, 221],
    [0, 46, 0],
    parts.black,
    "Internal chassis shadow",
    0.8
  );
  parts.box(
    [274, 1.5, 225],
    [0, 81.25, 1],
    parts.silver,
    "Brushed aluminium top cover",
    0.4
  );
  parts.box(
    [274, 1.6, 224],
    [0, 13.3, 0.5],
    parts.rear,
    "Bottom chassis plate",
    0.3
  );
  for (const x of [-141, 141]) {
    sidePlate(parts, x);
    parts.box(
      [0.6, 66, 224],
      [Math.sign(x) * 136.8, 47, 0],
      parts.steel,
      "Side-cover seam",
      0.1
    );
    for (const z of [-101, 0, 101]) {
      parts.screw([Math.sign(x) * 124, 82.25, z], "top");
    }
  }
  parts.screw([0, 82.25, 101], "top");
  pinPointFeet(parts);
  for (const x of [-129, 129]) {
    for (const z of [-99, -25, 50, 101]) {
      parts.screw([x, 12.2, z], "bottom", true);
    }
  }
}

export function fitReferenceDimensions(parts: ModelParts) {
  const bounds = new Box3().setFromObject(parts.root);
  const size = bounds.getSize(new Vector3());
  parts.root.scale.set(290 / size.x, 84.5 / size.y, 248.7 / size.z);
  parts.root.position.y = -bounds.min.y * parts.root.scale.y;
}
