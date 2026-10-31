import type { Benchmark, BenchmarkResult } from "../model/schema";
import { formatCost } from "../model/comparison";
import { formatScore } from "../model/score";

export function ResultsTable({
  benchmark,
  results,
}: {
  benchmark: Benchmark;
  results: BenchmarkResult[];
}) {
  const hasPrices = benchmark.results.some(
    (result) =>
      result.inputPerMillionUsd !== null || result.outputPerMillionUsd !== null
  );
  return (
    <section className="space-y-3" aria-labelledby="benchmark-results">
      <h3 id="benchmark-results" className="font-medium">
        モデル別の結果
      </h3>
      <section
        className="benchmark-table-scroll border-y focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="モデル別の結果の表"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 表をキーボードでも縦横にスクロールできるようにする。
        tabIndex={0}
      >
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            {benchmark.name}。スコアは高いほど良く、費用は低いほど安価です。出典
            {benchmark.source}、更新日 {benchmark.sourceUpdatedAt ?? "未公表"}。
          </caption>
          <thead className="sticky top-0 z-20 border-b bg-surface text-xs text-muted-foreground">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-30 border-r bg-surface px-3 py-3 font-medium"
              >
                モデル / 評価設定
              </th>
              <th
                scope="col"
                className="px-3 py-3 font-medium whitespace-nowrap"
              >
                Effort
                <br />
                推論強度
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right font-medium whitespace-nowrap"
              >
                {benchmark.scoreLabel}
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right font-medium whitespace-nowrap"
              >
                実行費用
                <br />
                USD / 問
              </th>
              {hasPrices && (
                <>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right font-medium whitespace-nowrap"
                  >
                    入力単価
                    <br />
                    USD / 100万 tokens
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right font-medium whitespace-nowrap"
                  >
                    出力単価
                    <br />
                    USD / 100万 tokens
                  </th>
                </>
              )}
              <th
                scope="col"
                className="px-3 py-3 font-medium whitespace-nowrap"
              >
                ハーネス
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((result) => (
              <tr key={result.id} className="hover:bg-surface/60">
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-52 border-r bg-background px-3 py-3 font-normal"
                >
                  <a
                    href={result.modelUrl}
                    className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
                  >
                    {result.model} ↗
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.provider}
                  </p>
                  {result.configuration && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      評価設定: {result.configuration}
                    </p>
                  )}
                </th>
                <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">
                  {result.effort ?? "未公表"}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {formatScore(result.score, benchmark.scoreType)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {formatCost(result.costPerTaskUsd)}
                </td>
                {hasPrices && (
                  <>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {formatCost(result.inputPerMillionUsd)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {formatCost(result.outputPerMillionUsd)}
                    </td>
                  </>
                )}
                <td className="px-3 py-3 text-xs whitespace-nowrap text-muted-foreground">
                  {result.harness ?? "出典の評価条件を参照"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs leading-relaxed text-muted-foreground">
        モデル名のリンクは {benchmark.source}
        のモデル詳細・評価設定です。スコアと費用の取得ソースは{" "}
        <a href={benchmark.sourceUrl} className="underline underline-offset-4">
          {benchmark.name} の公開結果 ↗
        </a>
        。Effort は同じ評価結果の推論強度
        を転記し、値がない場合は「未公表」としています。
        <a
          href={benchmark.dataSourceUrl}
          className="underline underline-offset-4"
        >
          評価設定の元データ ↗
        </a>
      </p>
    </section>
  );
}
