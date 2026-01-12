import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { resolveContentRoot } from "@/shared/lib/content-root";

const contentTypeMap: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const root = await resolveContentRoot();
  const filePath = path.join(root, ...segments);

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = contentTypeMap[ext] ?? "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
