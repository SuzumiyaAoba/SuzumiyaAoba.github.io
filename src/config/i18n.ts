/**
 * 国際化（i18n）設定
 */
export const i18nConfig = {
  fallbackLng: "ja",
  languages: ["ja", "en"],
  defaultNS: "common",
  cookieName: "i18next",
  storageKey: "preferred-language",
} as const;

export type Language = (typeof i18nConfig.languages)[number];

/**
 * i18next オプションを取得
 */
export function getI18nOptions(lng?: Language | string, ns?: string) {
  const language = lng || i18nConfig.fallbackLng;
  const namespace = ns || i18nConfig.defaultNS;
  return {
    supportedLngs: i18nConfig.languages,
    fallbackLng: i18nConfig.fallbackLng,
    lng: language,
    fallbackNS: i18nConfig.defaultNS,
    defaultNS: i18nConfig.defaultNS,
    ns: namespace,
  };
}
