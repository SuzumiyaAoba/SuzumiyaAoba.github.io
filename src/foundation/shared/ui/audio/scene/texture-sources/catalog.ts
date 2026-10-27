import { createHd800sTextures } from "./hd-800s";
import { createHa1aTextures } from "./ha-1a";
import { createCinnamonBraidTextures } from "./cinnamon";
import { createKantofWoodTexture } from "./kantof";
import { DataTexture } from "three";

/** ビルド専用。ブラウザーへ配るモデルからはインポートしない。 */
function createAudioTextureSources() {
  const hd = createHd800sTextures();
  const ha = createHa1aTextures();
  const cinnamon = createCinnamonBraidTextures();
  return {
    "hd-fabric-color": hd.fabric.color,
    "hd-fabric-height": hd.fabric.height,
    "hd-fabric-roughness": hd.fabric.roughness,
    "hd-metal-roughness": hd.metal.roughness,
    "hd-powder-height": hd.powder.height,
    "hd-powder-roughness": hd.powder.roughness,
    "hd-cloth": hd.cloth,
    "hd-mesh-mask": hd.mesh.mask,
    "hd-mesh-height": hd.mesh.height,
    "hd-grille-mask": hd.grille,
    "ha-wood": ha.wood,
    "ha-wood-height": ha.woodHeight,
    "ha-wood-roughness": ha.woodRoughness,
    "kantof-wood": createKantofWoodTexture(ha.wood),
    "ha-dial-anisotropy": ha.anisotropy,
    "ha-dial-bump": ha.bump,
    "cinnamon-braid-color": cinnamon.color,
    "cinnamon-braid-height": cinnamon.height,
    "cinnamon-braid-roughness": cinnamon.roughness,
  };
}

export function captureAudioTextureSources() {
  return Object.entries(createAudioTextureSources()).map(([name, texture]) => {
    let image: unknown = texture.image;
    if (texture instanceof DataTexture) {
      const source = texture.image;
      if (source.data === null) {
        throw new Error(`Audio texture has no pixel data: ${name}`);
      }
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error(`Cannot capture audio texture: ${name}`);
      }
      const pixels = context.createImageData(source.width, source.height);
      pixels.data.set(source.data);
      context.putImageData(pixels, 0, 0);
      image = canvas;
    }
    if (!(image instanceof HTMLCanvasElement)) {
      throw new Error(`Audio texture source is not a canvas: ${name}`);
    }
    const [, png] = image.toDataURL("image/png").split(",");
    if (!png) {
      throw new Error(`Cannot encode audio texture: ${name}`);
    }
    return { name, width: image.width, height: image.height, png };
  });
}
