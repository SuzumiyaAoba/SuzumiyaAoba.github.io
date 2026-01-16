
import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getSeriesBySlug } from "@/entities/series-item";
import { getBlogPost } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";

type PageProps = {
  params: Promise<{ series: string }>;
};

export default async function Page({ params }: PageProps) {
  const { series: slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const [postsJa, postsEn] = await Promise.all([
    Promise.all(series.posts.map((postSlug) => getBlogPost(postSlug, { locale: "ja", fallback: false }))),
    Promise.all(series.posts.map((postSlug) => getBlogPost(postSlug, { locale: "en", fallback: false }))),
  ]);
  const entriesJa = postsJa
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags ?? [],
    }));
  const entriesEn = postsEn
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags ?? [],
    }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Series", path: "/series" },
          { name: series.name, path: `/series/${series.slug}` },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <div className="lang-ja">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Series", path: "/series" },
              { name: series.name, path: `/series/${series.slug}` },
            ]}
            className="mb-2"
          />
        </div>
        <div className="lang-en">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Series", path: "/series" },
              { name: series.name, path: `/series/${series.slug}` },
            ]}
            className="mb-2"
          />
        </div>
        <section className="space-y-3">
          <a href="/series" className="text-xs font-medium text-muted-foreground">
            <I18nText ja="← シリーズ一覧" en="← Back to series" />
          </a>
          <h1 className="text-3xl font-semibold">{series.name}</h1>
          {series.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{series.description}</p>
          ) : null}
        </section>

        {entriesJa.length === 0 && entriesEn.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText ja="まだ記事がありません。" en="No posts yet." />
            </div>
          </Card>
        ) : (
          <>
            <ul className="space-y-4 lang-ja">
              {entriesJa.map((post) => (
                <li key={post.slug}>
                  <Card className="border-transparent bg-card/40 shadow-none">
                    <a href={`/blog/post/${post.slug}`} className="flex flex-col gap-3 px-5 py-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.date}</span>
                        <Badge
                          variant="secondary"
                          className="bg-muted/70 text-[11px] text-muted-foreground"
                        >
                          {series.name}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">{post.title}</p>
                        {post.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <Tag
                                key={tag}
                                tag={tag}
                                className="bg-muted text-[11px] font-medium text-muted-foreground"
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  </Card>
                </li>
              ))}
            </ul>
            <ul className="space-y-4 lang-en">
              {entriesEn.map((post) => (
                <li key={`en-${post.slug}`}>
                  <Card className="border-transparent bg-card/40 shadow-none">
                    <a href={`/blog/post/${post.slug}`} className="flex flex-col gap-3 px-5 py-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.date}</span>
                        <Badge
                          variant="secondary"
                          className="bg-muted/70 text-[11px] text-muted-foreground"
                        >
                          {series.name}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">{post.title}</p>
                        {post.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <Tag
                                key={`en-${tag}`}
                                tag={tag}
                                className="bg-muted text-[11px] font-medium text-muted-foreground"
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
