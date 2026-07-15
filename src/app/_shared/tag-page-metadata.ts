import type { Metadata } from "next";
import { getBlogPostSummariesVariants } from "@/entities/blog";

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
 * タグ詳細ページの generateMetadata。ja/en で完全に共通。
 */
export async function buildTagPageMetadata({ params }: TagPageMetadataProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const tagParam = resolvedParams?.tag;
  if (!tagParam) {
    return { title: "Tags" };
  }
  const tag = decodeTag(tagParam);
  return { title: `Tag: ${tag}` };
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
