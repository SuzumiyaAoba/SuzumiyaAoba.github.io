"use client";

import { useTranslations } from "next-intl";

type TProps = {
  id: string;
  values?: Parameters<ReturnType<typeof useTranslations>>[1];
  fallback?: string;
  className?: string;
};

export function T({ id, values, fallback, className }: TProps) {
  const t = useTranslations();

  let text: string;
  try {
    text = t(id, values);
  } catch {
    text = fallback ?? id;
  }

  return <span className={className}>{text}</span>;
}
