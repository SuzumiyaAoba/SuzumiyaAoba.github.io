import type { Locale } from "./locale-path";

export type LocalizedValue<T> = Record<Locale, T | null>;

/** 指定言語が存在しない場合に限り、もう一方の言語にフォールバックする。 */
export function resolveLocalizedValue<T>(values: LocalizedValue<T>, locale: Locale): T | null {
  return values[locale] ?? values[locale === "ja" ? "en" : "ja"];
}
