/**
 * 生成元: src/foundation/shared/ui/audio/scene/texture-sources/
 * 再生成: npm run build:audio-textures（初回は npx playwright install chromium）
 * 検証: npm run check:audio-textures（ブラウザー不要）
 * 別の Chromium を使う場合: AUDIO_TEXTURE_BROWSER=/path/to/chromium
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";

const root = path.resolve(import.meta.dirname, "..");
const sceneDirectory = "src/foundation/shared/ui/audio/scene";
const manifestPath = path.join(root, sceneDirectory, "audio-textures.json");
const sourceFiles = ["catalog.ts", "hd-800s.ts", "ha-1a.ts"];
const hash = createHash("sha256");
const sources = await Promise.all(
  sourceFiles.map(async (file) => ({
    file,
    source: await readFile(
      path.join(root, sceneDirectory, "texture-sources", file)
    ),
  }))
);
for (const { file, source } of sources) {
  hash.update(file);
  hash.update(source);
}
const sourceHash = hash.digest("hex");
const textureSchema = z.object({
  url: z.string(),
  previewUrl: z.string(),
  width: z.number(),
  height: z.number(),
  digest: z.string(),
  previewDigest: z.string(),
});
const manifestSchema = z.object({
  sourceHash: z.string(),
  textures: z.record(z.string(), textureSchema),
});

if (process.argv.includes("--check")) {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf-8"))
  );
  if (manifest.sourceHash !== sourceHash) {
    throw new Error(
      "Audio textures are stale. Run npm run build:audio-textures."
    );
  }
  await Promise.all(
    Object.values(manifest.textures).flatMap((texture) =>
      [
        { url: texture.url, digest: texture.digest },
        { url: texture.previewUrl, digest: texture.previewDigest },
      ].map(async ({ url, digest }) => {
        const image = await readFile(path.join(root, "public", url));
        if (createHash("sha256").update(image).digest("hex") !== digest) {
          throw new Error(`Audio texture is missing or modified: ${url}`);
        }
      })
    )
  );
  console.log("Audio textures are up to date.");
} else {
  const { createServer } = await import("vite");
  const { chromium } = await import("playwright");
  const server = await createServer({
    configFile: false,
    root,
    server: { host: "127.0.0.1", port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({
      headless: true,
      ...(process.env["AUDIO_TEXTURE_BROWSER"]
        ? { executablePath: process.env["AUDIO_TEXTURE_BROWSER"] }
        : {}),
    });
    const page = await browser.newPage();
    const url = server.resolvedUrls?.local[0];
    if (!url) {
      throw new Error("Cannot start the audio texture generator.");
    }
    await page.goto(url);
    const images = await page.evaluate(async () => {
      const { captureAudioTextureSources } =
        await import("../src/foundation/shared/ui/audio/scene/texture-sources/catalog.ts");
      return captureAudioTextureSources();
    });
    const outputDirectory = path.join(root, "public/assets/audio/textures");
    await mkdir(outputDirectory, { recursive: true });
    const outputs = await Promise.all(
      images.map(async ({ name, width, height, png }) => {
        const source = Buffer.from(png, "base64");
        const [image, preview] = await Promise.all([
          sharp(source)
            .removeAlpha()
            .webp({ lossless: true, effort: 6 })
            .toBuffer(),
          sharp(source)
            .removeAlpha()
            .resize({ width: 128 })
            .webp({ lossless: true, effort: 6 })
            .toBuffer(),
        ]);
        const [originalPixels, encodedPixels] = await Promise.all([
          sharp(source).removeAlpha().raw().toBuffer(),
          sharp(image).removeAlpha().raw().toBuffer(),
        ]);
        if (!originalPixels.equals(encodedPixels)) {
          throw new Error(
            `Audio texture compression changed the pixels: ${name}`
          );
        }
        const digest = createHash("sha256").update(image).digest("hex");
        const previewDigest = createHash("sha256")
          .update(preview)
          .digest("hex");
        const filename = `${name}.${digest.slice(0, 12)}.webp`;
        const previewFilename = `${name}.${previewDigest.slice(0, 12)}.webp`;
        await Promise.all([
          writeFile(path.join(outputDirectory, filename), image),
          writeFile(path.join(outputDirectory, previewFilename), preview),
        ]);
        return {
          name,
          imageBytes: image.length,
          previewBytes: preview.length,
          files: [filename, previewFilename],
          texture: {
            url: `/assets/audio/textures/${filename}`,
            previewUrl: `/assets/audio/textures/${previewFilename}`,
            width,
            height,
            digest,
            previewDigest,
          },
        };
      })
    );
    const generatedFiles = new Set(outputs.flatMap((output) => output.files));
    await Promise.all(
      (await readdir(outputDirectory))
        .filter(
          (file) =>
            /\.[a-f0-9]{12}\.(?:png|webp)$/u.test(file) &&
            !generatedFiles.has(file)
        )
        .map(async (file) => {
          await unlink(path.join(outputDirectory, file));
        })
    );
    const textures = Object.fromEntries(
      outputs.map((output) => [output.name, output.texture])
    );
    await writeFile(
      manifestPath,
      `${JSON.stringify({ sourceHash, textures }, null, 2)}\n`
    );
    const imageBytes = outputs.reduce(
      (sum, output) => sum + output.imageBytes,
      0
    );
    const previewBytes = outputs.reduce(
      (sum, output) => sum + output.previewBytes,
      0
    );
    console.log(
      `Generated ${images.length} audio textures (preview ${Math.round(previewBytes / 1024)} KiB, full ${Math.round(imageBytes / 1024)} KiB).`
    );
  } finally {
    await browser?.close();
    await server.close();
  }
}
