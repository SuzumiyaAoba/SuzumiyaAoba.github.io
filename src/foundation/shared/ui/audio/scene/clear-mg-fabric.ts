import {
  BufferGeometry,
  DataTexture,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from "three";
import { clearMgPadPerforations } from "./clear-mg-geometry";

type SurfacePoint = (u: number, v: number) => Vector3;

function fabricNoise(cells: number) {
  let seed = cells * 603;
  const samples = Array.from({ length: cells * cells }, () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  });
  const at = (x: number, y: number) =>
    samples[(y % cells) * cells + (x % cells)] ?? 0;
  return (x: number, y: number) => {
    const column = Math.floor(x);
    const row = Math.floor(y);
    const fx = x - column;
    const fy = y - row;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    return (
      (at(column, row) * (1 - u) + at(column + 1, row) * u) * (1 - v) +
      (at(column, row + 1) * (1 - u) + at(column + 1, row + 1) * u) * v
    );
  };
}

/** 起毛の濃淡・繊維の高さ・粗さを別々の色空間で扱う。 */
export function createClearMgFabricTextures() {
  const size = 512;
  const color = new Uint8Array(size * size * 4);
  const height = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  const napNoise = fabricNoise(24);
  const clumpNoise = fabricNoise(64);
  let seed = 603;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      seed = (seed * 48_271) % 2_147_483_647;
      const fiber = seed / 2_147_483_647;
      const nap = napNoise((x / size) * 24, (y / size) * 24);
      const clump = clumpNoise((x / size) * 64, (y / size) * 64);
      const index = (y * size + x) * 4;
      for (const [pixels, shade] of [
        [color, 183 + nap * 38 + clump * 18 + fiber * 16],
        [height, 85 + clump * 48 + fiber * 100],
        [roughness, 231 + nap * 14 + fiber * 10],
      ] as const) {
        pixels[index] = shade;
        pixels[index + 1] = shade;
        pixels[index + 2] = shade;
        pixels[index + 3] = 255;
      }
    }
  }
  const textures = {
    color: new DataTexture(color, size, size),
    height: new DataTexture(height, size, size),
    roughness: new DataTexture(roughness, size, size),
  };
  textures.color.colorSpace = SRGBColorSpace;
  for (const texture of Object.values(textures)) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(8, 2);
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }
  return textures;
}

/** 赤いクッションの短い起毛。一本ずつ向きを変え、輪郭にも柔らかさを残す。 */
export function createClearMgPile(pointAt: SurfacePoint) {
  const positions: number[] = [];
  const perforations = clearMgPadPerforations();
  let seed = 245;
  const random = () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  for (let fiber = 0; fiber < 6500; fiber += 1) {
    const u = random() * Math.PI * 2;
    const v = random() * Math.PI * 2;
    if (
      perforations.some((hole) => {
        const deltaU = Math.abs(u - hole.u);
        const deltaV = Math.abs(v - hole.v);
        const du = Math.min(deltaU, Math.PI * 2 - deltaU);
        const dv = Math.min(deltaV, Math.PI * 2 - deltaV);
        return (du / hole.radiusU) ** 2 + (dv / hole.radiusV) ** 2 < 1.2;
      })
    ) {
      continue;
    }
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
