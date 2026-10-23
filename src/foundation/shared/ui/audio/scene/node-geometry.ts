import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { roundedOutline } from "./node-parts";

export const nodeDimensions = {
  width: 220,
  height: 46,
  depth: 146,
  front: 73,
  rear: -68.4,
  base: 6.5,
  lowerTop: 23.8,
  upperBottom: 28.8,
  top: 45.4,
  headphoneY: 15,
  statusY: 26.3,
} as const;

type ShellSection = {
  y: number;
  inset: number;
  radialNormal: number;
  verticalNormal: number;
};

function shellSections(bottom: number, top: number) {
  const sections: ShellSection[] = [];
  for (let step = 0; step <= 8; step += 1) {
    const angle = ((step / 8) * Math.PI) / 2;
    sections.push({
      y: bottom + 0.6 * (1 - Math.cos(angle)),
      inset: 0.6 * (1 - Math.sin(angle)),
      radialNormal: Math.sin(angle),
      verticalNormal: -Math.cos(angle),
    });
  }
  if (top > 40.8) {
    sections.push({ y: 40.8, inset: 0, radialNormal: 1, verticalNormal: 0 });
  }
  for (let step = 0; step <= 8; step += 1) {
    const angle = ((step / 8) * Math.PI) / 2;
    sections.push({
      y: top - 1 + Math.sin(angle),
      inset: 1 - Math.cos(angle),
      radialNormal: Math.cos(angle),
      verticalNormal: Math.sin(angle),
    });
  }
  return sections;
}

function shellLoop(inset: number) {
  const corners = [
    [92, 55],
    [-92, 55],
    [-92, -55],
    [92, -55],
  ] as const;
  return corners.flatMap(([x, z], corner) =>
    Array.from({ length: 33 }, (_, step) => {
      const angle = ((corner + step / 32) * Math.PI) / 2;
      return {
        x: x + Math.cos(angle) * (18 - inset),
        z: z + Math.sin(angle) * (18 - inset),
        nx: Math.cos(angle),
        nz: Math.sin(angle),
      };
    })
  );
}

/** 天面・側面・丸い稜線を一続きにし、平面へ三角形の陰影が出るのを避ける。 */
export function nodeShellGeometry(upper: boolean) {
  const sections = shellSections(
    upper ? nodeDimensions.upperBottom : nodeDimensions.base,
    upper ? nodeDimensions.height : nodeDimensions.lowerTop
  );
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const count = shellLoop(0).length;
  for (const [row, section] of sections.entries()) {
    const loop = shellLoop(section.inset);
    for (const [column, point] of loop.entries()) {
      positions.push(point.x, section.y, point.z);
      normals.push(
        point.nx * section.radialNormal,
        section.verticalNormal,
        point.nz * section.radialNormal
      );
      uvs.push(column / count, section.y / nodeDimensions.height);
      if (row === sections.length - 1) {
        continue;
      }
      const next = (column + 1) % count;
      const neighbor = loop[next];
      if (!neighbor) {
        continue;
      }
      const rearCutout =
        section.y < 40.79 &&
        Math.max(Math.abs(point.x), Math.abs(neighbor.x)) < 101 &&
        point.z < -67 &&
        neighbor.z < -67;
      const frontCutout =
        !upper &&
        Math.abs(point.z - (73 - section.inset)) < 0.0001 &&
        Math.abs(neighbor.z - (73 - section.inset)) < 0.0001;
      if (rearCutout || frontCutout) {
        continue;
      }
      const a = row * count + column;
      const b = row * count + next;
      indices.push(a, a + count, b, b, a + count, b + count);
    }
  }
  const wall = new BufferGeometry();
  wall.setAttribute("position", new Float32BufferAttribute(positions, 3));
  wall.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  wall.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  wall.setIndex(indices);
  if (!upper) {
    return wall;
  }
  const top = new Shape(
    shellLoop(1).map((point) => new Vector2(point.x, -point.z))
  );
  top.holes.push(roundedOutline(145.8, 77.8, 8.7));
  const cap = new ShapeGeometry(top, 64);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, nodeDimensions.height, 0);
  const combined = mergeGeometries([wall, cap]);
  wall.dispose();
  cap.dispose();
  if (combined === null) {
    throw new Error("Cannot join the NODE enclosure surfaces.");
  }
  return combined;
}

/** 背面の接続パネルを別体にし、端子の奥へ筐体が食い込まない薄肉の側壁。 */
export function nodeBandOutline() {
  const shape = new Shape();
  shape.moveTo(-101, 69.4);
  shape.quadraticCurveTo(-109.4, 65, -109.4, 55);
  shape.lineTo(-109.4, -55);
  shape.absarc(-92, -55, 17.4, Math.PI, Math.PI * 1.5, false);
  shape.lineTo(92, -72.4);
  shape.absarc(92, -55, 17.4, -Math.PI / 2, 0, false);
  shape.lineTo(109.4, 55);
  shape.quadraticCurveTo(109.4, 65, 101, 69.4);
  shape.lineTo(101, 67.8);
  shape.quadraticCurveTo(107.8, 64.5, 107.8, 55);
  shape.lineTo(107.8, -55);
  shape.absarc(92, -55, 15.8, 0, -Math.PI / 2, true);
  shape.lineTo(-92, -70.8);
  shape.absarc(-92, -55, 15.8, -Math.PI / 2, -Math.PI, true);
  shape.lineTo(-107.8, 55);
  shape.quadraticCurveTo(-107.8, 64.5, -101, 67.8);
  shape.closePath();
  return shape;
}

