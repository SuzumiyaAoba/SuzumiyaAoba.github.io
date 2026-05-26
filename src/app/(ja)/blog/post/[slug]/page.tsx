import type { Metadata } from "next";
import { getBlogPost, getBlogSlugs } from "@/entities/blog";
import BlogPostPage from "@/pages/blog/post";

type MetadataProps = {
  params?: Promise<{ slug?: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  if (!slug) {
    return { title: "Blog" };
  }
  const post = await getBlogPost(slug);
  const title = post?.frontmatter.title || slug;
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
    },
  };
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageComponentProps = {
  params: Promise<{ slug: string }>;
};

export default function Page(props: PageComponentProps) {
  return <BlogPostPage {...props} locale="ja" />;
}
