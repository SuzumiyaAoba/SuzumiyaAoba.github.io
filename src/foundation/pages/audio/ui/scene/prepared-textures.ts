import { RepeatWrapping, SRGBColorSpace, Texture } from "three";
import { bindTexture, getTextureImage } from "./texture-images";
import type { TextureName } from "./texture-images";

export function createPreparedTexture(
  name: TextureName,
  color = false,
  repeat = false
) {
  const texture = new Texture(getTextureImage(name));
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  if (color) {
    texture.colorSpace = SRGBColorSpace;
  }
  if (repeat) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
  }
  bindTexture(name, texture);
  return texture;
}
