/**
 * i18n設定
 *
 * このファイルは後方互換性のために維持されています。
 * 新しいコードでは @/config/i18n を使用してください。
 */
import { i18nConfig, getI18nOptions } from "@/config/i18n";

export const fallbackLng = i18nConfig.fallbackLng;
export const languages = i18nConfig.languages;
export const defaultNS = i18nConfig.defaultNS;
export const cookieName = i18nConfig.cookieName;

export function getOptions(lng?: string, ns?: string) {
  return getI18nOptions(lng, ns);
}
