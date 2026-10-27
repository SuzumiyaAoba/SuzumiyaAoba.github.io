import { CanvasTexture, SRGBColorSpace } from "three";
import type { Texture } from "three";

/** Cayin の木目を別の色調に仕上げ、ウォールナットの導管を残す。 */
export function createKantofWoodTexture(source: Texture) {
  if (!(source.image instanceof HTMLCanvasElement)) {
    throw new Error("Cannot read the source wood grain.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = source.image.width;
  canvas.height = source.image.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the walnut finish.");
  }
  context.drawImage(source.image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const grain = (pixels.data[index] ?? 151) - 151;
    pixels.data[index] = 122 + grain;
    pixels.data[index + 1] = 87 + grain * 0.8;
    pixels.data[index + 2] = 64 + grain * 0.65;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
