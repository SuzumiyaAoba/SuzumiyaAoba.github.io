import { BufferGeometry, Float32BufferAttribute, Shape, Vector3 } from "three";
import { hd800sGrilleHeight } from "./hd-800s-grille";

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
      const notch = 3.1 * Math.exp(-(((theta - Math.PI / 2) / 0.105) ** 4));
      const radius = 3.7 * Math.cos(phi) + notch * Math.max(0, -Math.cos(phi));
      positions.push(
        (91 + radius) * Math.cos(theta),
        136 + (73 + radius) * Math.sin(theta),
        17.5 * Math.sin(phi)
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
    positions.push(91 * Math.cos(theta), 136 + 73 * Math.sin(theta), 0);
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

export function hd800sPadPoint(theta: number, phi: number) {
  const radial = Math.sign(Math.cos(phi)) * Math.abs(Math.cos(phi)) ** 0.6;
  const depth = Math.sign(Math.sin(phi)) * Math.abs(Math.sin(phi)) ** 0.6;
  const inset = 9.7 - 9 * radial;
  const compression = 1 - 0.06 * Math.cos(theta * 2);
  const wrinkle = Math.sin(theta * 23 + phi * 3) * Math.sin(phi) * 0.08;
  return cupContour(theta, inset, -11.5 - 8.5 * depth * compression + wrinkle);
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
      const point = hd800sPadPoint(theta, phi);
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
      positions.push(x, y, hd800sGrilleHeight(x, y));
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
    const point = hd800sPadPoint(theta, phi);
    const tangent = hd800sPadPoint(theta + 0.001, phi)
      .sub(point)
      .normalize();
    const section = hd800sPadPoint(theta, phi + 0.001)
      .sub(point)
      .normalize();
    const normal = new Vector3().crossVectors(section, tangent).normalize();
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
  end: number,
  slope = 0
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
      positions.push(
        Math.cos(theta) * r,
        Math.sin(theta) * r,
        (r - radius) * slope
      );
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
    const theta = Math.PI * (0.568 - (index / segments) * 0.136);
    for (const [z, v] of [
      [-2.5, 1],
      [2.5, 0],
    ] as const) {
      positions.push(
        100.58 * Math.cos(theta),
        136 + 82.58 * Math.sin(theta),
        z
      );
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

/** ケーブルの L / R 刻印を、円錐状のゴムスリーブへ沿わせる。 */
export function cableLabelGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < 2; row += 1) {
    const y = -19 + row * 4;
    const radius =
      y >= -18 ? 2.25 + (y + 18) * 0.09 : 2.25 + ((y + 18) * 0.6) / 7;
    for (let index = 0; index <= 16; index += 1) {
      const angle = (index / 16 - 0.5) * 1.2;
      positions.push(
        (radius + 0.012) * Math.sin(angle),
        y,
        (radius + 0.012) * Math.cos(angle)
      );
      uvs.push(index / 16, row);
    }
  }
  for (let index = 0; index < 16; index += 1) {
    indices.push(
      index,
      index + 1,
      index + 17,
      index + 1,
      index + 18,
      index + 17
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
