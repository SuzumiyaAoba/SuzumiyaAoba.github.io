import { notFound } from "next/navigation";

import { getBookMeta, getBookToc } from "@/entities/book";
import { bookContentBasePath } from "@/shared/lib/books";
import { renderMdx } from "@/shared/lib/mdx";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { BookDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ book: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale = "ja" }: PageProps) {
  const { book: bookSlug } = await params;

  const [meta, chapters] = await Promise.all([
    getBookMeta(bookSlug),
    getBookToc(bookSlug),
  ]);

  if (!meta) {
    notFound();
  }

  const bookTitle = meta.frontmatter.title || bookSlug;
  const bookPath = toLocalePath(`/books/${bookSlug}`, locale);

  // MDX は {#id} を JavaScript 式として解釈するため、見出しのカスタム ID アノテーションを事前に除去する
  const sanitizedLead = meta.lead.replace(
    /^(#{1,6}[^\n]*?)\s*\{#[^}]+\}\s*$/gm,
    "$1",
  );

  // リード文を MDX レンダリング（bookContentBasePath で ./images/... を解決）
  const leadContent = sanitizedLead
    ? await renderMdx(sanitizedLead, {
        basePath: bookContentBasePath(bookSlug),
        idPrefix: `${bookSlug}-lead-`,
      })
    : null;

  return (
    <BookDetailPageContent
      locale={locale}
      bookSlug={bookSlug}
      bookTitle={bookTitle}
      bookPath={bookPath}
      leadContent={leadContent}
      chapters={chapters}
    />
  );
}
