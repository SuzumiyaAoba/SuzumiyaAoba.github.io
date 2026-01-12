import type { Metadata } from "next";
import { getBlogPosts } from "@/entities/blog";

function decodeTag(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

type PageProps = {
  params?: { tag?: string } | Promise<{ tag?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const tagParam = resolvedParams?.tag;
  if (!tagParam) {
    return { title: "Tags" };
  }
  const tag = decodeTag(tagParam);
  return { title: `Tag: ${tag}` };
}

export async function generateStaticParams(): Promise<Array<{ tag: string }>> {
  const posts = await getBlogPosts();
  const tags = new Set<string>();
  posts.forEach((post) => {
    (post.frontmatter.tags ?? []).forEach((tag) => tags.add(tag));
  });

  return [...tags.values()].map((tag) => ({ tag }));
}

export { default } from "@/pages/tags/tag";
