"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

type TProps = {
  id: string;
  values?: Record<string, ReactNode>;
  fallback?: string;
  className?: string;
};

export function T({ id, values, fallback, className }: TProps) {
  if (typeof window === "undefined") {
    return null;
  }
  const t = useTranslations();

  let text = "";
  try {
    text = t(id, values as never);
  } catch {
    text = fallback ?? id;
  }

  return <span className={className}>{text}</span>;
}
