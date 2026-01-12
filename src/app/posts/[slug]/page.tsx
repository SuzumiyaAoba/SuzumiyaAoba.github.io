import type { Metadata } from "next";
import { getPostBySlug } from "@/entities/post";

type PageProps = {
  params?: { slug?: string } | Promise<{ slug?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  if (!slug) {
    return { title: "Posts" };
  }
  const post = await getPostBySlug(slug);
  const title = post?.slug || slug;
  return { title };
}

export { default } from "@/pages/posts/post";