export function nodeFrontGeometry() {
  const face = new Shape();
  face.moveTo(-92, nodeDimensions.base + 0.6);
  face.lineTo(92, nodeDimensions.base + 0.6);
  face.lineTo(92, nodeDimensions.lowerTop - 1);
  face.lineTo(-92, nodeDimensions.lowerTop - 1);
  face.closePath();
  const hole = new Path();
  hole.absarc(0, nodeDimensions.headphoneY, 2.15, 0, Math.PI * 2, true);
  face.holes.push(hole);
  const panel = new ExtrudeGeometry(face, {
    depth: 1.1,
    bevelEnabled: false,
    curveSegments: 48,
  });
  const sections = shellSections(nodeDimensions.base, nodeDimensions.lowerTop);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (let row = 0; row < sections.length - 1; row += 1) {
    const a = sections[row];
    const b = sections[row + 1];
    if (!a || !b || row === 8) {
      continue;
    }
    for (const [x, section] of [
      [-92, a],
      [92, a],
      [-92, b],
      [92, a],
      [92, b],
      [-92, b],
    ] as const) {
      positions.push(x, section.y, 1.1 - section.inset);
      normals.push(0, section.verticalNormal, section.radialNormal);
      uvs.push(x / 184 + 0.5, section.y / nodeDimensions.height);
    }
  }
  const fillet = new BufferGeometry();
  fillet.setAttribute("position", new Float32BufferAttribute(positions, 3));
  fillet.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  fillet.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  const combined = mergeGeometries([panel, fillet]);
  panel.dispose();
  fillet.dispose();
  if (combined === null) {
    throw new Error("Cannot join the NODE front fascia.");
  }
  return combined;
}

function translatedOutline(
  width: number,
  height: number,
  radius: number,
  x: number,
  y: number
) {
  return new Path(
    roundedOutline(width, height, radius)
      .getPoints(24)
      .map((point) => new Vector2(point.x + x, point.y + y))
  );
}

export function nodeRearPanelGeometry() {
  const outline = new Shape(
    roundedOutline(202, 31.4, 2.4)
      .getPoints(32)
      .map((point) => new Vector2(point.x, point.y + 25.1))
  );
  for (const [x, y, width, height, radius] of [
    [-62, 25, 63, 16.2, 7.8],
    [-23.5, 25, 10.8, 9.8, 0.5],
    [27.5, 28.1, 18.4, 23.7, 0.5],
    [54, 22.5, 16.2, 7.2, 0.6],
    [81.5, 23.8, 23.3, 13.8, 6.5],
  ] as const) {
    outline.holes.push(translatedOutline(width, height, radius, x, y));
  }
  for (const x of [-9.5, 2.5, 12.5]) {
    const hole = new Path();
    hole.absarc(x, 20.9, 2.2, 0, Math.PI * 2, true);
    outline.holes.push(hole);
  }
  return new ExtrudeGeometry(outline, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSize: 0.1,
    bevelThickness: 0.1,
    bevelSegments: 3,
    curveSegments: 32,
  });
}

function roundedDistance(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const dx = Math.abs(x) - width / 2 + radius;
  const dy = Math.abs(y) - height / 2 + radius;
  return (
    Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
    Math.min(Math.max(dx, dy), 0) -
    radius
  );
}

/** 個々の六角形を重ねず、細い内外周を残した一枚の通気板を作る。 */
export function nodeVentGeometry() {
  const outline = roundedOutline(144, 76, 8);
  outline.holes.push(roundedOutline(133.5, 64, 5.5));
  const cellRadius = 1.3;
  const apertureRadius = 1.03;
  for (let column = -37; column <= 37; column += 1) {
    for (let row = -18; row <= 18; row += 1) {
      const x = column * cellRadius * 1.5;
      const y = (row + (column % 2) * 0.5) * Math.sqrt(3) * cellRadius;
      const corners = Array.from({ length: 6 }, (_, index) => {
        const angle = (-index * Math.PI) / 3;
        return new Vector2(
          x + Math.cos(angle) * apertureRadius,
          y + Math.sin(angle) * apertureRadius
        );
      });
      if (
        corners.some(
          (point) =>
            roundedDistance(point.x, point.y, 143.4, 75.4, 7.7) > 0 ||
            roundedDistance(point.x, point.y, 134.1, 64.6, 5.8) < 0
        )
      ) {
        continue;
      }
      const aperture = new Path(corners);
      aperture.closePath();
      outline.holes.push(aperture);
    }
  }
  return new ExtrudeGeometry(outline, {
    depth: 0.28,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 2,
    curveSegments: 40,
  });
}
