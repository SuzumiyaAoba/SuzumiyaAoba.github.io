import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";


import { getSeriesList } from "@/entities/series-item";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";

export default async function Page() {
  const seriesList = await getSeriesList();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Series", path: "/series" },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            SERIES
          </h1>
        </section>

        {seriesList.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              まだシリーズがありません。
            </div>
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {seriesList.map((series) => (
              <li key={series.slug}>
                <Card className="border-transparent bg-card/40 shadow-none">
                  <a
                    href={`/series/${series.slug}`}
                    className="flex h-full flex-col gap-3 px-5 py-6"
                  >
                    <div className="text-lg font-semibold text-foreground">{series.name}</div>
                    {series.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {series.description}
                      </p>
                    ) : null}
                    <span className="text-xs font-medium text-muted-foreground">
                      {series.posts.length} posts →
                    </span>
                  </a>
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
