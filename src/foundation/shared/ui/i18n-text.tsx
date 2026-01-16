"use client";

import type { ElementType, ReactNode } from "react";

type I18nTextProps<T extends ElementType = "span"> = {
  ja: ReactNode;
  en: ReactNode;
  as?: T;
  className?: string;
};

export function I18nText<T extends ElementType = "span">({
  ja,
  en,
  as,
  className,
}: I18nTextProps<T>) {
  const Component = (as ?? "span") as ElementType;

  return (
    <>
      <Component className={["lang-ja", className].filter(Boolean).join(" ")}>{ja}</Component>
      <Component className={["lang-en", className].filter(Boolean).join(" ")}>{en}</Component>
    </>
  );
}
