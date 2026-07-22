import { getBookMeta, getBookSlugs } from "@/entities/book";
import {
  CONTENT_OPENGRAPH_IMAGE_SIZE,
  renderContentOpengraphImage,
} from "@/app/_shared/content-opengraph-image";

export const size = CONTENT_OPENGRAPH_IMAGE_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams(): Promise<Array<{ book: string }>> {
  const slugs = await getBookSlugs();
  return slugs.map((book) => ({ book }));
}

export default async function Image({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params;
  const meta = await getBookMeta(book);
  return renderContentOpengraphImage({
    eyebrow: "書籍",
    title: meta?.frontmatter.title || book,
  });
}
