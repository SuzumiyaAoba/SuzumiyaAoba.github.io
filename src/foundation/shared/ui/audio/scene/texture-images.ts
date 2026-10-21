import type { Texture } from "three";
import type { AudioModel } from "@/shared/ui/audio/definitions/viewer";
import manifest from "./audio-textures.json";

export type TextureName = keyof typeof manifest.textures;
const decoded = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<void>>();
const bindings = new Map<string, Set<Texture>>();
const groups: Partial<Record<AudioModel, readonly string[]>> = {
  system: ["hd-", "ha-"],
  "hd-800s": ["hd-"],
  "ha-1a-mk2": ["ha-"],
};

async function decodeImage(url: string, priority: "high" | "low") {
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = priority;
  image.src = url;
  try {
    await image.decode();
    decoded.set(url, image);
  } catch (error) {
    pending.delete(url);
    throw new Error(`Cannot load audio texture: ${url}`, { cause: error });
  }
}

async function loadImage(url: string, priority: "high" | "low") {
  const existing = pending.get(url);
  if (existing) {
    await existing;
    return;
  }
  const request = decodeImage(url, priority);
  pending.set(url, request);
  await request;
}

function modelTextures(model: AudioModel) {
  const prefixes = groups[model] ?? [];
  return Object.entries(manifest.textures).filter(([name]) =>
    prefixes.some((prefix) => name.startsWith(prefix))
  );
}

export async function preloadAudioTextures(model: AudioModel) {
  await Promise.all(
    modelTextures(model).map(async ([, texture]) => {
      await loadImage(texture.previewUrl, "high");
    })
  );
}

/** 初回描画後に元の解像度へ更新する。失敗時も軽量画像で表示を続けられる。 */
export async function upgradeAudioTextures(model: AudioModel) {
  const textures = modelTextures(model);
  await Promise.all(
    textures.map(async ([, texture]) => {
      await loadImage(texture.url, "low");
    })
  );
  let changed = false;
  for (const [name, source] of textures) {
    const image = decoded.get(source.url);
    for (const texture of bindings.get(name) ?? []) {
      if (image && texture.image !== image) {
        texture.image = image;
        texture.needsUpdate = true;
        changed = true;
      }
    }
  }
  return changed;
}

export function getTextureImage(name: TextureName) {
  const source = manifest.textures[name];
  const image = decoded.get(source.url) ?? decoded.get(source.previewUrl);
  if (!image) {
    throw new Error(`Audio texture was not prepared: ${name}`);
  }
  return image;
}

export function bindTexture(name: TextureName, texture: Texture) {
  const textures = bindings.get(name) ?? new Set<Texture>();
  textures.add(texture);
  bindings.set(name, textures);
  texture.addEventListener("dispose", () => {
    textures.delete(texture);
  });
}
