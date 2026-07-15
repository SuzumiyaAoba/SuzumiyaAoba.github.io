import type { Metadata } from "next";
import { getBlogSlugs } from "@/entities/blog";
import { buildBlogPostMetadata } from "@/app/_shared/blog-post-metadata";
import BlogPostPage from "@/pages/blog/post";

type PageProps = {
  params: Promise<{ slug?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  return buildBlogPostMetadata(resolvedParams?.slug, "en");
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageComponentProps = {
  params: Promise<{ slug: string }>;
};

export default function Page(props: PageComponentProps) {
  return <BlogPostPage {...props} locale="en" />;
}
