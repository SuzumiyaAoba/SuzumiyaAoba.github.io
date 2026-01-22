/**
 * 解決されたサムネイル情報の型定義
 */
export type ResolvedThumbnail =
  | {
      /** 画像タイプ */
      type: "image";
      /** 画像のソースパス */
      src: string;
      /** フォールバック画像（デフォルト画像）かどうか */
      isFallback: boolean;
    }
  | {
      /** アイコンタイプ */
      type: "icon";
      /** アイコン名 (Iconify形式など) */
      icon: string;
    };

/**
 * アイコンとして扱う接頭辞のリスト
 */
const ICON_PREFIXES = ["icon:", "iconify:"] as const;

/**
 * 記事のスラッグとサムネイル文字列から、実際に表示可能なサムネイル情報を解決する
 * @param slug 記事のスラッグ
 * @param thumbnail 設定されているサムネイル文字列（パスまたはアイコン名）
 * @returns 解決されたサムネイル情報
 */
type ResolveThumbnailOptions = {
  basePath?: string;
};

export function resolveThumbnail(
  slug: string,
  thumbnail?: string,
  options: ResolveThumbnailOptions = {},
): ResolvedThumbnail {
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

  const basePath = (options.basePath ?? `/contents/blog/${slug}`).replace(/\/$/, "");
  let resolvedPath: string;
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/")
  ) {
    resolvedPath = normalized;
  } else {
    resolvedPath = `${basePath}/${normalized}`;
  }

  // Convert supported image formats to webp
  if (/\.(png|jpe?g)$/i.test(resolvedPath)) {
    resolvedPath = resolvedPath.replace(/\.(png|jpe?g)$/i, ".webp");
  }

  return { type: "image", src: resolvedPath, isFallback: resolvedPath === "/icon.svg" };
}
