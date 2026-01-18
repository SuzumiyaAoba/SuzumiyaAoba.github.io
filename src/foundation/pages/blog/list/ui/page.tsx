import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants } from "@/entities/blog";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";
import { BlogPostList } from "@/entities/blog";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/blog", resolvedLocale);
  const posts = await getBlogPostsVariants();
  const pagePosts = posts.slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Blog", path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="ブログ" en="Blog" />
          </h1>
        </section>

        <BlogPostList posts={pagePosts} locale={resolvedLocale} variant="detailed" showThumbnail />

        {posts.length > 10 ? (
          <nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            {Array.from({ length: Math.ceil(posts.length / 10) }, (_, index) => {
              const page = index + 1;
              const href = page === 1 ? "/blog" : `/blog/${page}`;
              const isActive = page === 1;
              return (
                <a
                  key={page}
                  href={toLocalePath(href, resolvedLocale)}
                  className={
                    isActive
                      ? "rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                      : "rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {page}
                </a>
              );
            })}
          </nav>
        ) : null}
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
