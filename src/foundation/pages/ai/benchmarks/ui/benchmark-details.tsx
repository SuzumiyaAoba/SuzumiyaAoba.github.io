import type { Benchmark } from "../model/schema";
import { SourceUpdatedAt } from "./source-updated-at";

export function BenchmarkHeader({ benchmark }: { benchmark: Benchmark }) {
  return (
    <header className="space-y-2 border-t pt-5">
      <p className="section-label">{benchmark.category}</p>
      <h2
        id="selected-benchmark"
        className="text-xl font-semibold tracking-tight"
      >
        {benchmark.name}
      </h2>
      <p className="text-sm text-muted-foreground">{benchmark.description}</p>
      <p className="text-xs text-muted-foreground">
        出典:{" "}
        <a href={benchmark.sourceUrl} className="underline underline-offset-4">
          {benchmark.source} ↗
        </a>{" "}
        · 評価版 {benchmark.version} · 出典更新{" "}
        <SourceUpdatedAt value={benchmark.sourceUpdatedAt} />
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {benchmark.methodology}
      </p>
      {benchmark.archived && (
        <p className="text-xs text-muted-foreground">更新終了</p>
      )}
    </header>
  );
}
