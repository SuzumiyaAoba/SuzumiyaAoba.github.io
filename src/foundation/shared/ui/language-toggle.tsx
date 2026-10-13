import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

/**
 * LanguageToggle コンポーネントのプロップス
 */
type LanguageToggleProps = {
  /** 現在のロケール */
  locale: Locale;
  /** 切り替え後の遷移先ベースパス */
  path: string;
};

/**
 * 表示言語の切り替え。旗や翻訳アイコンは使わず、切り替え先の言語名をその言語で書く。
 * @param props ロケールと遷移パス
 */
export function LanguageToggle({ locale, path }: LanguageToggleProps) {
  const targetLocale: Locale = locale === "ja" ? "en" : "ja";
  const targetPath = toLocalePath(path, targetLocale);
  const label =
    targetLocale === "en" ? "Read this site in English" : "日本語で読む";

  return (
    <a
      href={targetPath}
      hrefLang={targetLocale}
      lang={targetLocale}
      className="language-toggle"
      title={label}
    >
      {targetLocale === "en" ? "English" : "日本語"}
    </a>
  );
}
