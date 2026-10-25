import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  MathUtils,
  Path,
  Shape,
  ShapeGeometry,
  ShapeUtils,
  Vector2,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { openIe600Vent } from "./ie-600-vent";

const socketCenter = new Vector2(4.1, 10.8);
const socketDirection = new Vector2(-0.4, 1).normalize();
const socketAcross = new Vector2(socketDirection.y, -socketDirection.x);
const neckRadius = 2.65;

function socketOutlinePoint(along: number, across: number) {
  return socketCenter
    .clone()
    .addScaledVector(socketDirection, along)
    .addScaledVector(socketAcross, across);
}

/** 外形・部品寸法はメーカーの各方向の写真からの推定。座標の単位は mm。 */
function shellOutline() {
  const innerShoulder = socketOutlinePoint(-4, -neckRadius);
  const innerMouth = socketOutlinePoint(0.5, -neckRadius);
  const outerMouth = socketOutlinePoint(0.5, neckRadius);
  const outerShoulder = socketOutlinePoint(-4, neckRadius);
  const outline = new Shape();
  outline.moveTo(-6, -7.2);
  outline.bezierCurveTo(-10.2, -6.6, -11.4, -2.8, -9.5, 1.2);
  outline.bezierCurveTo(-8.3, 4.2, -4.8, 4.9, -1.2, 3.8);
  outline.bezierCurveTo(0.4, 3.4, 1.7, 5.2, innerShoulder.x, innerShoulder.y);
  outline.lineTo(innerMouth.x, innerMouth.y);
  outline.lineTo(outerMouth.x, outerMouth.y);
  outline.lineTo(outerShoulder.x, outerShoulder.y);
  outline.bezierCurveTo(8.4, 5.8, 8.2, 3.2, 9.1, 0);
  outline.bezierCurveTo(10.6, -5.4, 8.4, -7.6, 4.7, -7.8);
  outline.bezierCurveTo(1.8, -8.4, -2.8, -8.2, -6, -7.2);
  outline.closePath();
  return outline;
}

function badgeWeight(x: number, y: number) {
  const radius = 1.3;
  const dx = Math.abs(x + 2.2) - 5.3 + radius;
  const dy = Math.abs(y + 1.1) - 3.4 + radius;
  const distance =
    Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
    Math.min(Math.max(dx, dy), 0) -
    radius;
  return 1 - MathUtils.smoothstep(distance, -0.3, 0.9);
}

function rearFacetWeight(x: number, y: number) {
  const dx = Math.abs(x - 0.8 + y * 0.2) - 5.2;
  const dy = Math.abs(y + 1.1) - 4.2;
  const distance =
    Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
    Math.min(Math.max(dx, dy), 0) -
    0.8;
  return 1 - MathUtils.smoothstep(distance, -0.2, 0.85);
}

/** 押し出し板ではなく、表裏が連続した丸いシェル。ロゴ面の肩も一体で造形する。 */
export function ie600ShellGeometry() {
  const segments = 256;
  const rings = 48;
  const center = new Vector2(1, -1.5);
  const outline = shellOutline().getSpacedPoints(segments).slice(0, segments);
  if (ShapeUtils.isClockWise(outline)) {
    outline.reverse();
  }
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const front: number[][] = [];
  const back: number[][] = [];
  for (const side of [1, -1]) {
    const rows = side === 1 ? front : back;
    for (let ring = 0; ring <= rings; ring += 1) {
      const row: number[] = [];
      const ratio = ring / rings;
      const count = ring === 0 ? 1 : segments;
      appendShellRingVertices(
        count,
        outline,
        center,
        ratio,
        side,
        ring,
        rings,
        front,
        row,
        positions,
        uvs
      );
      rows.push(row);
    }
    connectShellRings(rings, rows, segments, side, indices);
  }
  const geometry = new BufferGeometry();
  const solidIndices: number[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index];
    const b = indices[index + 1];
    const c = indices[index + 2];
    if (a === undefined || b === undefined || c === undefined) {
      continue;
    }
    const x =
      ((positions[a * 3] ?? 0) +
        (positions[b * 3] ?? 0) +
        (positions[c * 3] ?? 0)) /
      3;
    const y =
      ((positions[a * 3 + 1] ?? 0) +
        (positions[b * 3 + 1] ?? 0) +
        (positions[c * 3 + 1] ?? 0)) /
      3;
    const z =
      ((positions[a * 3 + 2] ?? 0) +
        (positions[b * 3 + 2] ?? 0) +
        (positions[c * 3 + 2] ?? 0)) /
      3;
    const axis =
      socketDirection.x * (x - socketCenter.x) +
      socketDirection.y * (y - socketCenter.y);
    const across =
      socketAcross.x * (x - socketCenter.x) +
      socketAcross.y * (y - socketCenter.y);
    const socketOpening = axis > -2.5 && Math.hypot(across, z) < 1.9;
    if (!socketOpening) {
      solidIndices.push(a, b, c);
    }
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(solidIndices);
  geometry.computeVertexNormals();
  return openIe600Vent(geometry);
}

