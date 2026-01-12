import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getSeriesBySlug, getSeriesSlugs } from "@/entities/series-item";
import { getBlogPost } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";

type PageProps = {
  params: Promise<{ series: string }>;
};

export async function generateStaticParams(): Promise<Array<{ series: string }>> {
  const slugs = await getSeriesSlugs();
  return slugs.map((slug) => ({ series: slug }));
}

export default async function Page({ params }: PageProps) {
  const { series: slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const posts = await Promise.all(series.posts.map((postSlug) => getBlogPost(postSlug)));
  const entries = posts
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
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Series", path: "/series" },
            { name: series.name, path: `/series/${series.slug}` },
          ]}
          className="mb-2"
        />
        <section className="space-y-3">
          <Link href="/series" className="text-xs font-medium text-muted-foreground">
            ← シリーズ一覧
          </Link>
          <h1 className="text-3xl font-semibold">{series.name}</h1>
          {series.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{series.description}</p>
          ) : null}
        </section>

        {entries.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">まだ記事がありません。</div>
          </Card>
        ) : (
          <ul className="space-y-4">
            {entries.map((post) => (
              <li key={post.slug}>
                <Card className="border-transparent bg-card/40 shadow-none">
                  <Link href={`/blog/post/${post.slug}`} className="flex flex-col gap-3 px-5 py-5">
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
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
