import type { Metadata } from "next";

import BookDetailPage from "@/pages/books/detail";
import { getBookSlugs } from "@/entities/book";
import { buildBooksPageMetadata } from "@/app/_shared/books-page-metadata";

type PageProps = {
  params: Promise<{ book: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { book } = await params;
  return buildBooksPageMetadata(book);
}

export async function generateStaticParams(): Promise<Array<{ book: string }>> {
  const slugs = await getBookSlugs();
  return slugs.map((book) => ({ book }));
}

export default function Page(props: PageProps) {
  return <BookDetailPage {...props} />;
}
