import { CanvasTexture, DataTexture } from "three";
import type { Texture } from "three";
import { createHd800sTextures } from "./hd-800s";
import { createHa1aTextures } from "./ha-1a";
import { createCinnamonBraidTextures } from "./cinnamon";
import { createKantofWoodTexture } from "./kantof";

function imageCanvas(texture: Texture): HTMLCanvasElement {
  if (texture.image instanceof HTMLCanvasElement) {
    return texture.image;
  }
  if (!(texture instanceof DataTexture) || !texture.image.data) {
    throw new Error("Cannot read audio texture pixels.");
  }
  const { width, height, data } = texture.image;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot capture audio texture.");
  }
  const pixels = context.createImageData(width, height);
  pixels.data.set(data);
  context.putImageData(pixels, 0, 0);
  return canvas;
}

/** Three.js は凹凸を R、粗さ・開口率を G から読む。元の線形値を一枚に格納する。 */
function packSurface(heightMap: Texture, greenMap: Texture) {
  const canvas = imageCanvas(heightMap);
  const green = imageCanvas(greenMap);
  const context = canvas.getContext("2d");
  const greenContext = green.getContext("2d");
  const { width, height } = canvas;
  if (
    !context ||
    !greenContext ||
    width !== green.width ||
    height !== green.height
  ) {
    throw new Error("Surface texture channels must have matching dimensions.");
  }
  const pixels = context.getImageData(0, 0, width, height);
  const channel = greenContext.getImageData(0, 0, width, height).data;
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i + 1] = channel[i + 1] ?? 0;
    pixels.data[i + 2] = channel[i + 1] ?? 0;
  }
  context.putImageData(pixels, 0, 0);
  return new CanvasTexture(canvas);
}

/** ビルド専用。ブラウザーへ配るモデルからはインポートしない。 */
function createAudioTextureSources() {
  const hd = createHd800sTextures();
  const ha = createHa1aTextures();
  const cinnamon = createCinnamonBraidTextures();
  return {
    "hd-fabric-color": hd.fabric.color,
    "hd-fabric-surface": packSurface(hd.fabric.height, hd.fabric.roughness),
    "hd-metal-roughness": hd.metal.roughness,
    "hd-cloth": hd.cloth,
    "hd-mesh-surface": packSurface(hd.mesh.height, hd.mesh.mask),
    "hd-grille-mask": hd.grille,
    "ha-wood": ha.wood,
    "wood-surface": packSurface(ha.woodHeight, ha.woodRoughness),
    "kantof-wood": createKantofWoodTexture(ha.wood),
    "ha-dial-anisotropy": ha.anisotropy,
    "ha-dial-bump": ha.bump,
    "cinnamon-braid-color": cinnamon.color,
    "cinnamon-braid-surface": packSurface(cinnamon.height, cinnamon.roughness),
  };
}

export function captureAudioTextureSources() {
  return Object.entries(createAudioTextureSources()).map(([name, texture]) => {
    const image = imageCanvas(texture);
    const [, png] = image.toDataURL("image/png").split(",");
    if (!png) {
      throw new Error(`Cannot encode audio texture: ${name}`);
    }
    return { name, width: image.width, height: image.height, png };
  });
}
