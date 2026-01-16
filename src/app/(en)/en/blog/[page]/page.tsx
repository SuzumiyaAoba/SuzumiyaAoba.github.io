import type { Metadata } from "next";
import { getBlogPosts } from "@/entities/blog";
import BlogPage from "@/pages/blog/page";

type PageProps = {
  params?: { page?: string } | Promise<{ page?: string }>;
};

const POSTS_PER_PAGE = 10;

function getPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const pageNumber = Number(resolvedParams?.page);
  const title = Number.isFinite(pageNumber) ? `Blog Page ${pageNumber}` : "Blog";
  return { title };
}

export async function generateStaticParams(): Promise<Array<{ page: string }>> {
  const posts = await getBlogPosts();
  const pageCount = getPageCount(posts.length);
  return Array.from({ length: pageCount }, (_, index) => ({
    page: String(index + 1),
  }));
}

type PageComponentProps = {
  params: Promise<{ page: string }>;
};

export default function Page(props: PageComponentProps) {
  return <BlogPage {...props} locale="en" />;
}
