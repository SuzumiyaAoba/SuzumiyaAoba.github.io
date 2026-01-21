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
  const post = await getBlogPost(slug);
  const title = post?.frontmatter.title || slug;
  // Use category or default description if available, otherwise fallback to title
  const description = post?.frontmatter.category
    ? `Articles about ${post.frontmatter.category}.`
    : title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post?.frontmatter.date,
      // Dynamic OG image is automatically handled by Next.js when opengraph-image.tsx is present
      // but explicitly defining it is also fine if we wanted to customize alt text etc.
      // For now, we rely on the file-based API implicit behavior or we can add it explicitly if needed.
    },
  };
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export { default } from "@/pages/blog/post";
