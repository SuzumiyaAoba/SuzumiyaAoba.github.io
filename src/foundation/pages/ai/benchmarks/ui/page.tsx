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
      <main className="site-main page-stack min-w-0">
        <Breadcrumbs items={breadcrumbs} />
        <header className="space-y-4">
          <p className="section-label">AI / BENCHMARKS</p>
          <h1 className="page-title">AIモデルのベンチマーク</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            コーディング、数学、科学、知識、業務遂行の評価スコアと費用を比較できます。
            評価元は {dataset.source}。同じ評価版・評価元の結果を並べています。
          </p>
          <p className="text-xs text-muted-foreground">
            {modelCount} モデル · {dataset.benchmarks.length} ベンチマーク ·
            取得日{" "}
            <time dateTime={dataset.retrievedAt}>{dataset.retrievedAt}</time>
          </p>
        </header>
        <AiNavigation active="benchmarks" />
        <BenchmarkExplorer dataset={dataset} />
        <section
          className="space-y-4 border-t pt-6"
          aria-labelledby="benchmark-sources"
        >
          <h2 id="benchmark-sources" className="text-lg font-semibold">
            データの出典と比較条件
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>取得日時点の公開結果を掲載しています。{dataset.selection}</p>
            <p>
              スコアは百分率、Elo、Net Score
              の元の単位で表示します。AA-Briefcase は Elo、AA-Omniscience は
              −100〜100 の Net Score
              です。指標の換算や異なる評価間の平均は行っていません。
            </p>
            <p>
              実行費用は出典の公開結果・評価データに基づく1問当たり費用を米ドルで表示しています。Artificial
              Analysis は公開トークン数・単価・キャッシュ率・Fallback
              の比率から評価元と同じ式で算出しています。API
              単価は100万トークン当たりの料金です。推論トークン数やキャッシュなどの条件が異なるため、単価だけで実行費用を判断することはできません。
            </p>
            <p>
              Effort（推論強度）は、各評価結果の reasoning effort / compute
              effort
              や結果に付記された推論設定を表示しています。同じモデルでも評価によって設定が異なります。出典に値がない場合は「未公表」としています。Fallback
              などの追加設定は表に併記し、更新日の未公表を取得日で補完しません。
            </p>
            <p>
              推論設定・利用ツール・ハーネスによって結果は変わります。モデル名のリンクから出典の評価設定を確認できます。未公表の費用は「未公表」とし、費用グラフには含めません。異なる評価のスコアを合算した総合順位は作成していません。
            </p>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {dataset.benchmarks.map((benchmark) => (
              <li key={benchmark.id}>
                <a
                  className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                  href={benchmark.sourceUrl}
                >
                  {benchmark.source} / {benchmark.name} ↗
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  出典更新 <SourceUpdatedAt value={benchmark.sourceUpdatedAt} />{" "}
                  · 評価版 {benchmark.version}
                  {" · "}
                  <a
                    href={benchmark.dataSourceUrl}
                    className="underline underline-offset-4"
                  >
                    評価設定・費用データ ↗
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteLayout>
  );
}
