import type { ReactElement } from "react";
import { SiteLayout } from "@/widgets/site-layout";

import { Comments } from "@/shared/ui/comments";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";
import { AmazonAssociate, AmazonProductSection } from "@/shared/ui/amazon";
import { getSiteUrl, SITE_TITLE } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/seo";
import { Message, TwitterWidgets } from "@/shared/ui/mdx";
import { Icon } from "@/shared/ui/icon";
import { I18nText } from "@/shared/ui/i18n-text";
import { formatDate, toIntlLocaleTag } from "@/shared/lib/presentation";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { InlineToc } from "./inline-toc";
import { Toc } from "./toc";

/**
 * ブログ記事詳細ページの表示用コンポーネントのプロパティ
 */
export type BlogPostPageContentProps = {
  /** 描画ロケール */
  locale: Locale;
  /** 記事のタイトル */
  postTitle: string;
  /** 記事の要約（フロントマターの description） */
  description?: string | undefined;
  /** 投稿日 */
  postDate: string;
  /** 読了までのおおよその分数 */
  readingMinutes?: number | undefined;
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
  /** この記事が属するシリーズの情報（属さない場合は null） */
  series: {
    slug: string;
    name: string;
  } | null;
};

type PagerLinkProps = {
  locale: Locale;
  post: { slug: string; title: string };
  direction: "prev" | "next";
};

function PagerLink({ locale, post, direction }: PagerLinkProps) {
  const isPrev = direction === "prev";
  return (
    <a
      href={toLocalePath(`/blog/post/${post.slug}`, locale)}
      rel={direction}
      className={isPrev ? "article-pager-link" : "article-pager-link is-next"}
    >
      <span className="article-pager-label">
        {isPrev ? (
          <I18nText locale={locale} ja="← 前の記事" en="← Previous" />
        ) : (
          <I18nText locale={locale} ja="次の記事 →" en="Next →" />
        )}
      </span>
      <span className="article-pager-title">{post.title}</span>
    </a>
  );
}

/**
 * ブログ記事詳細ページの表示内容を構成するコンポーネント。
 * 本文は 1 行 40 字前後の読みやすい幅に固定し、目次は広い画面では右余白に、狭い画面では本文の前に置く。
 */
export function BlogPostPageContent({
  locale,
  postTitle,
  description,
  postDate,
  readingMinutes,
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
  series,
}: BlogPostPageContentProps) {
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Blog", path: "/blog" },
    { name: postTitle, path: postPath }
  );
  const seriesHref = series
    ? toLocalePath(`/series/${series.slug}`, locale)
    : null;
  // カテゴリと同じ名前のタグは見出し上部と重複するため省く。
  const headerTags = tags.filter((tag) => tag !== category);

  return (
    <SiteLayout locale={locale} path={postPath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: postTitle,
          datePublished: postDate,
          dateModified: postDate,
          image: [`${getSiteUrl()}${postPath}opengraph-image`],
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${getSiteUrl()}${postPath}`,
          },
          author: {
            "@type": "Person",
            name: "SuzumiyaAoba",
          },
          publisher: {
            "@type": "Organization",
            name: SITE_TITLE,
          },
        }}
      />
      <main className="article-page">
        <article>
          <header className="article-header reading-column">
            <p className="article-kicker">
              <a href={toLocalePath("/blog", locale)}>
                <I18nText locale={locale} ja="記事" en="Articles" />
              </a>
              {category ? <span>{category}</span> : null}
            </p>
            <h1 className="article-title">{postTitle}</h1>
            {description ? <p className="article-lead">{description}</p> : null}
            <div className="article-meta">
              <time dateTime={postDate}>
                {formatDate(postDate, toIntlLocaleTag(locale))}
              </time>
              {readingMinutes !== undefined && readingMinutes > 0 ? (
                <span>
                  <I18nText
                    locale={locale}
                    ja={`約 ${readingMinutes} 分で読めます`}
                    en={`${readingMinutes} min read`}
                  />
                </span>
              ) : null}
              {series && seriesHref ? (
                <a href={seriesHref}>
                  <Icon icon="lucide:layers" className="size-3.5" aria-hidden />
                  {series.name}
                </a>
              ) : null}
            </div>
            {headerTags.length > 0 ? (
              <ul
                className="tag-list"
                aria-label={locale === "en" ? "Tags" : "タグ"}
              >
                {headerTags.map((tag) => (
                  <li key={tag}>
                    <a
                      href={toLocalePath(
                        `/tags/${encodeURIComponent(tag)}`,
                        locale
                      )}
                    >
                      #{tag}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div className="article-layout">
            <div className="article-body">
              <InlineToc headings={headings} locale={locale} />
              <div className="prose">
                {isEn && translationModel ? (
                  <Message title="Notes" variant="info" defaultOpen>
                    This article was translated by {translationModel}. The
                    original is{" "}
                    <a href={originalPath}>
                      read the original Japanese article
                    </a>
                    .
                  </Message>
                ) : null}
                {content}
                <TwitterWidgets />
              </div>

              {amazonProducts.length > 0 ? (
                <AmazonProductSection
                  products={amazonProducts}
                  className="mt-12"
                />
              ) : null}
              {shouldShowAmazonAssociate ? (
                <div className="mt-6">
                  <AmazonAssociate />
                </div>
              ) : null}

              <footer className="article-footer">
                {series && seriesHref ? (
                  <a href={seriesHref} className="article-series-note">
                    <span className="article-series-label">
                      <I18nText
                        locale={locale}
                        ja="この記事は連載の一部です"
                        en="Part of a series"
                      />
                    </span>
                    <span className="article-series-name">{series.name}</span>
                    <span className="article-series-cta">
                      <I18nText
                        locale={locale}
                        ja="連載の目次を見る →"
                        en="See all parts →"
                      />
                    </span>
                  </a>
                ) : null}
                <div className="article-share">
                  <span>
                    <I18nText
                      locale={locale}
                      ja="この記事をシェアする"
                      en="Share this article"
                    />
                  </span>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-share-link"
                  >
                    <Icon
                      icon="simple-icons:x"
                      className="size-3.5"
                      aria-hidden
                    />
                    <I18nText locale={locale} ja="ポストする" en="Post on X" />
                  </a>
                </div>
              </footer>
            </div>
            <aside className="article-aside">
              <Toc headings={headings} locale={locale} />
            </aside>
          </div>
        </article>

        {prev || next ? (
          <nav
            className="article-pager reading-column"
            aria-label={locale === "en" ? "More articles" : "前後の記事"}
          >
            {prev ? (
              <PagerLink locale={locale} post={prev} direction="prev" />
            ) : (
              <span />
            )}
            {next ? (
              <PagerLink locale={locale} post={next} direction="next" />
            ) : null}
          </nav>
        ) : null}

        <section
          className="article-comments reading-column"
          aria-label={locale === "en" ? "Comments" : "コメント"}
        >
          <Comments locale={locale} className="mt-0" />
        </section>
      </main>
    </SiteLayout>
  );
}
