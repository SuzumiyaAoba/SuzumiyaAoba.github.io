import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  MathUtils,
  RepeatWrapping,
  RGBAFormat,
} from "three";

// Sennheiser のシンボル形状。Simple Icons の sennheiser と同じ輪郭。
const symbolPath =
  "M0 3v18h24V3zm13.209 1.659c-1.428.548-2.799 1.757-3.905 4.182c-.321.703-.925 2.062-1.2 2.67c-2.224 4.882-3.364 5.932-6.72 5.932V4.35H13.15c.184-.011.235.25.06.309zm9.428 1.894V19.65H10.851c-.181.005-.227-.25-.055-.309c1.427-.548 2.798-1.757 3.904-4.182c.321-.703.926-2.062 1.2-2.67c2.22-4.882 3.36-5.932 6.716-5.932z";

function sampleGrain(grid: Float32Array, size: number, x: number, y: number) {
  const column = Math.floor(x);
  const row = Math.floor(y);
  const sx = MathUtils.smoothstep(x - column, 0, 1);
  const sy = MathUtils.smoothstep(y - row, 0, 1);
  const top = MathUtils.lerp(
    grid[(row % size) * size + (column % size)] ?? 0,
    grid[(row % size) * size + ((column + 1) % size)] ?? 0,
    sx
  );
  const bottom = MathUtils.lerp(
    grid[((row + 1) % size) * size + (column % size)] ?? 0,
    grid[((row + 1) % size) * size + ((column + 1) % size)] ?? 0,
    sx
  );
  return MathUtils.lerp(top, bottom, sy);
}

/** R: ショットブラストの凹凸、G: 粗さ、B: 金属の微細な色むら。 */
export function ie600GrainTexture() {
  const size = 512;
  let seed = 600;
  const random = () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  const coarse = Float32Array.from({ length: 48 * 48 }, random);
  const fine = Float32Array.from({ length: 128 * 128 }, random);
  const pixels = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const index = (row * size + column) * 4;
      const pebble = sampleGrain(
        coarse,
        48,
        (column * 48) / size,
        (row * 48) / size
      );
      const pores = sampleGrain(
        fine,
        128,
        (column * 128) / size,
        (row * 128) / size
      );
      const micro = random();
      pixels[index] = 60 + Math.round(pebble * 112 + pores * 52 + micro * 12);
      pixels[index + 1] = 180 + Math.round(pebble * 42 + pores * 17);
      pixels[index + 2] = 150 + Math.round(pebble * 58 + pores * 32);
      pixels[index + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function ie600EngravingTexture(side: number, rear: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create IE 600 engraving masks.");
  }
  context.fillStyle = "#000000";
  context.fillRect(0, 0, 1024, 1024);
  context.scale(1024 / 28, 1024 / 28);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ffffff";
  if (rear) {
    context.translate(20, 10);
    context.rotate(side === 1 ? 1.08 : 1.08 - Math.PI);
    context.scale(-side, 1);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "2.5px Arial";
    context.lineWidth = 0.075;
    context.strokeText("IE 600", 0, 0);
  } else {
    context.translate(11.8, 17.1);
    context.scale(side, 1);
    context.translate(-2.8, -2.1);
    context.scale(5.6 / 24, 4.2 / 18);
    context.translate(0, -3);
    context.fill(new Path2D(symbolPath));
  }
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}
