import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshPhysicalMaterial,
} from "three";

/** 旋盤の同心円と接線方向。光の筋は照明・視点に追従する。 */
export function createTurnedFace() {
  const size = 256;
  const directions = new Uint8Array(size * size * 4);
  const heights = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - size / 2;
      const dy = y + 0.5 - size / 2;
      const distance = Math.hypot(dx, dy);
      const index = (y * size + x) * 4;
      directions[index] = (0.5 - (dy / distance) * 0.5) * 255;
      directions[index + 1] = (0.5 + (dx / distance) * 0.5) * 255;
      directions[index + 2] = 255;
      directions[index + 3] = 255;
      const groove = 127 + Math.sin(distance * 2.4) * 22;
      heights[index] = groove;
      heights[index + 1] = groove;
      heights[index + 2] = groove;
      heights[index + 3] = 255;
    }
  }
  const direction = new DataTexture(directions, size, size);
  const height = new DataTexture(heights, size, size);
  for (const texture of [direction, height]) {
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }
  return {
    material: new MeshPhysicalMaterial({
      color: 0xc4_c7_cb,
      metalness: 1,
      roughness: 0.3,
      anisotropy: 0.78,
      anisotropyMap: direction,
      bumpMap: height,
      bumpScale: 0.008,
    }),
    textures: [direction, height],
  };
}
