/**
 * サイトで使用されるロケールの型定義
 */
export type Locale = "ja" | "en";

/**
 * 未指定の場合のデフォルトロケール("ja")を補って解決する
 */
export function resolveLocale(locale: Locale | undefined): Locale {
  return locale ?? "ja";
}

const pathsWithoutTrailingSlash = new Set(["/rss.xml", "/en/rss.xml"]);

function normalizeTrailingSlash(path: string): string {
  const match = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);

  if (!match) {
    return path;
  }

  const [, pathname = "", search = "", hash = ""] = match;

  if (
    !pathname ||
    pathname === "/" ||
    pathname.endsWith("/") ||
    pathsWithoutTrailingSlash.has(pathname)
  ) {
    return path;
  }

  return `${pathname}/${search}${hash}`;
}

/**
 * パスを指定したロケールのパスに変換する
 * @param path オリジナルのパス
 * @param locale 対象のロケール
 * @returns ロケールプレフィックスが付与（または削除）されたパス
 */
export function toLocalePath(path: string, locale: Locale): string {
  if (!path.startsWith("/")) {
    return path;
  }
  if (path.startsWith("/contents")) {
    return path;
  }

  let localizedPath = path;

  if (locale === "en") {
    if (path === "/en" || path.startsWith("/en/")) {
      localizedPath = path;
    } else {
      localizedPath = path === "/" ? "/en" : `/en${path}`;
    }
  } else if (path === "/en") {
    localizedPath = "/";
  } else if (path.startsWith("/en/")) {
    localizedPath = path.replace(/^\/en/, "");
  }

  return normalizeTrailingSlash(localizedPath);
}
