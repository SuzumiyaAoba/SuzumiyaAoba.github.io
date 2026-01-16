
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants, type BlogPost } from "@/entities/blog";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

type TagEntry = {
  name: string;
  count: number;
};

function buildTagList(posts: BlogPost[], locale: Locale): TagEntry[] {
  const tagMap = new Map<string, TagEntry>();

  for (const post of posts) {
    const tags = post.frontmatter.tags ?? [];
    for (const tag of tags) {
      tagMap.set(tag, {
        name: tag,
        count: (tagMap.get(tag)?.count ?? 0) + 1,
      });
    }
  }

  return [...tagMap.values()].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name, locale === "ja" ? "ja" : "en");
  });
}

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const posts = await getBlogPostsVariants();
  const postsJa = posts.map((post) => post.ja ?? post.en).filter(Boolean) as BlogPost[];
  const postsEn = posts.map((post) => post.en ?? post.ja).filter(Boolean) as BlogPost[];
  const tagsJa = buildTagList(postsJa, "ja");
  const tagsEn = buildTagList(postsEn, "en");
  const tags = resolvedLocale === "en" ? tagsEn : tagsJa;
  const pagePath = toLocalePath("/tags", resolvedLocale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Tags", path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="タグ" en="Tags" />
          </h1>
        </section>

        {tags.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText locale={resolvedLocale} ja="タグがまだありません。" en="No tags yet." />
            </div>
          </Card>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={`${resolvedLocale}-${tag.name}`}>
                <Card className="border-transparent bg-card/40 shadow-none transition-colors hover:bg-card/60">
                  <a
                    href={toLocalePath(`/tags/${encodeURIComponent(tag.name)}`, resolvedLocale)}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <Tag
                      tag={tag.name}
                      label={`${tag.name} (${tag.count})`}
                      className="bg-muted text-xs font-semibold text-muted-foreground"
                    />
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
