import { mkdtemp, readdir, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, expect, it } from "vite-plus/test";
import { convertWebp } from "./convert-webp";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

async function temporaryCache() {
  const directory = await mkdtemp(path.join(tmpdir(), "content-webp-"));
  directories.push(directory);
  return directory;
}

async function image(width: number) {
  return await sharp({
    create: { width, height: 2, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
}

it("reuses an existing WebP without rewriting the cache", async () => {
  const directory = await temporaryCache();
  const source = await image(2);
  const first = await convertWebp(source, directory);
  const [filename] = await readdir(directory);
  if (!filename) {
    throw new Error("Expected a cached image");
  }
  const cacheFile = path.join(directory, filename);
  const oldTimestamp = new Date("2000-01-01T00:00:00Z");
  await utimes(cacheFile, oldTimestamp, oldTimestamp);

  await expect(convertWebp(source, directory)).resolves.toStrictEqual(first);
  expect((await stat(cacheFile)).mtime).toStrictEqual(oldTimestamp);
  expect((await sharp(first).metadata()).format).toBe("webp");
});

it("invalidates cached output when the source image changes", async () => {
  const directory = await temporaryCache();
  const first = await convertWebp(await image(2), directory);
  const second = await convertWebp(await image(4), directory);

  expect((await sharp(first).metadata()).width).toBe(2);
  expect((await sharp(second).metadata()).width).toBe(4);
});
