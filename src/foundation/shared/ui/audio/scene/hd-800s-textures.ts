import { createPreparedTexture } from "./prepared-textures";

export function createHd800sTextures() {
  const fabric = {
    color: createPreparedTexture("hd-fabric-color", true, true),
    height: createPreparedTexture("hd-fabric-height", false, true),
    roughness: createPreparedTexture("hd-fabric-roughness", false, true),
  };
  const metal = {
    roughness: createPreparedTexture("hd-metal-roughness", false, true),
  };
  const powder = {
    height: createPreparedTexture("hd-powder-height", false, true),
    roughness: createPreparedTexture("hd-powder-roughness", false, true),
  };
  const cloth = createPreparedTexture("hd-cloth", false, true);
  const mesh = {
    mask: createPreparedTexture("hd-mesh-mask", false, true),
    height: createPreparedTexture("hd-mesh-height", false, true),
  };
  for (const texture of Object.values(mesh)) {
    texture.repeat.set(100 / (32 * 0.4), 126 / (32 * 0.4));
  }
  const grille = createPreparedTexture("hd-grille-mask");
  const textures = [
    ...Object.values(fabric),
    ...Object.values(metal),
    ...Object.values(powder),
    cloth,
    ...Object.values(mesh),
    grille,
  ];
  return {
    fabric,
    metal,
    powder,
    cloth,
    mesh,
    grille,
    dispose() {
      for (const texture of textures) {
        texture.dispose();
      }
    },
  };
}
