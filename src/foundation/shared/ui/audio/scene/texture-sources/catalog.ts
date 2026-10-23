import { createHd800sTextures } from "./hd-800s";
import { createHa1aTextures } from "./ha-1a";

/** ビルド専用。ブラウザーへ配るモデルからはインポートしない。 */
export function createAudioTextureSources() {
  const hd = createHd800sTextures();
  const ha = createHa1aTextures();
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
    "ha-dial-anisotropy": ha.anisotropy,
    "ha-dial-bump": ha.bump,
  };
}

export function captureAudioTextureSources() {
  return Object.entries(createAudioTextureSources()).map(([name, texture]) => {
    const image: unknown = texture.image;
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
