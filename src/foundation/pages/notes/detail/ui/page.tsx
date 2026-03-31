import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { getNoteVariants } from "@/entities/note";
import { getAffiliateProductsByIds, type AffiliateProduct } from "@/shared/lib/affiliate-products";
import { resolveContentRoot } from "@/shared/lib/content-root";
import { renderMdx } from "@/shared/lib/mdx";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { NotesDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ slug: string }>;
  locale?: Locale;
};

function extractAmazonProductIdsFromMdx(source: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  const componentRegex = /<AmazonProductSection\b[\s\S]*?>/g;
  const idsPropRegex = /\bids\s*=\s*({[\s\S]*?}|"[^"]*"|'[^']*')/;

  for (const match of source.matchAll(componentRegex)) {
    const tag = match[0];
    const idsMatch = tag.match(idsPropRegex);
    if (!idsMatch) {
      continue;
    }
    const rawValue = idsMatch[1]?.trim() ?? "";
    let candidates: string[] = [];
    if (rawValue.startsWith("{") && rawValue.endsWith("}")) {
      const inner = rawValue.slice(1, -1);
      const quoted = [...inner.matchAll(/"([^"]+)"|'([^']+)'/g)];
      candidates = quoted
        .map((quotedValue) => quotedValue[1] ?? quotedValue[2])
        .filter((value): value is string => Boolean(value));
    } else if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      candidates = [rawValue.slice(1, -1)];
    }

    for (const candidate of candidates) {
      const normalized = candidate.trim();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      results.push(normalized);
    }
  }

  return results;
}

async function loadMdxScope(source: string, slug: string): Promise<Record<string, unknown>> {
  const importRegex = /^import\s+(\w+)\s+from\s+["'](.+\.json)["'];/gm;
  const matches = [...source.matchAll(importRegex)];
  if (matches.length === 0) {
    return {};
  }

  const root = await resolveContentRoot();
  const baseDir = path.join(root, "notes", slug);
  const scope: Record<string, unknown> = {};

  for (const match of matches) {
    const [, name, relPath] = match;
    if (!name || !relPath) {
      continue;
    }
    const filePath = path.join(baseDir, relPath);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      scope[name] = JSON.parse(raw) as unknown;
    } catch {
      continue;
    }
  }

  return scope;
}

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

  const scopePromise = primaryContent
    ? loadMdxScope(primaryContent, slug)
    : fallbackContent
      ? loadMdxScope(fallbackContent, slug)
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
