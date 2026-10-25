import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

async function preserveImageUrls(directory: string): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await preserveImageUrls(filename);
      } else if (entry.name === "opengraph-image.png") {
        // 既存の拡張子なし URL も維持し、メタデータには PNG の MIME を配信できる URL を使う。
        await fs.copyFile(filename, filename.slice(0, -4));
      }
    })
  );
}

export function staticAssets(): AstroIntegration {
  return {
    name: "static-image-urls",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        await preserveImageUrls(fileURLToPath(dir));
      },
    },
  };
}
