import path from "node:path";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { getNoteVariants } from "@/entities/note";
import { getAffiliateProductsByIds, type AffiliateProduct } from "@/shared/lib/affiliate-products";
import { resolveContentRoot } from "@/shared/lib/content-file";
import { extractAmazonProductIdsFromMdx, loadMdxScope, renderMdx } from "@/shared/lib/mdx";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { NotesDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ slug: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const isEn = resolvedLocale === "en";
  const { slug } = await params;
  const { ja: noteJa, en: noteEn } = await getNoteVariants(slug);
  const note = isEn ? (noteEn ?? noteJa) : (noteJa ?? noteEn);

  if (!note) {
    notFound();
  }

  const noteTitleJa = noteJa?.frontmatter.title || note.slug;
  const noteTitleEn = noteEn?.frontmatter.title || noteTitleJa;
  const noteTitle = isEn ? noteTitleEn : noteTitleJa;
  const category = note.frontmatter.category;
  const tags = note.frontmatter.tags ?? [];
  const notePath = toLocalePath(`/notes/${slug}`, resolvedLocale);
  const translationModel = noteEn?.frontmatter.model;
  const originalPath = toLocalePath(`/notes/${slug}`, "ja");
  const primaryContent = isEn ? noteEn?.content : noteJa?.content;
  const fallbackContent = isEn ? noteJa?.content : noteEn?.content;
  const contentSource = primaryContent ?? fallbackContent ?? note.content;
  const productIdsInContent = extractAmazonProductIdsFromMdx(contentSource);
  const explicitProductIds = note.frontmatter.amazonProductIds ?? [];
  const excludedIdsInContent = new Set(productIdsInContent);
  const explicitProductIdsForFooter = explicitProductIds.filter(
    (id) => !excludedIdsInContent.has(id),
  );

  const noteDir = path.join(await resolveContentRoot(), "notes", slug);
  const scopePromise = primaryContent
    ? loadMdxScope(primaryContent, noteDir)
    : fallbackContent
      ? loadMdxScope(fallbackContent, noteDir)
      : Promise.resolve({});
  const contentPromise = renderMdx(contentSource, {
    basePath: `/contents/notes/${slug}`,
    scope: await scopePromise,
    idPrefix: `${slug}-`,
  });
  const amazonProductsPromise: Promise<AffiliateProduct[]> =
    explicitProductIdsForFooter.length > 0
      ? getAffiliateProductsByIds(explicitProductIdsForFooter)
      : Promise.resolve([]);
  const [content, amazonProducts]: [ReactElement, AffiliateProduct[]] = await Promise.all([
    contentPromise,
    amazonProductsPromise,
  ]);
  const shouldShowAmazonAssociate =
    productIdsInContent.length > 0 ||
    amazonProducts.length > 0 ||
    Boolean(note.frontmatter.amazonAssociate);

  const detailProps = {
    locale: resolvedLocale,
    noteTitle,
    notePath,
    tags,
    isEn,
    originalPath,
    content,
    amazonProducts,
    shouldShowAmazonAssociate,
    ...(note.frontmatter.date ? { noteDate: note.frontmatter.date } : {}),
    ...(category ? { category } : {}),
    ...(translationModel ? { translationModel } : {}),
  };

  return <NotesDetailPageContent {...detailProps} />;
}
