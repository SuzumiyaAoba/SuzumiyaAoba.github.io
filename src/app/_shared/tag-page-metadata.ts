import { decodePathParam } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { Metadata } from "next";
import { getAllBlogTags, getBlogTagIndex } from "@/entities/blog";
import { buildPageMetadata } from "./page-metadata";

export { decodePathParam as decodeTag } from "@/shared/lib/routing";

export type TagPageMetadataProps = {
  params: Promise<{ tag?: string }>;
};

/**
 * タグ詳細ページの generateMetadata を組み立てる。
 * タグ一覧は ja/en 双方の記事から集約した共通集合のため、両ロケールで
 * 常に同じ slug のページが生成される。hreflang は双方向に設定する。
 */
export async function buildTagPageMetadata(
  { params }: TagPageMetadataProps,
  locale: Locale
): Promise<Metadata> {
  const { tag: tagParam } = await params;
  if (!tagParam) {
    return { title: "Tags" };
  }
  const tag = decodePathParam(tagParam);

  const index = await getBlogTagIndex(locale);
  const count = index.get(tag)?.length ?? 0;

  const title = `Tag: ${tag}`;
  const description =
    locale === "en"
      ? `Posts tagged "${tag}" (${count}).`
      : `「${tag}」タグの記事一覧（${count}件）。`;

  return buildPageMetadata({
    title,
    description,
    path: `/tags/${encodeURIComponent(tag)}`,
    locale,
  });
}

/**
 * タグ詳細ページの generateStaticParams。ja/en で完全に共通。
 */
export async function buildTagPageStaticParams(): Promise<{ tag: string }[]> {
  const tags = await getAllBlogTags();
  return tags.flatMap(({ name: tag }) => {
    const encoded = encodeURIComponent(tag);
    if (tag === encoded) {
      return [{ tag }];
    }
    return [{ tag }, { tag: encoded }];
  });
}
