import type { ReactElement } from "react";

import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
  type Locale,
} from "@/shared/lib/routing";
import { AmazonAssociate, AmazonProductSection } from "@/shared/ui/amazon";
import { BackLink } from "@/shared/ui/back-link";
import { Badge } from "@/shared/ui/badge";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Message } from "@/shared/ui/mdx";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";

export type NotesDetailPageContentProps = {
  locale: Locale;
  noteTitle: string;
  notePath: string;
  noteDate?: string;
  category?: string;
  tags: string[];
  isEn: boolean;
  translationModel?: string;
  originalPath: string;
  content: ReactElement;
  amazonProducts: AffiliateProduct[];
  shouldShowAmazonAssociate: boolean;
};

export function NotesDetailPageContent({
  locale,
  noteTitle,
  notePath,
  noteDate,
  category,
  tags,
  isEn,
  translationModel,
  originalPath,
  content,
  amazonProducts,
  shouldShowAmazonAssociate,
}: NotesDetailPageContentProps) {
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Notes", path: "/notes" },
    { name: noteTitle, path: notePath },
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={notePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="mx-auto flex-1 w-full max-w-6xl min-w-0 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        <section className="mb-10 space-y-3">
          <BackLink locale={locale} href="/notes" ja="← ノート一覧" en="← Back to notes" />
          {noteDate ? <p className="text-sm text-muted-foreground">{noteDate}</p> : null}
          <h1 className="text-3xl font-semibold break-words">{noteTitle}</h1>
          {category || tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {category ? (
                <Badge variant="outline" className="border-border/40 text-[11px] font-medium">
                  {category}
                </Badge>
              ) : null}
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Tag
                      key={`${locale}-${tag}`}
                      tag={tag}
                      href={toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale)}
                      className="bg-muted text-[11px] font-medium text-muted-foreground"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <article className="prose prose-neutral min-w-0 max-w-none font-sans">
          {isEn && translationModel ? (
            <Message title="Translation" variant="info" defaultOpen>
              This note was translated by {translationModel}. The original is{" "}
              <a href={originalPath}>here</a>.
            </Message>
          ) : null}
          <div>{content}</div>
        </article>

        {amazonProducts.length > 0 ? (
          <AmazonProductSection products={amazonProducts} className="mt-8" />
        ) : null}
        {shouldShowAmazonAssociate ? (
          <div className="mt-6">
            <AmazonAssociate />
          </div>
        ) : null}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
