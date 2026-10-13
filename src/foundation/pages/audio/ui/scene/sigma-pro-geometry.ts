import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  Vector2,
} from "three";

export const SIGMA_WIDTH = 85;
export const SIGMA_DEPTH = 155.7;
// Thickness and individual component dimensions are measured proportionally from photos.
export const SIGMA_HEIGHT = 20;
export const SIGMA_FRONT = 67.85;
export const SIGMA_REAR = -77.85;
export const SIGMA_WINDOW = { width: 79.2, depth: 115.6, z: -16 } as const;
export const SIGMA_BUTTON_X = [4.5, 14.7, 24.9, 35.1] as const;
export const sigmaOutputs = [
  { x: -28, y: 10.5, radius: 3.175, bezel: 8, label: "6.35mm SE" },
  { x: -10, y: 8.25, radius: 2.2, bezel: 5.4, label: "4.4mm BAL" },
  { x: 5, y: 8.25, radius: 1.75, bezel: 4.35, label: "3.5mm" },
] as const;
export const sigmaInputs = [
  { x: -32, y: 8.6, width: 3.2, height: 8.6, label: "DC 5V" },
  { x: -22.5, y: 8.6, width: 3.2, height: 8.6, label: "USB" },
  { x: -10.7, y: 8.6, radius: 4.8, bezel: 6.7, label: "S/PDIF" },
  { x: 4.8, y: 10.3, width: 8.4, height: 7.2, label: "OPT" },
  { x: 19, y: 12.2, radius: 2.2, bezel: 4.7, label: "4.4mm" },
  { x: 32.5, y: 12.2, radius: 1.75, bezel: 4.35, label: "3.5mm" },
] as const;

export function sigmaOutline(width: number, height: number, radius: number) {
  const x = width / 2;
  const y = height / 2;
  const shape = new Shape();
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  shape.closePath();
  return shape;
}

function roundedHole(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  return new Path(
    sigmaOutline(width, height, radius)
      .getPoints(32)
      .map((point) => new Vector2(point.x + x, point.y + y))
  );
}

function circularHole(x: number, y: number, radius: number) {
  const hole = new Path();
  hole.absarc(x, y, radius, 0, Math.PI * 2, true);
  return hole;
}

export function sigmaPlate(shape: Shape, depth: number, bevel = 0.12) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
    curveSegments: 48,
  });
  geometry.translate(0, 0, -depth / 2);
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(index, positions.getX(index) / 32, positions.getY(index) / 32);
  }
  return geometry;
}

export function sigmaFrontGeometry() {
  const shape = sigmaOutline(80.6, SIGMA_HEIGHT - 2.4, 0.8);
  for (const { x, y, radius } of sigmaOutputs) {
    shape.holes.push(circularHole(x, y - 10, radius + 0.45));
  }
  shape.holes.push(circularHole(27.5, 0, 8.25));
  return sigmaPlate(shape, 1.5);
}

export function sigmaTopGeometry() {
  const shape = sigmaOutline(SIGMA_WIDTH - 0.8, 145.3, 2.2);
  shape.holes.push(
    roundedHole(0, 11, SIGMA_WINDOW.width, SIGMA_WINDOW.depth, 2)
  );
  shape.holes.push(roundedHole(-20.8, -59.2, 35.6, 16.6, 1.35));
  for (const x of SIGMA_BUTTON_X) {
    shape.holes.push(circularHole(x, -62, 3.35));
  }
  return sigmaPlate(shape, 1.1);
}

export function sigmaSideGeometry() {
  const shape = sigmaOutline(SIGMA_DEPTH - 0.5, SIGMA_HEIGHT - 0.4, 2);
  shape.holes.push(roundedHole(-72.6, 0, 5.6, 13.5, 1.9));
  return sigmaPlate(shape, 2.15, 0.2);
}

export function sigmaRearGeometry() {
  const shape = sigmaOutline(80.6, SIGMA_HEIGHT - 2.4, 0.8);
  for (const input of sigmaInputs) {
    if ("radius" in input) {
      shape.holes.push(
        circularHole(input.x, input.y - 10, input.radius + 0.35)
      );
    } else {
      shape.holes.push(
        roundedHole(
          input.x,
          input.y - 10,
          input.width,
          input.height,
          input.label === "OPT" ? 0.4 : 1.55
        )
      );
    }
  }
  return sigmaPlate(shape, 1.5);
}

/** Axial milling grooves are actual geometry, including the bevels at both ends. */
export function sigmaKnobGeometry() {
  const segments = 576;
  const profile = [
    [0, 7.65],
    [0.3, 7.95],
    [0.55, 8.05],
    [8.7, 8.05],
    [9, 7.95],
    [9.3, 7.65],
  ] as const;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const [row, [z, radius]] of profile.entries()) {
    for (let column = 0; column <= segments; column += 1) {
      const angle = (column / segments) * Math.PI * 2;
      const groove = (0.5 + 0.5 * Math.cos(angle * 72)) ** 4;
      const inset = row === 0 || row === profile.length - 1 ? 0 : groove * 0.14;
      vertices.push(
        Math.cos(angle) * (radius - inset),
        Math.sin(angle) * (radius - inset),
        z
      );
      uvs.push(column / segments, z / 9.3);
      if (row === 0 || column === segments) {
        continue;
      }
      const current = row * (segments + 1) + column;
      const previous = current - segments - 1;
      indices.push(
        previous,
        previous + 1,
        current,
        current,
        previous + 1,
        current + 1
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
