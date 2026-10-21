import { ExtrudeGeometry, Path, Shape } from "three";

/** 平面に十字を描く代わりに、面取りされたねじ頭へ工具穴を切る。 */
export function screwHeadGeometry() {
  const head = new Shape();
  head.absarc(0, 0, 1.58, 0, Math.PI * 2, false);
  const recess = new Path();
  const points = [
    [-0.18, 0.95],
    [0.18, 0.95],
    [0.18, 0.18],
    [0.95, 0.18],
    [0.95, -0.18],
    [0.18, -0.18],
    [0.18, -0.95],
    [-0.18, -0.95],
    [-0.18, -0.18],
    [-0.95, -0.18],
    [-0.95, 0.18],
    [-0.18, 0.18],
  ] as const;
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) {
      recess.moveTo(x, y);
    } else {
      recess.lineTo(x, y);
    }
  }
  recess.closePath();
  head.holes.push(recess);
  return new ExtrudeGeometry(head, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.07,
    bevelSegments: 3,
    curveSegments: 24,
  });
}
