import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostSummariesVariants } from "@/entities/blog";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, resolveLocale, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";
import { SITE_TITLE } from "@/shared/lib/site";
import { CuriosityArt } from "./curiosity-art";

type PageProps = {
  locale?: Locale;
};

export type HomePageContentProps = {
  locale: Locale;
  latestPosts: BlogPostListProps["posts"];
};

import { type ComponentProps } from "react";
type BlogPostListProps = ComponentProps<typeof BlogPostList>;

export function HomePageContent({ locale, latestPosts }: HomePageContentProps) {
  const pagePath = toLocalePath("/", locale);
  const en = locale === "en";
  const collections = [
    { href: "/notes", title: "Notes" },
    { href: "/books", title: "Books" },
    { href: "/archive", title: "Archive" },
    { href: "/awesome-something", title: "Awesome" },
  ];

  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: pagePath }])} />
      <main className="home-main">
        <header className="home-masthead site-container">
          <h1 className="home-title">{SITE_TITLE}</h1>
          <CuriosityArt />
        </header>

        <section id="latest" className="home-journal site-container" aria-labelledby="latest-title">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow section-eyebrow">01 / BLOG</p>
              <h2 id="latest-title" className="home-section-title">
                <I18nText locale={locale} ja="最新のブログ" en="Latest Posts" />
              </h2>
            </div>
            <a href={toLocalePath("/blog", locale)} className="journal-text-link">
              <I18nText locale={locale} ja="すべての記事" en="All articles" />
              <span className="journal-link-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
          <BlogPostList
            posts={latestPosts}
            locale={locale}
            emptyMessage={{ ja: "まだ記事がありません。", en: "No posts yet." }}
            variant="editorial"
          />
        </section>

        <section className="home-explore" aria-labelledby="explore-title">
          <div className="site-container home-explore-inner">
            <div>
              <p className="eyebrow">02 / CONTENTS</p>
              <h2 id="explore-title">
                <I18nText locale={locale} ja="コンテンツ" en="Contents" />
              </h2>
            </div>
            <nav className="home-collections" aria-label={en ? "Contents" : "コンテンツ"}>
              {collections.map((collection, index) => (
                <a
                  key={collection.href}
                  href={toLocalePath(collection.href, locale)}
                  className="home-collection"
                >
                  <span className="eyebrow home-collection-number">0{index + 1}</span>
                  <span className="home-collection-title">{collection.title}</span>
                  <span className="home-collection-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const posts = await getBlogPostSummariesVariants();
  const latestPosts = posts.slice(0, 6);

  return <HomePageContent locale={resolvedLocale} latestPosts={latestPosts} />;
}