function connectShellRings(
  rings: number,
  rows: number[][],
  segments: number,
  side: number,
  indices: number[]
) {
  for (let ring = 1; ring <= rings; ring += 1) {
    const inner = rows[ring - 1];
    const outer = rows[ring];
    if (!inner || !outer) {
      continue;
    }
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const a = inner[ring === 1 ? 0 : segment];
      const b = outer[segment];
      const c = outer[next];
      const d = inner[ring === 1 ? 0 : next];
      if (
        a === undefined ||
        b === undefined ||
        c === undefined ||
        d === undefined
      ) {
        continue;
      }
      appendShellFace(side, indices, a, b, c, ring, d);
    }
  }
}

function appendShellFace(
  side: number,
  indices: number[],
  a: number,
  b: number,
  c: number,
  ring: number,
  d: number
) {
  if (side === 1) {
    indices.push(a, b, c);
    if (ring > 1) {
      indices.push(a, c, d);
    }
  } else {
    indices.push(a, c, b);
    if (ring > 1) {
      indices.push(a, d, c);
    }
  }
}

function appendShellRingVertices(
  count: number,
  outline: Vector2[],
  center: Vector2,
  ratio: number,
  side: number,
  ring: number,
  rings: number,
  front: number[][],
  row: number[],
  positions: number[],
  uvs: number[]
) {
  for (let segment = 0; segment < count; segment += 1) {
    const point = outline[segment];
    if (!point) {
      continue;
    }
    const x = MathUtils.lerp(center.x, point.x, ratio);
    const y = MathUtils.lerp(center.y, point.y, ratio);
    const neck = MathUtils.smoothstep(y, 5, 11);
    const dome = Math.sqrt(Math.max(0, 1 - ratio ** 2.4));
    let z = (side === 1 ? 3.8 : 4.15) * (1 - neck * 0.3) * dome;
    const axis =
      socketDirection.x * (x - socketCenter.x) +
      socketDirection.y * (y - socketCenter.y);
    const across =
      socketAcross.x * (x - socketCenter.x) +
      socketAcross.y * (y - socketCenter.y);
    const roundNeck = Math.sqrt(Math.max(0, neckRadius ** 2 - across ** 2));
    z = MathUtils.lerp(z, roundNeck, MathUtils.smoothstep(axis, -5, -2));
    z =
      side === 1
        ? MathUtils.lerp(z, 3.65, badgeWeight(x, y))
        : MathUtils.lerp(
            z,
            3.7 - x * 0.035,
            rearFacetWeight(x, y) *
              0.9 *
              MathUtils.smoothstep(1 - ratio, 0, 0.22)
          );
    // 口元の円周だけ表裏を分け、端子の穴を塞ぐ面を作らない。
    const seamIndex =
      side === -1 && ring === rings && z < 0.00001
        ? front[ring]?.[segment]
        : undefined;
    if (seamIndex !== undefined) {
      row.push(seamIndex);
      continue;
    }
    row.push(positions.length / 3);
    positions.push(x, y, z * side);
    uvs.push((x + 14) / 28, (y + 12) / 28);
  }
}

export function ie600BoreGeometry(outer: number, inner: number, depth: number) {
  const outline = new Shape();
  outline.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const bore = new Path();
  bore.absarc(0, 0, inner, 0, Math.PI * 2, true);
  outline.holes.push(bore);
  return new ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: false,
    curveSegments: 48,
  });
}

