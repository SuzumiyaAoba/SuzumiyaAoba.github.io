import { CanvasTexture, SRGBColorSpace } from "three";

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function hash(u: number, v: number) {
  let seed = Math.imul(u + 137, 374_761_393) + Math.imul(v + 59, 668_265_263);
  // oxlint-disable-next-line no-bitwise -- 整数ハッシュの攪拌で、木目を再現可能にする。
  seed = Math.imul(seed ^ (seed >>> 13), 1_274_126_177);
  // oxlint-disable-next-line no-bitwise -- 符号なし 32 bit 値を 0〜1 へ正規化する。
  return ((seed ^ (seed >>> 16)) >>> 0) / 4_294_967_295;
}

function latticeNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sx = (x - x0) ** 2 * (3 - 2 * (x - x0));
  const sy = (y - y0) ** 2 * (3 - 2 * (y - y0));
  return mix(
    mix(hash(x0, y0), hash(x0 + 1, y0), sx),
    mix(hash(x0, y0 + 1), hash(x0 + 1, y0 + 1), sx),
    sy
  );
}

function woodFinishTextures() {
  const width = 1024;
  const height = 768;
  const surfaces = Array.from({ length: 3 }, () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Cannot create the Cayin wood finish.");
    }
    return { canvas, context, pixels: context.createImageData(width, height) };
  });
  const [color, relief, roughness] = surfaces;
  if (!color || !relief || !roughness) {
    throw new Error("Missing wood texture layers.");
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // 年輪と導管を異なる尺度で揺らす。ラッカーの凹凸へ色の縞を転用しない。
      const curl =
        latticeNoise(x / 280, y / 420) * 46 +
        latticeNoise(x / 145, y / 270) * 13;
      const flow = y + curl + 13 * Math.sin(x / 220 + y / 180);
      const broad = (latticeNoise(x / 460, flow / 100) - 0.5) * 39;
      const grain = (latticeNoise(x / 190, flow / 15) - 0.5) * 28;
      const fibers = (latticeNoise(x / 74, flow / 2.4) - 0.5) * 10;
      const pore = latticeNoise(x / 12, flow / 0.75) ** 12;
      const shade = broad + grain + fibers - pore * 17;
      const index = (y * width + x) * 4;
      color.pixels.data[index] = 151 + shade;
      color.pixels.data[index + 1] = 61 + shade * 0.63;
      color.pixels.data[index + 2] = 24 + shade * 0.36;
      color.pixels.data[index + 3] = 255;
      const bump = 132 - pore * 20 + fibers * 0.3;
      const matte = 161 + grain * 0.3 + pore * 12;
      for (let channel = 0; channel < 3; channel += 1) {
        relief.pixels.data[index + channel] = bump;
        roughness.pixels.data[index + channel] = matte;
      }
      relief.pixels.data[index + 3] = 255;
      roughness.pixels.data[index + 3] = 255;
    }
  }
  const textures = surfaces.map((surface) => {
    surface.context.putImageData(surface.pixels, 0, 0);
    const texture = new CanvasTexture(surface.canvas);
    texture.anisotropy = 8;
    return texture;
  });
  const [wood, woodHeight, woodRoughness] = textures;
  if (!wood || !woodHeight || !woodRoughness) {
    throw new Error("Cannot construct the wood texture set.");
  }
  wood.colorSpace = SRGBColorSpace;
  return { wood, woodHeight, woodRoughness };
}

function knobFaceTextures() {
  const size = 512;
  const directions = document.createElement("canvas");
  const machining = document.createElement("canvas");
  directions.width = size;
  directions.height = size;
  machining.width = size;
  machining.height = size;
  const directionContext = directions.getContext("2d");
  const machiningContext = machining.getContext("2d");
  if (!directionContext || !machiningContext) {
    throw new Error("Cannot create the machined dial-face finish.");
  }
  const vectors = directionContext.createImageData(size, size);
  const grooves = machiningContext.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - size / 2;
      const dy = size / 2 - y - 0.5;
      const distance = Math.hypot(dx, dy);
      const index = (y * size + x) * 4;
      vectors.data[index] = (0.5 - (dy / distance) * 0.5) * 255;
      vectors.data[index + 1] = (0.5 + (dx / distance) * 0.5) * 255;
      vectors.data[index + 2] = 255;
      vectors.data[index + 3] = 255;
      const shade = 180 + Math.sin(distance * 2.3) * 24;
      grooves.data[index] = shade;
      grooves.data[index + 1] = shade;
      grooves.data[index + 2] = shade;
      grooves.data[index + 3] = 255;
    }
  }
  directionContext.putImageData(vectors, 0, 0);
  machiningContext.putImageData(grooves, 0, 0);
  const anisotropy = new CanvasTexture(directions);
  const bump = new CanvasTexture(machining);
  anisotropy.anisotropy = 8;
  bump.anisotropy = 8;
  return { anisotropy, bump };
}

export function createHa1aTextures() {
  return { ...woodFinishTextures(), ...knobFaceTextures() };
}
