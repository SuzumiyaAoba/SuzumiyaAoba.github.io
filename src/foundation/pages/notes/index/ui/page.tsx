import fs from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";

import { resolveContentRoot } from "@/shared/lib/content-root";
import { renderMdx } from "@/shared/lib/mdx";
import { getAffiliateProductsByIds, type AffiliateProduct } from "@/shared/lib/affiliate-products";
import { type Locale } from "@/shared/lib/routing";
import { getNotesVariants } from "../lib";
import { NotesIndexPageContent, type NoteEntry } from "./page-content";

type PageProps = {
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
        .map((q) => q[1] ?? q[2])
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

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const notes = await getNotesVariants();

  const entries = (
    await Promise.all(
      notes.map(async (variant): Promise<NoteEntry | null> => {
        const note =
          resolvedLocale === "ja" ? (variant.ja ?? variant.en) : (variant.en ?? variant.ja);
        if (!note) {
          return null;
        }

        const productIdsInContent = extractAmazonProductIdsFromMdx(note.content);
        const explicitProductIds = (note.frontmatter.amazonProductIds ?? []).filter(
          (id) => !productIdsInContent.includes(id),
        );

        const scopePromise = loadMdxScope(note.content, variant.slug);
        const amazonProductsPromise: Promise<AffiliateProduct[]> =
          explicitProductIds.length > 0
            ? getAffiliateProductsByIds(explicitProductIds)
            : Promise.resolve([]);

        const [scope, amazonProducts]: [Record<string, unknown>, AffiliateProduct[]] =
          await Promise.all([scopePromise, amazonProductsPromise]);

        const content: ReactElement = await renderMdx(note.content, {
          basePath: `/contents/notes/${variant.slug}`,
          scope,
          idPrefix: `${variant.slug}-`,
        });

        return {
          slug: variant.slug,
          title: note.frontmatter.title || variant.slug,
          tags: note.frontmatter.tags ?? [],
          content,
          amazonProducts,
          shouldShowAmazonAssociate:
            productIdsInContent.length > 0 ||
            amazonProducts.length > 0 ||
            Boolean(note.frontmatter.amazonAssociate),
          ...(note.frontmatter.date ? { date: note.frontmatter.date } : {}),
          ...(note.frontmatter.category ? { category: note.frontmatter.category } : {}),
        };
      }),
    )
  ).filter((entry): entry is NoteEntry => Boolean(entry));

  return <NotesIndexPageContent locale={resolvedLocale} notes={entries} />;
}
