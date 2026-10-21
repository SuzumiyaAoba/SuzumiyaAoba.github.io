import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

type SurfacePoint = (u: number, v: number) => Vector3;

/** 赤いクッションの短い起毛。一本ずつ向きを変え、輪郭にも柔らかさを残す。 */
export function createClearMgPile(pointAt: SurfacePoint) {
  const positions: number[] = [];
  let seed = 245;
  const random = () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  for (let fiber = 0; fiber < 6500; fiber += 1) {
    const u = random() * Math.PI * 2;
    const v = random() * Math.PI * 2;
    const point = pointAt(u, v);
    const tangent = pointAt(u + 0.001, v)
      .sub(point)
      .normalize();
    const bitangent = pointAt(u, v + 0.001)
      .sub(point)
      .normalize();
    const normal = new Vector3().crossVectors(tangent, bitangent).normalize();
    const angle = random() * Math.PI * 2;
    const direction = tangent
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(bitangent, Math.sin(angle));
    const base = point.clone().addScaledVector(normal, 0.015);
    const tip = base
      .clone()
      .addScaledVector(normal, 0.08 + random() * 0.14)
      .addScaledVector(direction, 0.055);
    const left = base.clone().addScaledVector(direction, -0.025);
    const right = base.clone().addScaledVector(direction, 0.025);
    for (const vertex of [left, right, tip]) {
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
