"use client";

import { useEffect, useRef } from "react";
import { computationFrame } from "./generation-computation-model";
import type { ComputationFrame } from "./generation-computation-model";
import { GenerationDistribution } from "./generation-distribution";
import { FLOW_VOCABULARY } from "./generation-math";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import { ROUTE_EDGES, routeFrame, routeNodeById } from "./generation-route";
import type { StoryStage } from "./generation-story-timeline";

type ComputationProps = {
  trace: GenerationTrace;
  selection: GenerationSelection;
  stage: StoryStage;
  progress: number;
};

function number(value: number): string {
  if (Math.abs(value) > 0 && Math.abs(value) < 0.001) {
    return value.toExponential(2);
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return "−∞";
  }
  if (value === Number.POSITIVE_INFINITY) {
    return "∞";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function calculationResult(frame: ComputationFrame): string {
  if (frame.nodeId === "decode") {
    return `${frame.componentLabel} → ${frame.resultText ?? ""}`;
  }
  if (frame.nodeId === "return") {
    return `${frame.output.label} = ${frame.resultText ?? ""}`;
  }
  const equality =
    frame.nodeId === "input" || frame.nodeId === "selection" ? "=" : "≈";
  return `${frame.componentLabel} ${equality} ${number(frame.result)}`;
}

function Vector({
  label,
  values,
  activeIndices,
  indexLabels,
  output = false,
}: {
  label: string;
  values: readonly number[];
  activeIndices: readonly number[] | undefined;
  indexLabels: readonly string[] | undefined;
  output?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2" data-computation-vector={label}>
      <p className="text-xs font-medium">
        {label}{" "}
        <span className="text-muted-foreground">{values.length}成分</span>
      </p>
      <ol
        className={
          values.length === 1
            ? "m-0 grid list-none grid-cols-1 gap-1 p-0"
            : "m-0 grid list-none grid-cols-4 gap-1 p-0"
        }
      >
        {values.map((value, index) => {
          const active = activeIndices?.includes(index) ?? false;
          return (
            <li
              key={`${label}-${index}`}
              className={
                active
                  ? "min-w-0 rounded border border-primary bg-primary/10 px-1 py-1 text-center text-primary"
                  : "min-w-0 rounded border border-border bg-muted/30 px-1 py-1 text-center"
              }
              data-component={index}
              data-component-active={active ? "true" : "false"}
              data-output-component={output ? index : undefined}
            >
              <span className="block text-xs text-muted-foreground">
                {indexLabels?.[index] ?? index + 1}
              </span>
              <span className="block font-mono text-xs font-medium tabular-nums">
                {number(value)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Terms({ frame }: { frame: ComputationFrame }) {
  const products = frame.termMode !== "addends";
  return (
    <div className="space-y-3" data-computation-terms>
      <p className="text-xs font-medium">
        {products
          ? "対応する値を掛けて、すべて足す"
          : "対応する加数を、そのまま足す"}
      </p>
      <ol
        className={
          products
            ? "m-0 grid list-none grid-cols-4 gap-1 p-0"
            : "m-0 grid list-none grid-cols-2 gap-1 p-0"
        }
      >
        {frame.terms.map((term, index) => (
          <li
            key={`${term.label}-${index}`}
            className="min-w-0 space-y-1 rounded border border-primary/40 bg-primary/5 p-1 text-primary"
            data-computation-term={index}
          >
            <p className="truncate text-xs" title={term.label}>
              {term.label}
            </p>
            <p className="font-mono text-xs tabular-nums">
              <span className="block">{number(term.left)}</span>
              {products && (
                <span className="block">× {number(term.right)}</span>
              )}
            </p>
            {products && (
              <p className="font-mono text-xs font-semibold whitespace-nowrap tabular-nums">
                ≈ {number(term.product)}
              </p>
            )}
          </li>
        ))}
      </ol>
      <p
        className="rounded border border-primary/40 bg-primary/5 p-3 font-mono text-sm leading-relaxed text-primary"
        data-computation-sum
      >
        {frame.divisor === undefined ? "" : "("}Σ{products ? " 積" : " 加数"}
        {frame.bias === 0 ? "" : ` + (${number(frame.bias)})`}
        {frame.divisor === undefined ? "" : `) ÷ ${number(frame.divisor)}`} ≈{" "}
        <strong>{number(frame.result)}</strong>
      </p>
    </div>
  );
}

function Matrix({ matrix }: { matrix: ComputationFrame["matrices"][number] }) {
  const columns = Math.max(0, ...matrix.rows.map((row) => row.length));
  const groups = Array.from(
    { length: Math.ceil(columns / 4) },
    (_item, index) => index * 4
  );
  return (
    <figure
      className="m-0 min-w-0 space-y-2"
      data-computation-matrix={matrix.label}
    >
      <figcaption className="text-xs font-medium">
        {matrix.label}{" "}
        <span className="text-muted-foreground">
          {matrix.rows.length} × {columns}
        </span>
      </figcaption>
      <div className="grid gap-2">
        {groups.map((start) => (
          <table
            key={start}
            className="w-full border-collapse text-center font-mono text-xs whitespace-nowrap tabular-nums"
          >
            <caption className="sr-only">
              {matrix.label}、列{start + 1}から{Math.min(start + 4, columns)}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="p-1 font-normal text-muted-foreground"
                >
                  行＼列
                </th>
                {Array.from(
                  { length: Math.min(4, columns - start) },
                  (_item, index) => (
                    <th
                      key={start + index}
                      scope="col"
                      className="p-1 font-normal text-muted-foreground"
                    >
                      {matrix.columnLabels?.[start + index] ??
                        start + index + 1}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row, rowIndex) => (
                <tr key={`${matrix.label}-${rowIndex}`}>
                  <th
                    scope="row"
                    className="p-1 font-normal text-muted-foreground"
                  >
                    {matrix.rowLabels?.[rowIndex] ?? rowIndex + 1}
                  </th>
                  {row.slice(start, start + 4).map((value, index) => {
                    const column = start + index;
                    const active =
                      (matrix.activeRows !== undefined ||
                        matrix.activeColumns !== undefined) &&
                      (matrix.activeRows?.includes(rowIndex) ?? true) &&
                      (matrix.activeColumns?.includes(column) ?? true);
                    return (
                      <td
                        key={`${matrix.label}-${rowIndex}-${column}`}
                        className={
                          active
                            ? "border border-primary/40 bg-primary/10 px-1 py-1 font-semibold text-primary"
                            : "border border-border bg-muted/20 px-1 py-1"
                        }
                        data-matrix-row={rowIndex}
                        data-matrix-column={column}
                        data-matrix-active={active ? "true" : "false"}
                      >
                        {number(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </figure>
  );
}

export function GenerationComputation({
  trace,
  selection,
  stage,
  progress,
}: ComputationProps) {
  const frame = computationFrame(trace, selection, stage, progress);
  const { activeEdgeId } = routeFrame(stage, progress);
  const transfer = ROUTE_EDGES.find((edge) => edge.id === activeEdgeId);
  const vectorInputs = frame.inputs.filter(
    (input) => input.values.length !== 1
  );
  const scalarInputs = frame.inputs.filter(
    (input) => input.values.length === 1
  );
  const pane = useRef<HTMLElement>(null);
  useEffect(() => {
    if (pane.current) {
      pane.current.scrollTop = 0;
    }
  }, [frame.nodeId]);
  return (
    <section
      ref={pane}
      aria-label="全体図と同期した計算の実データ"
      className="relative h-full min-h-0 overflow-y-auto overscroll-contain"
      data-generation-computation={frame.nodeId}
      data-active-component={frame.activeComponent}
    >
      <header className="sticky top-0 z-10 space-y-2 border-b bg-background p-4 sm:p-5">
        <p
          className="text-xs font-medium text-primary"
          data-computation-context
        >
          {transfer
            ? `${routeNodeById(transfer.from).label}の出力 → ${routeNodeById(transfer.to).label}の入力（直前の計算結果）`
            : "全体図で光っている処理の内部"}
        </p>
        <h2 className="text-xl font-semibold tracking-tight">{frame.title}</h2>
        <p
          className="font-mono text-sm leading-relaxed break-words"
          data-computation-formula
        >
          {frame.formula}
        </p>
      </header>
      <div className="space-y-5 p-4 sm:p-5">
        <p className="text-sm leading-relaxed">{frame.explanation}</p>
        <div
          className="llm-computation-workspace gap-4 rounded-lg border bg-muted/10 p-3"
          data-computation-workspace
        >
          <div className="min-w-0 space-y-3">
            <h3 className="text-sm font-semibold">入力</h3>
            <div className="space-y-3">
              {vectorInputs.map((input) => (
                <Vector
                  key={input.label}
                  label={input.label}
                  values={input.values}
                  activeIndices={input.activeIndices}
                  indexLabels={input.indexLabels}
                />
              ))}
            </div>
            {scalarInputs.length > 0 && (
              <dl className="m-0 flex flex-wrap gap-2">
                {scalarInputs.map((input) => (
                  <div
                    key={input.label}
                    className={
                      input.activeIndices?.includes(0)
                        ? "flex min-w-0 items-center gap-2 rounded border border-primary bg-primary/10 px-2 py-1 text-primary"
                        : "flex min-w-0 items-center gap-2 rounded border bg-background px-2 py-1"
                    }
                    data-computation-scalar-input={input.label}
                  >
                    <dt className="text-xs text-muted-foreground">
                      {input.label}
                    </dt>
                    <dd className="m-0 font-mono text-xs font-medium tabular-nums">
                      {number(input.values[0] ?? 0)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {stage === "input" && (
              <p className="font-mono text-xs leading-relaxed">
                {trace.ids
                  .map((id) => `「${FLOW_VOCABULARY[id]?.piece}」→ ID ${id}`)
                  .join(" ／ ")}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-3 border-y py-3 xl:border-x xl:border-y-0 xl:px-3 xl:py-0">
            <h3 className="text-sm font-semibold text-primary">
              計算対象：{frame.componentLabel}
            </h3>
            {frame.terms.length > 0 ? (
              <Terms frame={frame} />
            ) : (
              <p
                className="rounded border border-primary/40 bg-primary/5 p-3 font-mono text-sm leading-relaxed text-primary"
                data-computation-scalar
              >
                {calculationResult(frame)}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            <h3 className="text-sm font-semibold">この演算の出力</h3>
            {frame.resultText !== undefined && (
              <p
                className="text-lg font-semibold break-words text-primary"
                data-computation-result-text
              >
                {frame.resultText}
              </p>
            )}
            <Vector
              label={frame.output.label}
              values={frame.output.values}
              activeIndices={[frame.activeComponent]}
              indexLabels={frame.output.indexLabels}
              output
            />
          </div>
        </div>
        {(stage === "probabilities" || stage === "selection") && (
          <GenerationDistribution
            trace={trace}
            selection={selection}
            stage={stage}
            progress={progress}
          />
        )}
        {frame.matrices.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">この計算に使う実際の行列</h3>
            <div className="grid gap-4 xl:grid-cols-2">
              {frame.matrices.map((matrix) => (
                <Matrix key={matrix.label} matrix={matrix} />
              ))}
            </div>
          </div>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          強調した値が、現在の入力・重み・出力の対応を示す。小数表示は小数第3位に丸め、微小値は指数表記にしている。計算には丸める前の値を使う。位置・成分の番号は1から、語彙IDは0から数える。
        </p>
      </div>
    </section>
  );
}
