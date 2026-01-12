import type { Metadata } from "next";
import { getBlogPost } from "@/entities/blog";

type PageProps = {
  params?: { slug?: string } | Promise<{ slug?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  if (!slug) {
    return { title: "Blog" };
  }
  const post = await getBlogPost(slug);
  const title = post?.frontmatter.title || slug;
  return { title };
}

export { default } from "@/pages/blog/post";
