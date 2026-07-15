import type { Locale } from "@/shared/lib/routing";

/**
 * サイトのLocaleをIntl API向けのロケールタグに変換する
 * @param locale サイトのロケール
 * @returns Intl API向けのロケールタグ("ja-JP" | "en-US")
 */
export function toIntlLocaleTag(locale: Locale): "ja-JP" | "en-US" {
  return locale === "en" ? "en-US" : "ja-JP";
}

/**
 * 日付文字列を指定されたロケールの形式にフォーマットする
 * @param date 日付文字列 (YYYY-MM-DD)
 * @param locale ロケール識別子
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: string, locale: string): string {
  if (!date) {
    return locale.startsWith("ja") ? "不明な日付" : "Unknown date";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Dateをオプション無しでロケール既定の形式にフォーマットする(ヒートマップの日付表示など)
 * @param date 日付
 * @param locale ロケール識別子
 * @returns フォーマットされた日付文字列
 */
export function formatDatePlain(date: Date, locale: string): string {
  return date.toLocaleDateString(locale);
}
