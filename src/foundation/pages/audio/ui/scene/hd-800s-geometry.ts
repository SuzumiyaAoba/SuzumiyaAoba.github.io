import { BufferGeometry, Float32BufferAttribute, Shape, Vector3 } from "three";

export const hd800sDriver = { x: 2, y: -7, tilt: -0.16 } as const;

/** The housing is swept and fuller at the bottom; it is not a concentric ellipse. */
export function cupContour(theta: number, inset = 0, z = 0) {
  const sine = Math.sin(theta);
  return new Vector3(
    (49 - inset - 3 * sine) * Math.cos(theta) + 5 * sine,
    (62 - inset) * sine + 1.5 * Math.sin(theta * 2),
    z
  );
}

export function cupOutline(inset = 0) {
  const outline = new Shape();
  for (let index = 0; index <= 160; index += 1) {
    const point = cupContour((index / 160) * Math.PI * 2, inset);
    if (index === 0) {
      outline.moveTo(point.x, point.y);
    } else {
      outline.lineTo(point.x, point.y);
    }
  }
  outline.closePath();
  return outline;
}

export function cupContourPoints(inset: number, z: number) {
  return Array.from({ length: 160 }, (_, index) =>
    cupContour((index / 160) * Math.PI * 2, inset, z)
  );
}

export function headbandCushionGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segments = 96;
  const sections = 32;
  for (let index = 0; index <= segments; index += 1) {
    const theta = Math.PI * (0.15 + (index / segments) * 0.7);
    for (let section = 0; section <= sections; section += 1) {
      const phi = (section / sections) * Math.PI * 2;
      const radius = 3.7 * Math.cos(phi);
      positions.push(
        (76 + radius) * Math.cos(theta),
        136 + (80 + radius) * Math.sin(theta),
        11.8 * Math.sin(phi)
      );
      uvs.push(index / segments, section / sections);
      if (index < segments && section < sections) {
        const vertex = index * (sections + 1) + section;
        const next = vertex + sections + 1;
        indices.push(vertex, next, vertex + 1, next, next + 1, vertex + 1);
      }
    }
  }
  for (const end of [0, segments]) {
    const theta = Math.PI * (0.15 + (end / segments) * 0.7);
    const center = positions.length / 3;
    positions.push(76 * Math.cos(theta), 136 + 80 * Math.sin(theta), 0);
    uvs.push(end / segments, 0.5);
    for (let section = 0; section < sections; section += 1) {
      const vertex = end * (sections + 1) + section;
      if (end === 0) {
        indices.push(center, vertex, vertex + 1);
      } else {
        indices.push(center, vertex + 1, vertex);
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

function padPoint(theta: number, phi: number) {
  const inset = 8.8 - 8.1 * Math.cos(phi);
  const compression = 1 - 0.06 * Math.cos(theta * 2);
  const wrinkle = Math.sin(theta * 23 + phi * 3) * Math.sin(phi) * 0.08;
  return cupContour(
    theta,
    inset,
    -11.5 - 7.3 * Math.sin(phi) * compression + wrinkle
  );
}

/** The steel baffle rises from the perimeter to the angled, offset driver bezel. */
function bafflePoint(theta: number, fraction: number, lift = 0) {
  const outer = cupContour(theta, 7.5, 3.2);
  const driverX = Math.cos(theta) * 34.8;
  const inner = new Vector3(
    hd800sDriver.x + driverX * Math.cos(hd800sDriver.tilt),
    hd800sDriver.y + Math.sin(theta) * 34.8,
    13.2 - driverX * Math.sin(hd800sDriver.tilt)
  );
  return outer.lerp(inner, fraction).add(new Vector3(0, 0, lift));
}

export function acousticBaffleGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segments = 160;
  const rings = 12;
  for (let around = 0; around <= segments; around += 1) {
    const theta = (around / segments) * Math.PI * 2;
    for (let ring = 0; ring <= rings; ring += 1) {
      const point = bafflePoint(theta, ring / rings);
      positions.push(point.x, point.y, point.z);
      uvs.push(point.x / 100 + 0.5, point.y / 126 + 0.5);
      if (around < segments && ring < rings) {
        const vertex = around * (rings + 1) + ring;
        const next = vertex + rings + 1;
        indices.push(vertex, next, vertex + 1, next, next + 1, vertex + 1);
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

/** Narrow braces follow the sloping baffle instead of floating over a flat plate. */
export function baffleBraceGeometry(theta: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const segments = 12;
  for (const lift of [0.15, 2.1]) {
    for (let index = 0; index <= segments; index += 1) {
      const fraction = index / segments;
      const halfAngle = 0.045 + fraction * 0.012;
      for (const angle of [theta - halfAngle, theta + halfAngle]) {
        const point = bafflePoint(angle, fraction, lift);
        positions.push(point.x, point.y, point.z);
      }
    }
  }
  const layer = (segments + 1) * 2;
  for (let index = 0; index < segments; index += 1) {
    const vertex = index * 2;
    indices.push(
      vertex,
      vertex + 2,
      vertex + 1,
      vertex + 2,
      vertex + 3,
      vertex + 1
    );
    const top = vertex + layer;
    indices.push(top, top + 1, top + 2, top + 2, top + 1, top + 3);
    indices.push(
      vertex,
      vertex + layer,
      vertex + 2,
      vertex + 2,
      vertex + layer,
      vertex + layer + 2
    );
    const other = vertex + 1;
    indices.push(
      other,
      other + 2,
      other + layer,
      other + 2,
      other + layer + 2,
      other + layer
    );
  }
  indices.push(0, 1, layer, 1, layer + 1, layer);
  const end = segments * 2;
  indices.push(
    end,
    end + layer,
    end + 1,
    end + 1,
    end + layer,
    end + layer + 1
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

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
      const point = padPoint(theta, phi);
      positions.push(point.x, point.y, point.z);
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

/** 遠景用のドーム。細かい開口は生成済みのアルファ画像で表す。 */
export function distantGrilleGeometry() {
  const radius = 28.5;
  const segments = 64;
  const rings = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const r = (ring / rings) * radius;
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      positions.push(x, y, domeHeight(x, y, radius));
      uvs.push(x / (radius * 2) + 0.5, y / (radius * 2) + 0.5);
      if (ring > 0 && segment > 0) {
        const current = ring * (segments + 1) + segment;
        const previous = current - segments - 1;
        indices.push(
          previous - 1,
          current - 1,
          previous,
          previous,
          current - 1,
          current
        );
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
    const point = padPoint(theta, phi);
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
