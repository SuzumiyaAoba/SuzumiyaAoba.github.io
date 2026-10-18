import type { AudioModel, AudioModelBuilder } from "../model/viewer";
import { preloadAudioTextures } from "./scene/texture-images";

// import のパスを固定し、未選択の単体モデルを初回のバンドルに含めない。
const loaders: Record<AudioModel, () => Promise<AudioModelBuilder>> = {
  system: async () => (await import("./scene/audio-system")).createAudioSystem,
  "ud-505": async () => (await import("./scene/ud-505")).createUd505,
  "cg-10m": async () => (await import("./scene/cg-10m")).createCg10m,
  "node-n130": async () => (await import("./scene/node-n130")).createNodeN130,
  "hd-800s": async () => (await import("./scene/hd-800s")).createHd800s,
  "clear-mg-pro": async () =>
    (await import("./scene/clear-mg-pro")).createClearMgPro,
  "ha-1a-mk2": async () => (await import("./scene/ha-1a-mk2")).createHa1aMk2,
  "ie-600": async () => {
    const { createIe600 } = await import("./scene/ie-600");
    return () => createIe600();
  },
  "sigma-pro": async () => (await import("./scene/sigma-pro")).createSigmaPro,
  btr17: async () => (await import("./scene/btr17")).createBtr17,
  "audioquest-cinnamon": async () =>
    (await import("./scene/audioquest-cinnamon")).createStandaloneCinnamon,
  "cybershaft-bnc": async () =>
    (await import("./scene/cybershaft-bnc")).createStandaloneCybershaftBnc,
};

export async function loadAudioModel(model: AudioModel) {
  const [builder] = await Promise.all([
    loaders[model](),
    preloadAudioTextures(model),
  ]);
  return builder;
}
