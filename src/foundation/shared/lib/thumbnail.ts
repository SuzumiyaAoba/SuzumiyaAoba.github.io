export type ResolvedThumbnail =
  | {
      type: "image";
      src: string;
      isFallback: boolean;
    }
  | {
      type: "icon";
      icon: string;
    };

const ICON_PREFIXES = ["icon:", "iconify:"] as const;

export function resolveThumbnail(slug: string, thumbnail?: string): ResolvedThumbnail {
  if (!thumbnail) {
    return { type: "image", src: "/icon.svg", isFallback: true };
  }

  const normalized = thumbnail.trim();
  for (const prefix of ICON_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      const icon = normalized.slice(prefix.length).trim();
      return { type: "icon", icon: icon || "lucide:image" };
    }
  }

  let resolvedPath: string;
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/")
  ) {
    resolvedPath = normalized;
  } else {
    resolvedPath = `/contents/blog/${slug}/${normalized}`;
  }

  // Convert supported image formats to webp
  if (/\.(png|jpe?g)$/i.test(resolvedPath)) {
    resolvedPath = resolvedPath.replace(/\.(png|jpe?g)$/i, ".webp");
  }

  return { type: "image", src: resolvedPath, isFallback: resolvedPath === "/icon.svg" };
}
