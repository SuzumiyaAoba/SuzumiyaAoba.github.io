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
  // 周囲一列を折り返しておき、画素ごとの九近傍で同じ乱数を計算し直さない。
  const stride = columns + 2;
  const offsetsX = new Float64Array(stride * (rows + 2));
  const offsetsY = new Float64Array(offsetsX.length);
  for (let cy = -1; cy <= rows; cy += 1) {
    for (let cx = -1; cx <= columns; cx += 1) {
      const cell = (cy + 1) * stride + cx + 1;
      const wrappedX = (cx + columns) % columns;
      const wrappedY = (cy + rows) % rows;
      offsetsX[cell] = cellOffset(wrappedX, wrappedY) * 0.6;
      offsetsY[cell] = cellOffset(wrappedY + 71, wrappedX + 19) * 0.6;
    }
  }
  for (let y = 0; y < height; y += 1) {
    shadeLeatherRow(
      width,
      columns,
      y,
      (y / height) * rows,
      pixels,
      offsetsX,
      offsetsY
    );
  }
  context.putImageData(pixels, 0, 0);
  emboss?.(context);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function shadeLeatherRow(
  width: number,
  columns: number,
  y: number,
  py: number,
  pixels: ImageData,
  offsetsX: Float64Array,
  offsetsY: Float64Array
) {
  const row = Math.floor(py);
  for (let x = 0; x < width; x += 1) {
    const px = (x / width) * columns;
    const column = Math.floor(px);
    let nearest = Infinity;
    let second = Infinity;
    for (let cy = row - 1; cy <= row + 1; cy += 1) {
      for (let cx = column - 1; cx <= column + 1; cx += 1) {
        const cell = (cy + 1) * (columns + 2) + cx + 1;
        const dx = px - cx - 0.2 - (offsetsX[cell] ?? 0);
        const dy = py - cy - 0.2 - (offsetsY[cell] ?? 0);
        const distance = dx * dx + dy * dy;
        if (distance < nearest) {
          second = nearest;
          nearest = distance;
        } else if (distance < second) {
          second = distance;
        }
      }
    }
    const distance = Math.sqrt(nearest);
    const ridge = Math.min(1, (Math.sqrt(second) - distance) * 6);
    const pores = cellOffset(x, y) * 10;
    const shade = 90 + ridge * 62 - distance * 12 + pores;
    const index = (y * width + x) * 4;
    pixels.data[index] = shade;
    pixels.data[index + 1] = shade;
    pixels.data[index + 2] = shade;
    pixels.data[index + 3] = 255;
  }
}
