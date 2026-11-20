import { ExtrudeGeometry, Path, Shape } from "three";

export const HA1A_FRONT = 141.5;
export const HA1A_WINDOW_Y = 159;
export const HA1A_WINDOW_RADIUS = 34.5;

/** 漆塗りの各側板は断面がわずかに膨らみ、上下の縁で金属の下地へ戻る。 */
export function ha1aWoodBoardGeometry(centerY: number) {
  const profile = new Shape();
  profile.moveTo(-3.1, -20.1);
  profile.lineTo(1.45, -20.1);
  profile.quadraticCurveTo(2.6, -19.9, 2.9, -18);
  profile.bezierCurveTo(3.35, -10, 3.35, 10, 2.9, 18);
  profile.quadraticCurveTo(2.6, 19.9, 1.45, 20.1);
  profile.lineTo(-3.1, 20.1);
  profile.closePath();
  const geometry = new ExtrudeGeometry(profile, {
    depth: 281.5,
    bevelEnabled: true,
    bevelSize: 0.25,
    bevelThickness: 0.25,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -140.75);
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i += 1) {
    uvs.setXY(
      i,
      positions.getZ(i) / 282 + 0.5,
      (positions.getY(i) + centerY - 7) / 208
    );
  }
  return geometry;
}

function outline(width: number, height: number, radius: number, offsetY = 0) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2 + offsetY;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function rectangularHole(x: number, y: number, width: number, height: number) {
  const hole = new Path();
  hole.moveTo(x - width / 2, y - height / 2);
  hole.lineTo(x - width / 2, y + height / 2);
  hole.lineTo(x + width / 2, y + height / 2);
  hole.lineTo(x + width / 2, y - height / 2);
  hole.closePath();
  return hole;
}

function plate(shape: Shape, depth: number, width: number, height: number) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.18,
    bevelThickness: 0.18,
    bevelSegments: 3,
    curveSegments: 64,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      positions.getX(index) / width + 0.5,
      positions.getY(index) / height + 0.5
    );
  }
  return geometry;
}

export function ha1aFrontGeometry() {
  const shape = outline(126.1, 207.6, 3);
  const window = new Path();
  window.absarc(
    0,
    HA1A_WINDOW_Y - 111,
    HA1A_WINDOW_RADIUS,
    0,
    Math.PI * 2,
    true
  );
  shape.holes.push(window);
  for (const x of [-36, 36]) {
    const socket = new Path();
    socket.absarc(x, 31 - 111, 5.5, 0, Math.PI * 2, true);
    shape.holes.push(socket);
  }
  return plate(shape, 4.6, 126.5, 208);
}

export function ha1aTopGeometry() {
  // 厚い前板の天端と重ねず、その背面で天板を止める。
  const shape = outline(112, 277.8, 1, 1.6);
  for (const region of [-1, 1]) {
    for (let row = 0; row < 23; row += 1) {
      const y = region * (49 + row * 3.8);
      for (const x of [-28, 28]) {
        shape.holes.push(rectangularHole(x, y, 49, 1.45));
      }
    }
  }
  return plate(shape, 1.1, 112, 277.8);
}

export function ha1aRearGeometry() {
  const shape = outline(111, 205, 1);
  for (let row = 0; row < 9; row += 1) {
    for (const x of [-17, 17]) {
      shape.holes.push(rectangularHole(x, -55 - row * 5.2, 23, 2.2));
    }
  }
  shape.holes.push(rectangularHole(0, 7, 30, 32));
  return plate(shape, 1.6, 111, 205);
}