export const ie600EarTipRim = { radius: 6.3, depth: 1 } as const;

/** ノズルを覆う軸と薄い傘をつなぎ、傘の根元側に空洞を残す。 */
function ie600EarTipProfile() {
  const profile = new Path();
  profile.moveTo(2.65, 0);
  profile.lineTo(3.05, 0);
  profile.lineTo(3.05, 1.8);
  profile.lineTo(2.9, 7);
  profile.bezierCurveTo(4.25, 6.85, 5.8, 4.1, 5.8, ie600EarTipRim.depth);
  profile.quadraticCurveTo(5.8, 0.75, 6.05, 0.75);
  profile.quadraticCurveTo(
    ie600EarTipRim.radius,
    0.75,
    ie600EarTipRim.radius,
    ie600EarTipRim.depth
  );
  profile.bezierCurveTo(6.35, 4.55, 4.5, 8.05, 2.4, 8.15);
  profile.quadraticCurveTo(1.65, 8.18, 1.65, 7.85);
  profile.lineTo(1.65, 1.8);
  profile.lineTo(2.65, 1.8);
  profile.lineTo(2.65, 0);
  return profile;
}

export function ie600EarTipGeometry() {
  const geometry = new LatheGeometry(ie600EarTipProfile().getPoints(48), 128);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** 純正イヤーチップの奥に見える放射状の保護格子。開口は実際の穴。 */
export function ie600TipGuardGeometry() {
  const outline = new Shape();
  outline.absarc(0, 0, 1.62, 0, Math.PI * 2, false);
  const center = new Path();
  for (let vertex = 0; vertex < 6; vertex += 1) {
    const angle = (vertex * Math.PI) / 3;
    const x = Math.cos(angle) * 0.29;
    const y = Math.sin(angle) * 0.29;
    if (vertex === 0) {
      center.moveTo(x, y);
    } else {
      center.lineTo(x, y);
    }
  }
  center.closePath();
  outline.holes.push(center);
  for (const [inner, outer] of [
    [0.46, 0.84],
    [1.03, 1.41],
  ]) {
    if (inner === undefined || outer === undefined) {
      continue;
    }
    for (let sector = 0; sector < 6; sector += 1) {
      const start = (sector * Math.PI) / 3 + 0.1;
      const end = ((sector + 1) * Math.PI) / 3 - 0.1;
      const hole = new Path();
      hole.moveTo(Math.cos(start) * inner, Math.sin(start) * inner);
      hole.lineTo(Math.cos(start) * outer, Math.sin(start) * outer);
      hole.lineTo(Math.cos(end) * outer, Math.sin(end) * outer);
      hole.lineTo(Math.cos(end) * inner, Math.sin(end) * inner);
      hole.closePath();
      outline.holes.push(hole);
    }
  }
  return new ExtrudeGeometry(outline, {
    depth: 0.17,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 2,
    curveSegments: 16,
  });
}

function connectorGripProfile() {
  const profile = new Path();
  profile.moveTo(1.65, 2.15);
  profile.lineTo(2.65, 2.15);
  profile.quadraticCurveTo(2.82, 2.15, 2.82, 2.3);
  profile.lineTo(2.82, 2.65);
  profile.bezierCurveTo(2.82, 5.4, 2.3, 8.7, 1.7, 10.15);
  profile.quadraticCurveTo(1.63, 10.55, 1.3, 10.55);
  profile.lineTo(1.24, 10.55);
  profile.lineTo(1.24, 10.1);
  profile.lineTo(1.65, 2.15);
  return profile;
}

export function ie600ConnectorGripGeometry() {
  const geometry = new LatheGeometry(connectorGripProfile().getPoints(40), 96);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function ie600GripMarkGeometry() {
  const profile = connectorGripProfile()
    .getPoints(200)
    .filter((point) => point.x > 1.8 && point.y > 2.6);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= 12; row += 1) {
    const z = 3.5 + (row / 12) * 1.8;
    let sample = new Vector2(2.8, 3.5);
    for (const point of profile) {
      if (Math.abs(point.y - z) < Math.abs(sample.y - z)) {
        sample = point;
      }
    }
    for (let column = 0; column <= 16; column += 1) {
      const angle = (column / 16 - 0.5) * 0.5;
      positions.push(
        Math.sin(angle) * (sample.x + 0.012),
        -Math.cos(angle) * (sample.x + 0.012),
        z
      );
      uvs.push(column / 16, row / 12);
      if (row < 12 && column < 16) {
        const a = row * 17 + column;
        indices.push(a, a + 1, a + 18, a, a + 18, a + 17);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export const ie600EarHookRelief = {
  length: 6,
  hookInset: 2.2,
  cableRadius: 0.6,
} as const;

/** 耳掛けを包む丸い肩から、細いケーブルまで段差なく絞る。 */
export function ie600EarHookReliefGeometry() {
  const profile = new Path();
  profile.moveTo(1.2, 0);
  profile.lineTo(1.32, 0);
  profile.quadraticCurveTo(1.45, 0, 1.45, 0.6);
  profile.lineTo(1.45, 1.4);
  profile.bezierCurveTo(1.45, 3.1, 0.6, 4.1, 0.6, 5.6);
  profile.lineTo(ie600EarHookRelief.cableRadius, ie600EarHookRelief.length);
  profile.lineTo(0.5, ie600EarHookRelief.length);
  profile.lineTo(0.5, 0);
  profile.closePath();
  const geometry = new LatheGeometry(profile.getPoints(32), 64);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function ie600SocketRimGeometry() {
  const profile = new Path();
  profile.moveTo(1.9, 0.3);
  profile.lineTo(2.55, 0.3);
  profile.quadraticCurveTo(2.7, 0.3, 2.7, 0.5);
  profile.lineTo(2.7, 1.05);
  profile.quadraticCurveTo(2.7, 1.3, 2.45, 1.3);
  profile.lineTo(2.15, 1.3);
  profile.quadraticCurveTo(1.9, 1.3, 1.9, 1.05);
  profile.lineTo(1.9, 0.3);
  const geometry = new LatheGeometry(profile.getPoints(24), 96);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export const ie600BalancedPlugDimensions = {
  cableEntry: -24,
  cableDepth: -6.4,
  shaftStart: 6.2,
  insulators: [3, 6.5, 10, 13.5],
} as const;

/** 純正4.4 mmケーブルのL字形オーバーモールド。根元は細いケーブルへ絞る。 */
export function ie600BalancedPlugBodyGeometry() {
  const outline = new Shape();
  outline.moveTo(3.4, -9.5);
  outline.lineTo(3.4, 5.5);
  outline.quadraticCurveTo(3.4, 6.2, 2.7, 6.2);
  outline.lineTo(-2.8, 6.2);
  outline.quadraticCurveTo(-3.5, 6.2, -3.5, 5.5);
  outline.lineTo(-3.5, 0.5);
  outline.bezierCurveTo(-3.5, -3.2, -5.2, -3.7, -8.3, -3.7);
  outline.lineTo(-13.4, -3.9);
  outline.lineTo(-13.4, -8.9);
  outline.bezierCurveTo(-8, -9, -1, -9.5, 3.4, -9.5);
  outline.closePath();
  const geometry = new ExtrudeGeometry(outline, {
    depth: 5.4,
    bevelEnabled: true,
    bevelSize: 0.3,
    bevelThickness: 0.4,
    bevelSegments: 6,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -2.7);
  geometry.rotateX(Math.PI / 2);
  const reliefProfile = [
    new Vector2(0.85, 0),
    new Vector2(1.12, 0),
    new Vector2(1.2, 0.2),
    new Vector2(1.2, 0.95),
    new Vector2(1.08, 1.05),
    new Vector2(1.08, 1.3),
    new Vector2(1.26, 1.4),
    new Vector2(1.26, 2.35),
    new Vector2(1.14, 2.45),
    new Vector2(1.14, 2.7),
    new Vector2(1.32, 2.8),
    new Vector2(1.32, 3.75),
    new Vector2(1.2, 3.85),
    new Vector2(1.2, 4.1),
    new Vector2(1.4, 4.2),
    new Vector2(1.55, 6.2),
    new Vector2(1.75, 7.9),
    new Vector2(2.45, 10.7),
    new Vector2(0.85, 10.7),
    new Vector2(0.85, 0),
  ];
  const lathe = new LatheGeometry(reliefProfile, 64);
  const relief = lathe.toNonIndexed();
  lathe.dispose();
  relief.rotateZ(-Math.PI / 2);
  relief.translate(
    ie600BalancedPlugDimensions.cableEntry,
    0,
    ie600BalancedPlugDimensions.cableDepth
  );
  const body = mergeGeometries([geometry, relief]);
  geometry.dispose();
  relief.dispose();
  return body;
}

export function ie600BalancedPlugGeometry() {
  const radius = 2.2;
  const shaftLength = 16.8;
  const profile: Vector2[] = [
    new Vector2(0, 0),
    new Vector2(2.08, 0),
    new Vector2(radius, 0.12),
  ];
  for (const band of ie600BalancedPlugDimensions.insulators) {
    profile.push(
      new Vector2(radius, band - 0.1),
      new Vector2(2.12, band),
      new Vector2(2.12, band + 0.5),
      new Vector2(radius, band + 0.6)
    );
  }
  profile.push(
    new Vector2(radius, 15.25),
    new Vector2(1.9, 15.9),
    new Vector2(1.94, 16.2),
    new Vector2(radius, shaftLength)
  );
  for (let step = 1; step <= 24; step += 1) {
    const angle = ((step / 24) * Math.PI) / 2;
    profile.push(
      new Vector2(
        radius * Math.cos(angle),
        shaftLength + radius * Math.sin(angle)
      )
    );
  }
  const geometry = new LatheGeometry(profile, 96);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function ie600MmcxPinGeometry() {
  const profile = new Path();
  profile.moveTo(0, 0);
  profile.quadraticCurveTo(0.23, 0, 0.23, 0.23);
  profile.lineTo(0.23, 1.8);
  profile.lineTo(0, 1.8);
  profile.lineTo(0, 0);
  const geometry = new LatheGeometry(profile.getPoints(16), 32);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** 回転体の切り口を閉じ、薄い接点の側面にも厚みと法線を持たせる。 */
function contactCutFace(profile: Vector2[], angle: number, reverse: boolean) {
  const geometry = new ShapeGeometry(new Shape(profile));
  const indices = geometry.getIndex();
  if (reverse && indices) {
    for (let index = 0; index < indices.count; index += 3) {
      const first = indices.getX(index);
      indices.setX(index, indices.getX(index + 2));
      indices.setX(index + 2, first);
    }
  }
  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(angle - Math.PI / 2);
  geometry.computeVertexNormals();
  const face = geometry.toNonIndexed();
  geometry.dispose();
  return face;
}

/** MMCXの分割接点。先端の面取り、固定溝、六つの切れ目を実際の形状にする。 */
export function ie600ContactSleeveGeometry() {
  const profile = [
    new Vector2(0.78, 0),
    new Vector2(1.22, 0),
    new Vector2(1.35, 0.12),
    new Vector2(1.35, 1.4),
    new Vector2(1.29, 1.48),
    new Vector2(1.29, 1.62),
    new Vector2(1.45, 1.74),
    new Vector2(1.45, 1.86),
    new Vector2(1.32, 1.95),
    new Vector2(0.78, 1.95),
    new Vector2(0.78, 0),
  ];
  const pieces: BufferGeometry[] = [
    ie600BoreGeometry(1.35, 0.78, 0.65).translate(0, 0, 1.95),
  ];
  for (let segment = 0; segment < 6; segment += 1) {
    const start = (segment * Math.PI) / 3 + 0.028;
    const end = ((segment + 1) * Math.PI) / 3 - 0.028;
    const lathe = new LatheGeometry(profile, 20, start, end - start);
    const sleeve = lathe.toNonIndexed();
    lathe.dispose();
    sleeve.rotateX(Math.PI / 2);
    pieces.push(
      sleeve,
      contactCutFace(profile, start, false),
      contactCutFace(profile, end, true)
    );
  }
  const geometry = mergeGeometries(pieces);
  geometry.rotateZ(Math.PI / 2);
  for (const piece of pieces) {
    piece.dispose();
  }
  return geometry;
}
