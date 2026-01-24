import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";

export type TagEntry = {
  name: string;
  count: number;
};

export type TagsListPageContentProps = {
  locale: Locale;
  tags: TagEntry[];
};

export function TagsListPageContent({ locale, tags }: TagsListPageContentProps) {
  const pagePath = toLocalePath("/tags", locale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Tags", path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="タグ" en="Tags" />
          </h1>
        </section>

        {tags.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText locale={locale} ja="タグがまだありません。" en="No tags yet." />
            </div>
          </Card>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={`${locale}-${tag.name}`}>
                <Card className="border-transparent bg-card/40 shadow-none transition-colors hover:bg-card/60">
                  <a
                    href={toLocalePath(`/tags/${encodeURIComponent(tag.name)}`, locale)}
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
      <Footer locale={locale} />
    </div>
  );
}
