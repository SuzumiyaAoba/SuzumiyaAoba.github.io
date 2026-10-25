import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WEBP_OPTIONS = { quality: 80 } as const;

/** 元画像・変換設定・エンコーダーのバージョンが同じなら、以前の変換結果を再利用する。 */
export async function convertWebp(
  source: Buffer,
  cacheDirectory = path.join(
    process.cwd(),
    "node_modules/.astro/content-images"
  )
): Promise<Buffer> {
  const key = createHash("sha256")
    .update(source)
    .update(JSON.stringify({ options: WEBP_OPTIONS, versions: sharp.versions }))
    .digest("hex");
  const cacheFile = path.join(cacheDirectory, `${key}.webp`);
  try {
    return await readFile(cacheFile);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  const converted = await sharp(source).webp(WEBP_OPTIONS).toBuffer();
  await mkdir(cacheDirectory, { recursive: true });
  // 並行ビルド中に、書き込み途中のキャッシュを読み込ませない。
  const temporaryFile = `${cacheFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, converted);
  await rename(temporaryFile, cacheFile);
  return converted;
}
