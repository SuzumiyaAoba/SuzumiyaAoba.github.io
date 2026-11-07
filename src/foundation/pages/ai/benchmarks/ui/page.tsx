import rawDataset from "@/content/tools/ai-benchmarks.json";
import { SiteLayout } from "@/widgets/site-layout";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { AiNavigation } from "@/shared/ui/ai-navigation";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { benchmarkDatasetSchema } from "../model/schema";
import { BenchmarkExplorer } from "./benchmark-explorer";
import { SourceUpdatedAt } from "./source-updated-at";

const breadcrumbs = [
  { name: "Home", path: "/" },
  { name: "資料", path: "/archive/" },
  { name: "AIベンチマーク", path: "/ai/benchmarks/" },
];

export default function Page() {
  const dataset = benchmarkDatasetSchema.parse(rawDataset);
  const modelCount = new Set(
    dataset.benchmarks.flatMap((benchmark) =>
      benchmark.results.map((result) => result.id)
    )
  ).size;

  return (
    <SiteLayout locale="ja" path="/ai/benchmarks/">
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main font-noto min-w-0">
        <div className="page-stack min-w-0">
          <Breadcrumbs items={breadcrumbs} />
          <header className="page-heading">
            <div>
              <h1 className="page-title">AIモデルのベンチマーク</h1>
              <p className="mt-2 text-xs text-muted-foreground">
                取得日{" "}
                <time dateTime={dataset.retrievedAt}>
                  {dataset.retrievedAt}
                </time>
              </p>
            </div>
            <p className="page-count">
              {modelCount} モデル · {dataset.benchmarks.length} ベンチマーク
            </p>
          </header>
          <AiNavigation active="benchmarks" />
          <BenchmarkExplorer dataset={dataset} />
          <section className="space-y-4" aria-labelledby="benchmark-sources">
            <header className="section-heading">
              <h2 id="benchmark-sources" className="section-title">
                出典
              </h2>
            </header>
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {dataset.benchmarks.map((benchmark) => (
                <li key={benchmark.id} className="border-b border-rule py-4">
                  <a
                    className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                    href={benchmark.sourceUrl}
                  >
                    {benchmark.source} / {benchmark.name} ↗
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">
                    出典更新{" "}
                    <SourceUpdatedAt value={benchmark.sourceUpdatedAt} /> ·
                    評価版 {benchmark.version}
                    {" · "}
                    <a
                      href={benchmark.dataSourceUrl}
                      className="underline underline-offset-4"
                    >
                      評価設定・費用データ ↗
                    </a>
                    {benchmark.costCalculationUrl && (
                      <>
                        {" · "}
                        <a
                          href={benchmark.costCalculationUrl}
                          className="underline underline-offset-4"
                        >
                          費用計算 ↗
                        </a>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}
