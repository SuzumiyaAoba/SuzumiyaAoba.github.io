import { CanvasTexture, RepeatWrapping } from "three";

function cellOffset(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43_758.5453;
  return value - Math.floor(value);
}

/** 浅い多角形のシボと毛穴。色ではなく、革の表面の高さだけを生成する。 */
export function createLeatherGrain(
  width: number,
  height: number,
  cellSize: number,
  emboss?: (context: CanvasRenderingContext2D) => void
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the leather grain height map.");
  }
  const pixels = context.createImageData(width, height);
  const columns = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const px = (x / width) * columns;
      const py = (y / height) * rows;
      let nearest = 10;
      let second = 10;
      for (const dy of [-1, 0, 1]) {
        for (const dx of [-1, 0, 1]) {
          const cx = Math.floor(px) + dx;
          const cy = Math.floor(py) + dy;
          const wrappedX = (cx + columns) % columns;
          const wrappedY = (cy + rows) % rows;
          const distance = Math.hypot(
            px - cx - 0.2 - cellOffset(wrappedX, wrappedY) * 0.6,
            py - cy - 0.2 - cellOffset(wrappedY + 71, wrappedX + 19) * 0.6
          );
          if (distance < nearest) {
            second = nearest;
            nearest = distance;
          } else if (distance < second) {
            second = distance;
          }
        }
      }
      const ridge = Math.min(1, (second - nearest) * 6);
      const pores = cellOffset(x, y) * 10;
      const shade = 90 + ridge * 62 - nearest * 12 + pores;
      const index = (y * width + x) * 4;
      pixels.data[index] = shade;
      pixels.data[index + 1] = shade;
      pixels.data[index + 2] = shade;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  emboss?.(context);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
