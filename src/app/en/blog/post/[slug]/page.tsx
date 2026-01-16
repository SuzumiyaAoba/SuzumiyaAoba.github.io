import type { Metadata } from "next";
import { getBlogPost, getBlogSlugs } from "@/entities/blog";

type PageProps = {
  params?: { slug?: string } | Promise<{ slug?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  if (!slug) {
    return { title: "Blog" };
  }
  const post = await getBlogPost(slug, { locale: "en", fallback: true });
  const title = post?.frontmatter.title || slug;
  const description = post?.frontmatter.category
    ? `${post.frontmatter.category} article.`
    : title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post?.frontmatter.date,
    },
  };
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export { default } from "../../../../blog/post/[slug]/page";
