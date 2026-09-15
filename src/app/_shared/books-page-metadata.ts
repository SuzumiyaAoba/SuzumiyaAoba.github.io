import type { Metadata } from "next";
import { getBookMeta } from "@/entities/book";
import { buildPageMetadata } from "./page-metadata";

const DESCRIPTION_MAX_LENGTH = 120;

/**
 * 書籍の概要(Markdown)から meta description 用のプレーンテキストを抽出する。
 * 見出し記号・リンク・強調記法・画像・コードブロックを取り除き、規定の長さで切り詰める。
 */
function extractDescription(lead: string): string {
  const plain = lead
    .replaceAll(/```[\s\S]*?```/gu, "")
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/gu, "")
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replaceAll(/^#{1,6}\s+/gmu, "")
    .replaceAll(/[*_`>#]/gu, "")
    .replaceAll(/\{#[^}]+\}/gu, "")
    .replaceAll(/\s+/gu, " ")
    .trim();

  if (plain.length <= DESCRIPTION_MAX_LENGTH) {
    return plain;
  }
  return `${plain.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`;
}

/**
 * 書籍トップページの Metadata を構築する。
 * books は ja 版のみ存在するため hreflang は付与せず、canonical のみ設定する。
 */
export async function buildBooksPageMetadata(
  book: string | undefined
): Promise<Metadata> {
  if (!book) {
    return { title: "Books" };
  }

  const meta = await getBookMeta(book);
  if (!meta) {
    return { title: "Books" };
  }

  const title = meta.frontmatter.title || book;
  const description = meta.lead ? extractDescription(meta.lead) : title;

  return buildPageMetadata({
    title,
    description,
    path: `/books/${book}`,
    locale: "ja",
    alternates: { availability: { ja: true } },
    openGraph: { type: "book" },
  });
}
