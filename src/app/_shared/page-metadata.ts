import type { Metadata } from "next";
import type { Locale } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "./locale-alternates";
import type { BuildLocaleAlternatesOptions } from "./locale-alternates";

/** ページ本文の説明とOGP、言語別URLを一緒に組み立てる。取得と説明文の選択は各ページが担う。 */
export function buildPageMetadata({
  title,
  description,
  path,
  locale,
  alternates,
  openGraph = { type: "website" },
}: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  alternates?: BuildLocaleAlternatesOptions;
  openGraph?: NonNullable<Metadata["openGraph"]>;
}): Metadata {
  return {
    title,
    description,
    alternates: buildLocaleAlternates(path, locale, alternates),
    openGraph: { ...openGraph, title, description },
  };
}
