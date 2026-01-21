/**
 * サイトで使用されるロケールの型定義
 */
export type Locale = "ja" | "en";

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
  if (locale === "en") {
    if (path === "/en" || path.startsWith("/en/")) {
      return path;
    }
    return path === "/" ? "/en" : `/en${path}`;
  }
  if (path === "/en") {
    return "/";
  }
  if (path.startsWith("/en/")) {
    return path.replace(/^\/en/, "");
  }
  return path;
}
