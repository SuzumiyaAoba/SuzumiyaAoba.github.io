import type { ElementType, ReactNode } from "react";
import type { Locale } from "@/shared/lib/locale-path";

/**
 * I18nText コンポーネントのプロップス
 */
type I18nTextProps<T extends ElementType = "span"> = {
  /** 日本語のコンテンツ */
  ja: ReactNode;
  /** 英語のコンテンツ */
  en: ReactNode;
  /** 現在のロケール */
  locale: Locale;
  /** レンダリングするHTMLタグ（デフォルトは "span"） */
  as?: T;
  /** クラス名 */
  className?: string;
};

/**
 * ロケールに応じて表示するテキストを切り替えるコンポーネント
 * @param props 翻訳コンテンツ、ロケール、HTMLタグなど
 */
export function I18nText<T extends ElementType = "span">({
  ja,
  en,
  locale,
  as,
  className,
}: I18nTextProps<T>) {
  const Component = (as ?? "span") as ElementType;
  const text = locale === "en" ? en : ja;
  return <Component className={className}>{text}</Component>;
}
