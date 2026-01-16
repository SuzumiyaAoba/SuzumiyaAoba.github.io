import type { ElementType, ReactNode } from "react";
import type { Locale } from "@/shared/lib/locale-path";

type I18nTextProps<T extends ElementType = "span"> = {
  ja: ReactNode;
  en: ReactNode;
  locale: Locale;
  as?: T;
  className?: string;
};

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
