import { cn } from "@/shared/lib/utils";
import type { BenchmarkDataset, BenchmarkResult } from "../model/schema";
import { formatScore } from "../model/score";

const rankHighlights = [
  { label: "1位", className: "bg-success/30" },
  { label: "2位", className: "bg-success/20" },
  { label: "3位", className: "bg-success/10" },
] as const;

function getScoreHighlights(results: BenchmarkResult[]) {
  const highlights = new Map<number, (typeof rankHighlights)[number]>();
  for (const [index, result] of results
    .toSorted((a, b) => b.score - a.score)
    .entries()) {
    const highlight = rankHighlights[index];
    if (highlight === undefined) {
      break;
    }
    if (!highlights.has(result.score)) {
      highlights.set(result.score, highlight);
    }
  }
  return highlights;
}

export function ScoresOverview({
  dataset,
  query,
  provider,
}: {
  dataset: BenchmarkDataset;
  query: string;
  provider: string;
}) {
  const highlightsByBenchmark = new Map(
    dataset.benchmarks.map(({ id, results }) => [
      id,
      getScoreHighlights(results),
    ])
  );
  const models = new Map<
    string,
    { model: BenchmarkResult; results: Map<string, BenchmarkResult> }
  >();
  for (const benchmark of dataset.benchmarks) {
    for (const result of benchmark.results) {
      const row = models.get(result.id) ?? {
        model: result,
        results: new Map<string, BenchmarkResult>(),
      };
      row.results.set(benchmark.id, result);
      models.set(result.id, row);
    }
  }
  const search = query.trim().toLocaleLowerCase();
  const rows = [...models.values()]
    .filter(
      ({ model }) =>
        (!provider || model.provider === provider) &&
        `${model.model} ${model.provider}`.toLocaleLowerCase().includes(search)
    )
    .toSorted(
      (a, b) =>
        a.model.provider.localeCompare(b.model.provider) ||
        a.model.model.localeCompare(b.model.model)
    );

  return (
    <details className="border-y">
      <summary className="cursor-pointer py-4 text-sm font-medium">
        ベンチマーク横断のスコア一覧（{rows.length} モデル）
      </summary>
      <p className="pb-4 text-xs leading-relaxed text-muted-foreground">
        検索と開発元の絞り込みを反映しています。スコアの単位は各列に記載しています。「未掲載」はこのスナップショットに結果が含まれないことを示します。各列の指標・評価条件は異なるため、列をまたいだ点数の大小や平均で優劣を判断しないでください。
      </p>
      <div className="flex flex-wrap items-center gap-3 pb-4 text-xs">
        <p className="text-muted-foreground">
          各列の全掲載モデルを基準にした上位3位を強調（同点は同順位）。絞り込み後も順位は変わりません。
        </p>
        <ul className="flex gap-2" aria-label="スコアの背景色の凡例">
          {rankHighlights.map((highlight) => (
            <li
              key={highlight.label}
              className={cn(
                "rounded-sm px-2 py-1 font-medium",
                highlight.className
              )}
            >
              {highlight.label}
            </li>
          ))}
        </ul>
      </div>
      <section
        className="benchmark-table-scroll pb-4 focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="ベンチマーク横断のスコア一覧"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 表をキーボードでも縦横にスクロールできるようにする。
        tabIndex={0}
      >
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            モデルごとのベンチマークスコアと
            Effort。各列のリンクから出典と評価方法を確認できます。
          </caption>
          <thead className="sticky top-0 z-20 border-y bg-surface text-muted-foreground">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-30 min-w-52 border-r bg-surface px-3 py-3 font-medium"
              >
                モデル
              </th>
              {dataset.benchmarks.map((benchmark) => (
                <th
                  key={benchmark.id}
                  scope="col"
                  className="min-w-36 px-3 py-3 text-right font-medium"
                >
                  <a
                    href={benchmark.sourceUrl}
                    className="underline underline-offset-4"
                  >
                    {benchmark.name} ↗
                  </a>
                  <span className="mt-1 block font-normal">
                    {benchmark.scoreLabel}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ model, results }) => (
              <tr key={model.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r bg-background px-3 py-3 font-normal"
                >
                  <span className="font-medium">{model.model}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {model.provider}
                  </span>
                </th>
                {dataset.benchmarks.map((benchmark) => {
                  const result = results.get(benchmark.id);
                  const highlight =
                    result === undefined
                      ? undefined
                      : highlightsByBenchmark
                          .get(benchmark.id)
                          ?.get(result.score);
                  return (
                    <td
                      key={benchmark.id}
                      className={cn(
                        "px-3 py-3 text-right font-mono tabular-nums",
                        highlight?.className
                      )}
                    >
                      {result === undefined ? (
                        <span className="text-muted-foreground">未掲載</span>
                      ) : (
                        <>
                          <span className="flex items-baseline justify-end gap-2">
                            {highlight && (
                              <span className="font-sans text-mini font-medium">
                                {highlight.label}
                              </span>
                            )}
                            <span
                              className={
                                highlight ? "font-semibold" : undefined
                              }
                            >
                              {formatScore(result.score, benchmark.scoreType)}
                            </span>
                          </span>
                          <span className="mt-1 block text-mini text-foreground/80">
                            Effort: {result.effort ?? "未公表"}
                          </span>
                          {result.configuration && (
                            <span className="mt-1 block text-mini text-foreground/80">
                              {result.configuration}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </details>
  );
}
