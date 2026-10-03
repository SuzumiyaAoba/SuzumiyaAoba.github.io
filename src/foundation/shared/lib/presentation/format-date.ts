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

/** YYYY-MM-DD をタイムゾーンの影響を受けずに解釈する。不正な値は null。 */
function parseCalendarDate(date: string): Date | null {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * 年見出しの下に並べる短い日付（「5月28日」「May 28」）にフォーマットする
 * @param date 日付文字列 (YYYY-MM-DD)
 * @param locale ロケール識別子
 * @returns フォーマットされた日付文字列。解釈できない場合は入力をそのまま返す
 */
export function formatMonthDay(date: string, locale: string): string {
  const parsed = parseCalendarDate(date);
  if (!parsed) {
    return date;
  }
  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * 日付の年部分を返す（年ごとのまとまりの見出し用）
 * @param date 日付文字列 (YYYY-MM-DD)
 * @returns 4 桁の年。解釈できない場合は空文字
 */
export function yearOf(date: string): string {
  return parseCalendarDate(date)?.getUTCFullYear().toString() ?? "";
}
