import { beforeEach, afterEach, expect, it, vi } from "vite-plus/test";
import type * as Images from "./texture-images";
import type * as Prepared from "./prepared-textures";
import manifest from "./audio-textures.json";

const requests = new Map<
  string,
  ReturnType<typeof Promise.withResolvers<undefined>>
>();
let textures: typeof Images & typeof Prepared;

class ImageStub {
  src = "";
  decoding = "";
  fetchPriority = "";
  async decode() {
    const pending = Promise.withResolvers<undefined>();
    requests.set(this.src, pending);
    await pending.promise;
  }
}

beforeEach(async () => {
  requests.clear();
  vi.resetModules();
  vi.stubGlobal("Image", ImageStub);
  textures = {
    ...(await import("./texture-images")),
    ...(await import("./prepared-textures")),
  };
});
afterEach(() => vi.unstubAllGlobals());

function resolveImages() {
  for (const request of requests.values()) {
    request.resolve(undefined);
  }
}

it("初回は軽量画像だけを読み込み、同じ画像の要求を共有する", async () => {
  const first = textures.preloadAudioTextures("system");
  const second = textures.preloadAudioTextures("hd-800s");
  const previews = new Set(
    Object.values(manifest.textures).map((source) => source.previewUrl)
  );
  expect(new Set(requests.keys())).toStrictEqual(previews);
  resolveImages();
  await Promise.all([first, second]);
  const texture = textures.createPreparedTexture("hd-fabric-color", true, true);
  expect(texture.colorSpace).toBe("srgb");
  texture.dispose();
});

it("USBケーブル単体では生成済みの編組画像だけを読み込む", async () => {
  const loading = textures.preloadAudioTextures("audioquest-cinnamon");
  const previews = Object.entries(manifest.textures)
    .filter(([name]) => name.startsWith("cinnamon-"))
    .map(([, source]) => source.previewUrl);
  expect(previews).toHaveLength(3);
  expect([...requests.keys()]).toStrictEqual(previews);
  resolveImages();
  await loading;
});

it("詳細画像へ更新しても材質が参照するTextureを交換せず、破棄済み資源は更新しない", async () => {
  const preview = textures.preloadAudioTextures("ha-1a-mk2");
  resolveImages();
  await preview;
  const active = textures.createPreparedTexture("ha-wood");
  const second = textures.createPreparedTexture("ha-wood");
  const disposed = textures.createPreparedTexture("ha-wood");
  const originalImage: unknown = active.image;
  const originalSource = active.source;
  active.repeat.set(3, 2);
  const releaseGpu = vi.fn<() => void>();
  active.addEventListener("dispose", releaseGpu);
  disposed.dispose();
  const upgrade = textures.upgradeAudioTextures("ha-1a-mk2");
  resolveImages();
  await expect(upgrade).resolves.toBe(true);
  expect(active.image).not.toBe(originalImage);
  expect(second.image).toBe(active.image);
  expect(active.source).not.toBe(originalSource);
  expect(active.repeat.toArray()).toStrictEqual([3, 2]);
  expect(releaseGpu).toHaveBeenCalledTimes(1);
  expect(disposed.image).toBe(originalImage);
  await expect(textures.upgradeAudioTextures("ha-1a-mk2")).resolves.toBe(false);
  expect(releaseGpu).toHaveBeenCalledTimes(1);
  active.dispose();
  second.dispose();
});

it("詳細画像の取得失敗時は軽量画像を維持し、再要求できる", async () => {
  const preview = textures.preloadAudioTextures("ha-1a-mk2");
  resolveImages();
  await preview;
  const texture = textures.createPreparedTexture("ha-wood");
  const originalImage: unknown = texture.image;
  const upgrade = textures.upgradeAudioTextures("ha-1a-mk2");
  const failure = observeFailure(upgrade);
  requests.get(manifest.textures["ha-wood"].url)?.reject(new Error("Offline"));
  resolveImages();
  await expect(failure).resolves.toMatchObject({
    message: `Cannot load audio texture: ${manifest.textures["ha-wood"].url}`,
  });
  expect(texture.image).toBe(originalImage);
  const retry = textures.upgradeAudioTextures("ha-1a-mk2");
  resolveImages();
  await expect(retry).resolves.toBe(true);
  texture.dispose();
});

async function observeFailure(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}
