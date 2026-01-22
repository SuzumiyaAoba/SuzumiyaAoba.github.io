import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { resolveContentRoot } from "@/shared/lib/content-root";

export const dynamic = "force-static";

const contentTypeMap: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".json": "application/json",
};

/**
 * 外部ファイルを読み込むためのヘルパー
 * Turbopack の過剰なディレクトリ解析を避けるためにラップする
 */
async function readFileHelper(filePath: string): Promise<Buffer> {
  return await fs.readFile(filePath);
}

async function collectFilePaths(root: string, current: string): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFilePaths(root, entryPath)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (ext === ".md" || ext === ".mdx") {
      continue;
    }

    files.push(path.relative(root, entryPath));

    // Add .webp for supported image formats
    if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      files.push(path.relative(root, entryPath.replace(ext, ".webp")));
    }
  }

  return files;
}

export async function generateStaticParams(): Promise<Array<{ path: string[] }>> {
  const root = await resolveContentRoot();
  const files = await collectFilePaths(root, root);
  return files.map((file) => ({ path: file.split(path.sep) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const root = await resolveContentRoot();
  const filePath = path.join(root, ...segments);

  try {
    // Check if the file exists directly
    try {
      const file = await readFileHelper(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = contentTypeMap[ext] ?? "application/octet-stream";

      return new NextResponse(file as unknown as BodyInit, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }

      // If file not found, check if it's a requested .webp derived from an existing image
      if (filePath.endsWith(".webp")) {
        const extensions = [".png", ".jpg", ".jpeg"];
        let sourcePath: string | null = null;

        for (const ext of extensions) {
          const possibleSource = filePath.replace(/\.webp$/, ext);
          try {
            await fs.access(possibleSource);
            sourcePath = possibleSource;
            break;
          } catch {
            continue;
          }
        }

        if (sourcePath) {
          const source = await readFileHelper(sourcePath);
          const webp = await sharp(source).webp().toBuffer();

          return new NextResponse(webp as unknown as BodyInit, {
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }

      throw error;
    }
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
