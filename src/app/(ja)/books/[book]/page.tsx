import type { Metadata } from "next";

import BookDetailPage from "@/pages/books/detail";
import { getBookMeta, getBookSlugs } from "@/entities/book";

type PageProps = {
  params: Promise<{ book: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { book } = await params;
  const meta = await getBookMeta(book);
  const title = meta?.frontmatter.title || book;
  return { title };
}

export async function generateStaticParams(): Promise<Array<{ book: string }>> {
  const slugs = await getBookSlugs();
  return slugs.map((book) => ({ book }));
}

export default function Page(props: PageProps) {
  return <BookDetailPage {...props} />;
}
