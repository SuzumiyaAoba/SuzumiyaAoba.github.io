import {
  BufferGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const hd800sGrille = {
  radius: 28.5,
  cell: 0.86,
  hole: 0.66,
  bevel: 0.03,
  depth: 0.3,
} as const;

export function hd800sGrilleHoles() {
  const holes: { x: number; y: number }[] = [];
  for (let column = -24; column <= 24; column += 1) {
    for (let row = -22; row <= 22; row += 1) {
      const x = column * hd800sGrille.cell * 1.5;
      const y =
        (row + (Math.abs(column) % 2) * 0.5) * hd800sGrille.cell * Math.sqrt(3);
      if (Math.hypot(x, y) < hd800sGrille.radius - 0.95) {
        holes.push({ x, y });
      }
    }
  }
  return holes;
}

export function hd800sGrilleHeight(x: number, y: number) {
  return 6 * Math.max(0, 1 - (x * x + y * y) / hd800sGrille.radius ** 2);
}

// z = 6(1 − r²/R²) の法線。三角形の対角線や穴の配置で反射を変えない。
export function hd800sGrilleNormal(x: number, y: number, target: Vector3) {
  const slope = 12 / hd800sGrille.radius ** 2;
  return target.set(slope * x, slope * y, 1).normalize();
}

/** 丸穴を六角配置した一枚のドーム状金網。縁・面取り・穴壁・裏面を連続させる。 */
export function hd800sPerforatedGrille() {
  const outline = new Shape();
  const rimSegments = 192;
  // 外周は穴より大きい。側壁と同じ頂点を通し、輪郭に隙間を残さない。
  outline.moveTo(hd800sGrille.radius, 0);
  for (let segment = 1; segment < rimSegments; segment += 1) {
    const angle = (segment / rimSegments) * Math.PI * 2;
    outline.lineTo(
      hd800sGrille.radius * Math.cos(angle),
      hd800sGrille.radius * Math.sin(angle)
    );
  }
  outline.closePath();
  const holes = hd800sGrilleHoles();
  for (const { x, y } of holes) {
    const opening = new Path();
    opening.absarc(
      x,
      y,
      hd800sGrille.hole + hd800sGrille.bevel,
      0,
      Math.PI * 2,
      true
    );
    outline.holes.push(opening);
  }
  const face = new ShapeGeometry(outline, 12);
  face.deleteAttribute("uv");
  const vertices = face.getAttribute("position");
  const normals = face.getAttribute("normal");
  const normal = new Vector3();
  for (let index = 0; index < vertices.count; index += 1) {
    const x = vertices.getX(index);
    const y = vertices.getY(index);
    vertices.setZ(index, hd800sGrilleHeight(x, y));
    hd800sGrilleNormal(x, y, normal);
    normals.setXYZ(index, normal.x, normal.y, normal.z);
  }
  const back = face.clone();
  back.translate(0, 0, -hd800sGrille.depth);
  const order = back.getIndex();
  if (!order) {
    throw new Error("Cannot create the HD 800 S grille back surface.");
  }
  for (let index = 0; index < order.count; index += 3) {
    const next = order.getX(index + 1);
    order.setX(index + 1, order.getX(index + 2));
    order.setX(index + 2, next);
  }
  const backNormals = back.getAttribute("normal");
  for (let index = 0; index < backNormals.count; index += 1) {
    backNormals.setXYZ(
      index,
      -normals.getX(index),
      -normals.getY(index),
      -normals.getZ(index)
    );
  }
  const positions: number[] = [];
  const indices: number[] = [];
  for (const { x, y } of holes) {
    addWall(positions, indices, x, y, [
      [0.69, 0],
      [0.66, -0.04],
      [0.66, -0.26],
      [0.69, -0.3],
    ]);
  }
  addWall(
    positions,
    indices,
    0,
    0,
    [
      [28.5, -0.3],
      [28.5, 0],
    ],
    rimSegments
  );
  const walls = new BufferGeometry();
  walls.setAttribute("position", new Float32BufferAttribute(positions, 3));
  walls.setIndex(indices);
  walls.computeVertexNormals();
  const geometry = mergeGeometries([face, back, walls]);
  for (const part of [face, back, walls]) {
    part.dispose();
  }
  return geometry;
}

function addWall(
  positions: number[],
  indices: number[],
  x: number,
  y: number,
  profile: readonly (readonly [number, number])[],
  segments = 24
) {
  const start = positions.length / 3;
  for (const [radius, depth] of profile) {
    for (let segment = 0; segment < segments; segment += 1) {
      const theta = (segment / segments) * Math.PI * 2;
      const px = x + Math.cos(theta) * radius;
      const py = y + Math.sin(theta) * radius;
      positions.push(px, py, hd800sGrilleHeight(px, py) + depth);
    }
  }
  for (let row = 0; row < profile.length - 1; row += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = start + row * segments + segment;
      const next = start + row * segments + ((segment + 1) % segments);
      indices.push(a, next, a + segments, next, next + segments, a + segments);
    }
  }
}
