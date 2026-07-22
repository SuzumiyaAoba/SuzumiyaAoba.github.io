import type { Metadata } from "next";
import { getBlogPostSummariesVariants } from "@/entities/blog";
import type { Locale } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "./locale-alternates";

export function decodeTag(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

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
  locale: Locale,
): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const tagParam = resolvedParams?.tag;
  if (!tagParam) {
    return { title: "Tags" };
  }
  const tag = decodeTag(tagParam);

  const posts = await getBlogPostSummariesVariants();
  const count = posts.filter((post) => {
    const target = locale === "en" ? (post.en ?? post.ja) : (post.ja ?? post.en);
    return (target?.frontmatter.tags ?? []).includes(tag);
  }).length;

  const title = `Tag: ${tag}`;
  const description =
    locale === "en"
      ? `Posts tagged "${tag}" (${count}).`
      : `「${tag}」タグの記事一覧（${count}件）。`;

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/tags/${encodeURIComponent(tag)}`, locale),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

/**
 * タグ詳細ページの generateStaticParams。ja/en で完全に共通。
 */
export async function buildTagPageStaticParams(): Promise<Array<{ tag: string }>> {
  const posts = await getBlogPostSummariesVariants();
  const tags = new Set<string>();
  posts.forEach((post) => {
    (post.ja?.frontmatter.tags ?? []).forEach((tag) => tags.add(tag));
    (post.en?.frontmatter.tags ?? []).forEach((tag) => tags.add(tag));
  });

  return [...tags.values()]
    .filter((tag) => typeof tag === "string" && tag.length > 0)
    .flatMap((tag) => {
      const encoded = encodeURIComponent(tag);
      if (tag === encoded) {
        return [{ tag }];
      }
      return [{ tag }, { tag: encoded }];
    });
}
