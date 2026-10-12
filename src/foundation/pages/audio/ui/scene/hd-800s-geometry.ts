import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

/** Rounded pad with a continuous pillow cross-section, rather than an extruded flat annulus. */
export function earPadGeometry() {
  const aroundSegments = 160;
  const sectionSegments = 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let around = 0; around <= aroundSegments; around += 1) {
    const theta = (around / aroundSegments) * Math.PI * 2;
    for (let section = 0; section <= sectionSegments; section += 1) {
      const phi = (section / sectionSegments) * Math.PI * 2;
      const compression = 1 - 0.06 * Math.cos(theta * 2);
      const wrinkle = Math.sin(theta * 23 + phi * 3) * Math.sin(phi) * 0.12;
      positions.push(
        (41 + 8 * Math.cos(phi)) * Math.cos(theta),
        (53 + 9 * Math.cos(phi)) * Math.sin(theta),
        -13 - 8.2 * Math.sin(phi) * compression + wrinkle
      );
      uvs.push((around / aroundSegments) * 3, section / sectionSegments);
      if (around < aroundSegments && section < sectionSegments) {
        const index = around * (sectionSegments + 1) + section;
        const next = index + sectionSegments + 1;
        indices.push(index, index + 1, next, next, index + 1, next + 1);
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

function domeHeight(x: number, y: number, radius: number) {
  return 3.8 * Math.max(0, 1 - (x * x + y * y) / (radius * radius));
}

/** Honeycomb apertures and beveled walls are actual geometry, shared by both ear cups. */
export function honeycombGrilleGeometry() {
  const radius = 28.5;
  const cellRadius = 0.68;
  const holeRadius = 0.51;
  const rowHeight = Math.sqrt(3) * cellRadius;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let column = -28; column <= 28; column += 1) {
    const centerX = column * cellRadius * 1.5;
    for (let row = -27; row <= 27; row += 1) {
      const centerY = (row + (Math.abs(column) % 2) * 0.5) * rowHeight;
      if (Math.hypot(centerX, centerY) > radius - cellRadius) {
        continue;
      }
      const start = positions.length / 3;
      for (const [ringRadius, depth] of [
        [cellRadius, 0],
        [holeRadius + 0.045, 0],
        [holeRadius, -0.14],
        [holeRadius, -0.38],
      ] as const) {
        for (let corner = 0; corner < 6; corner += 1) {
          const angle = (corner / 6) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * ringRadius;
          const y = centerY + Math.sin(angle) * ringRadius;
          positions.push(x, y, domeHeight(x, y, radius) + depth);
          uvs.push(x / (radius * 2) + 0.5, y / (radius * 2) + 0.5);
        }
      }
      for (let ring = 0; ring < 3; ring += 1) {
        for (let corner = 0; corner < 6; corner += 1) {
          const next = (corner + 1) % 6;
          const outer = start + ring * 6;
          const inner = outer + 6;
          indices.push(
            outer + corner,
            outer + next,
            inner + corner,
            outer + next,
            inner + next,
            inner + corner
          );
        }
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

/** Short fiber blades soften the pad silhouette and share one draw call per ear cup. */
export function microfiberPileGeometry() {
  const positions: number[] = [];
  let seed = 800;
  const random = () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  for (let fiber = 0; fiber < 9000; fiber += 1) {
    const theta = random() * Math.PI * 2;
    const phi = random() * Math.PI;
    const compression = 1 - 0.06 * Math.cos(theta * 2);
    const wrinkle = Math.sin(theta * 23 + phi * 3) * Math.sin(phi) * 0.12;
    const point = new Vector3(
      (41 + 8 * Math.cos(phi)) * Math.cos(theta),
      (53 + 9 * Math.cos(phi)) * Math.sin(theta),
      -13 - 8.2 * Math.sin(phi) * compression + wrinkle
    );
    const normal = new Vector3(
      Math.cos(phi) * Math.cos(theta),
      Math.cos(phi) * Math.sin(theta),
      -Math.sin(phi)
    ).normalize();
    const tangent = new Vector3(-Math.sin(theta), Math.cos(theta), 0);
    const bitangent = new Vector3().crossVectors(normal, tangent).normalize();
    const length = 0.11 + random() * 0.19;
    const width = 0.03 + random() * 0.025;
    const tip = point
      .clone()
      .addScaledVector(normal, length)
      .addScaledVector(tangent, (random() - 0.5) * 0.12);
    for (const direction of [tangent, bitangent]) {
      const a = point.clone().addScaledVector(direction, -width);
      const b = point.clone().addScaledVector(direction, width);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, tip.x, tip.y, tip.z);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Decal UVs follow the physical surface, so lettering never floats above a curved part. */
export function arcLabelGeometry(
  radius: number,
  height: number,
  start: number,
  end: number
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segments = 96;
  for (let index = 0; index <= segments; index += 1) {
    const theta = start + (end - start) * (index / segments);
    for (const [r, v] of [
      [radius - height / 2, 1],
      [radius + height / 2, 0],
    ] as const) {
      positions.push(Math.cos(theta) * r, Math.sin(theta) * r, 0);
      uvs.push(index / segments, v);
    }
    if (index < segments) {
      const vertex = index * 2;
      indices.push(
        vertex,
        vertex + 1,
        vertex + 2,
        vertex + 1,
        vertex + 3,
        vertex + 2
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function ovalPoints(rx: number, ry: number, z: number) {
  return Array.from({ length: 160 }, (_, index) => {
    const angle = (index / 160) * Math.PI * 2;
    return new Vector3(Math.cos(angle) * rx, Math.sin(angle) * ry, z);
  });
}

export function headbandLabelGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segments = 48;
  for (let index = 0; index <= segments; index += 1) {
    const theta = Math.PI * (0.58 - (index / segments) * 0.16);
    for (const [z, v] of [
      [-2.5, 1],
      [2.5, 0],
    ] as const) {
      positions.push(85.58 * Math.cos(theta), 136 + 89.58 * Math.sin(theta), z);
      uvs.push(index / segments, v);
    }
    if (index < segments) {
      const vertex = index * 2;
      indices.push(
        vertex,
        vertex + 1,
        vertex + 2,
        vertex + 1,
        vertex + 3,
        vertex + 2
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
