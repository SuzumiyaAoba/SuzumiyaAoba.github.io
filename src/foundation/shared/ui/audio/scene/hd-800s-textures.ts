import { createPreparedTexture } from "./prepared-textures";

export function createHd800sTextures() {
  const fabric = {
    color: createPreparedTexture("hd-fabric-color", true, true),
    surface: createPreparedTexture("hd-fabric-surface", false, true),
  };
  const metal = {
    roughness: createPreparedTexture("hd-metal-roughness", false, true),
  };
  const cloth = createPreparedTexture("hd-cloth", false, true);
  const mesh = createPreparedTexture("hd-mesh-surface", false, true);
  // 経糸・緯糸が一巡する2ピッチ分をバッフルの実寸に合わせて繰り返す。
  mesh.repeat.set(100 / (2 * 0.22), 126 / (2 * 0.22));
  mesh.center.set(0.5, 0.5);
  mesh.rotation = Math.PI / 4;
  const grille = createPreparedTexture("hd-grille-mask");
  const textures = [
    ...Object.values(fabric),
    ...Object.values(metal),
    cloth,
    mesh,
    grille,
  ];
  return {
    fabric,
    metal,
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
