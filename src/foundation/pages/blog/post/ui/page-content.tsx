import type { ReactElement } from "react";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { Comments } from "@/shared/ui/comments";
import { Badge } from "@/shared/ui/badge";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";
import { AmazonAssociate, AmazonProductSection } from "@/shared/ui/amazon";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { getSiteUrl } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Button } from "@/shared/ui/button";
import { Message } from "@/shared/ui/mdx";
import { Icon } from "@iconify/react";
import { Separator } from "@/shared/ui/separator";
import { Toc } from "./toc";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

/**
 * ブログ記事詳細ページの表示用コンポーネントのプロパティ
 */
export type BlogPostPageContentProps = {
  /** 描画ロケール */
  locale: Locale;
  /** 記事のタイトル */
  postTitle: string;
  /** 投稿日 */
  postDate: string;
  /** カテゴリ名 */
  category?: string | undefined;
  /** タグ名の配列 */
  tags: string[];
  /** 記事のロケールパス */
  postPath: string;
  /** SNS（X）シェア用の URL */
  shareUrl: string;
  /** 英語表示かどうか */
  isEn: boolean;
  /** 翻訳に使用した AI モデル名（翻訳済みの場合） */
  translationModel?: string | undefined;
  /** オリジナル記事（日本語版）へのパス */
  originalPath: string;
  /** レンダリング済みの MDX コンテンツ */
  content: ReactElement;
  /** 関連するアフィリエイト商品のリスト */
  amazonProducts: AffiliateProduct[];
  /** Amazon アソシエイトの免責事項を表示するかどうか */
  shouldShowAmazonAssociate: boolean;
  /** 目次（TOC）用の見出しリスト */
  headings: { id: string; text: string; level: 2 | 3 }[];
  /** 前の記事の情報 */
  prev: {
    slug: string;
    title: string;
  } | null;
  /** 次の記事の情報 */
  next: {
    slug: string;
    title: string;
  } | null;
};

/**
 * ブログ記事詳細ページの表示内容を構成するコンポーネント。
 */
export function BlogPostPageContent({
  locale,
  postTitle,
  postDate,
  category,
  tags,
  postPath,
  shareUrl,
  isEn,
  translationModel,
  originalPath,
  content,
  amazonProducts,
  shouldShowAmazonAssociate,
  headings,
  prev,
  next,
}: BlogPostPageContentProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={postPath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Blog", path: toLocalePath("/blog", locale) },
          { name: postTitle, path: postPath },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: postTitle,
          datePublished: postDate,
          dateModified: postDate,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${getSiteUrl()}${postPath}`,
          },
          author: {
            "@type": "Person",
            name: "SuzumiyaAoba",
          },
        }}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl min-w-0 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: "Blog", path: toLocalePath("/blog", locale) },
            { name: postTitle, path: postPath },
          ]}
          className="mb-4"
        />
        <header className="mb-10 space-y-3">
          <p className="text-sm text-muted-foreground">{postDate}</p>
          <h1 className="text-3xl font-semibold break-all">{postTitle}</h1>
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
                    key={tag}
                    tag={tag}
                    href={toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale)}
                    className="bg-muted text-[11px] font-medium text-muted-foreground"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </header>
        <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10">
          <div className="flex flex-col w-full min-w-0">
            <article className="prose prose-neutral min-w-0 max-w-none font-sans">
              {isEn && translationModel ? (
                <Message title="Notes" variant="info" defaultOpen>
                  This article was translated by {translationModel}. The original is{" "}
                  <a href={originalPath}>here</a>.
                </Message>
              ) : null}
              <div>{content}</div>
            </article>
            <div>
              {amazonProducts.length > 0 ? (
                <AmazonProductSection products={amazonProducts} className="mt-8" />
              ) : null}
              {shouldShowAmazonAssociate ? (
                <div className="mt-6">
                  <AmazonAssociate />
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button asChild variant="outline" size="sm">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                >
                  <Icon icon="simple-icons:x" className="size-3.5" />
                  <I18nText locale={locale} ja="ポスト" en="Post" />
                </a>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <Toc headings={headings} locale={locale} />
          </div>
        </div>

        <div className="mt-6 space-y-8">
          <Separator className="bg-border/40" />
          <nav className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prev ? (
              <div className="flex min-w-0 flex-1">
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto w-full min-w-0 flex-col items-start gap-1 px-4 py-4 whitespace-normal hover:bg-muted/50"
                >
                  <a
                    href={toLocalePath(`/blog/post/${prev.slug}`, locale)}
                    className="w-full min-w-0"
                  >
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <Icon icon="lucide:chevron-left" className="size-3" />
                      <I18nText locale={locale} ja="前の記事" en="Previous Post" />
                    </span>
                    <span className="line-clamp-2 w-full text-left text-sm font-semibold break-all">
                      {prev.title}
                    </span>
                  </a>
                </Button>
              </div>
            ) : (
              <div />
            )}
            {next ? (
              <div className="flex min-w-0 flex-1">
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto w-full min-w-0 flex-col items-end gap-1 px-4 py-4 whitespace-normal hover:bg-muted/50"
                >
                  <a
                    href={toLocalePath(`/blog/post/${next.slug}`, locale)}
                    className="w-full min-w-0"
                  >
                    <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">
                      <I18nText locale={locale} ja="次の記事" en="Next Post" />
                      <Icon icon="lucide:chevron-right" className="size-3" />
                    </span>
                    <span className="line-clamp-2 w-full text-right text-sm font-semibold break-all">
                      {next.title}
                    </span>
                  </a>
                </Button>
              </div>
            ) : (
              <div />
            )}
          </nav>
        </div>
        <Comments locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
