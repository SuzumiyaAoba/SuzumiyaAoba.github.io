"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { ATTENTION_TOKENS, calculateAttentionMatrix } from "./attention-math";
import type { AttentionRow, AttentionVector } from "./attention-math";
import { svgNumber } from "./svg-number";
import { DemoFrame } from "./visual-frame";

function formatNumber(value: number, digits = 2): string {
  if (value === -Infinity) {
    return "−∞";
  }
  return value.toFixed(digits).replace("-", "−");
}

function formatVector(vector: AttentionVector, digits = 2): string {
  return `(${formatNumber(vector[0], digits)}, ${formatNumber(vector[1], digits)})`;
}

function AttentionMatrix({
  rows,
  queryIndex,
  masked,
}: {
  rows: readonly AttentionRow[];
  queryIndex: number;
  masked: boolean;
}) {
  const id = useId();

  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold">
        1. 各位置が、どこから情報を集めるか
      </figcaption>
      <p className="text-sm text-muted-foreground">
        行がQuery、列が参照先である。数値はAttentionの重みで、各行の合計は100%となる。
        枠で囲んだ行が選択中の位置である。
      </p>
      <div className="overflow-x-auto rounded-lg border bg-background">
        <svg
          aria-labelledby={`${id}-title ${id}-description`}
          viewBox="0 0 610 354"
          className="block h-auto w-full min-w-lg"
        >
          <title id={`${id}-title`}>全6位置のAttention重み</title>
          <desc id={`${id}-description`}>
            {masked
              ? "因果マスクが有効。対角線より右上は未来の位置なので重みが0になる。対角線上の自分自身は参照できる。"
              : "因果マスクが無効。各行は未来を含む全6位置を参照する。"}
            {`選択中は${queryIndex + 1}行目。`}
            {rows
              .map(
                (row, index) =>
                  `${index + 1}行目の重みは${row.weights.map((weight) => `${(weight * 100).toFixed(1)}%`).join("、")}。`
              )
              .join("")}
          </desc>
          <text
            x="372"
            y="24"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            K・Vを参照する位置 →
          </text>
          <text x="24" y="48" className="fill-muted-foreground text-xs">
            Query ↓
          </text>
          {ATTENTION_TOKENS.map((token, column) => (
            <text
              key={token.id}
              x={202 + column * 68}
              y="48"
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              {column + 1}
            </text>
          ))}
          {rows.map((row, rowIndex) => (
            <g key={ATTENTION_TOKENS[rowIndex]?.id}>
              <text
                x="154"
                y={90 + rowIndex * 42}
                textAnchor="end"
                className={
                  rowIndex === queryIndex
                    ? "fill-foreground text-xs font-semibold"
                    : "fill-muted-foreground text-xs"
                }
              >
                {rowIndex + 1}：{ATTENTION_TOKENS[rowIndex]?.label}
              </text>
              {row.weights.map((weight, column) => {
                const hidden = masked && column > rowIndex;
                const x = 170 + column * 68;
                const y = 64 + rowIndex * 42;
                return (
                  <g key={ATTENTION_TOKENS[column]?.id}>
                    <rect
                      x={x}
                      y={y}
                      width="64"
                      height="38"
                      rx="4"
                      className="fill-muted"
                    />
                    {!hidden && (
                      <rect
                        x={x}
                        y={y}
                        width="64"
                        height="38"
                        rx="4"
                        opacity={svgNumber(0.06 + weight * 0.3)}
                        className="fill-primary"
                      />
                    )}
                    {hidden && (
                      <path
                        d={`M ${x + 5} ${y + 33} L ${x + 59} ${y + 5}`}
                        className="stroke-muted-foreground"
                        opacity="0.3"
                      />
                    )}
                    <text
                      x={x + 32}
                      y={y + 25}
                      textAnchor="middle"
                      className="fill-foreground text-xs tabular-nums"
                    >
                      {(weight * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
          <rect
            x="166"
            y={60 + queryIndex * 42}
            width="412"
            height="46"
            rx="6"
            fill="none"
            strokeWidth="2"
            className="stroke-primary"
          />
          <text x="170" y="340" className="fill-muted-foreground text-xs">
            {masked
              ? "斜線のセル：未来の位置（重み 0）"
              : "未来への参照も許可した比較用の状態"}
          </text>
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">
        表示値は丸めているため、見かけの合計が100%からずれる場合がある。
      </p>
    </figure>
  );
}

function AttentionCalculation({
  row,
  queryIndex,
}: {
  row: AttentionRow;
  queryIndex: number;
}) {
  const id = useId();
  const firstKey = ATTENTION_TOKENS[0].key;

  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold">
        2. 選択したQueryから、重みを計算する
      </figcaption>
      <p className="text-sm">
        選択中の q<sub>{queryIndex + 1}</sub> ={" "}
        <strong>{formatVector(row.query, 1)}</strong>。 たとえば1列目の内積は、
        {formatNumber(row.query[0], 1)} × ({formatNumber(firstKey[0], 1)}) +{" "}
        {formatNumber(row.query[1], 1)} × ({formatNumber(firstKey[1], 1)}) ={" "}
        {formatNumber(row.dotProducts[0] ?? 0)} となる。
      </p>
      <div className="overflow-x-auto rounded-lg border bg-background">
        <svg
          aria-labelledby={`${id}-title ${id}-description`}
          viewBox="0 0 820 352"
          className="block h-auto w-full min-w-3xl"
        >
          <title id={`${id}-title`}>
            選択行の内積、スケーリング、softmax、Vの寄与
          </title>
          <desc id={`${id}-description`}>
            {ATTENTION_TOKENS.map(
              (token, index) =>
                `${index + 1}番目、${token.label}。Kは${formatVector(token.key)}、内積は${formatNumber(row.dotProducts[index] ?? 0)}、√2で割ってマスクを加えた点数は${formatNumber(row.maskedScores[index] ?? 0)}、重みは${((row.weights[index] ?? 0) * 100).toFixed(1)}%。Vは${formatVector(token.value)}、寄与は${formatVector(row.contributions[index] ?? [0, 0], 3)}。`
            ).join("")}
          </desc>
          <rect
            x="332"
            y="8"
            width="216"
            height="332"
            rx="8"
            className="fill-muted"
          />
          <text x="12" y="32" className="fill-muted-foreground text-xs">
            参照先 j
          </text>
          <text
            x="168"
            y="32"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            kⱼ
          </text>
          <text
            x="281"
            y="32"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            q・kⱼ
          </text>
          <text
            x="384"
            y="27"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            ÷ √2
          </text>
          <text
            x="384"
            y="44"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            + マスク
          </text>
          <text
            x="438"
            y="35"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            →
          </text>
          <text
            x="496"
            y="27"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            softmax
          </text>
          <text
            x="496"
            y="44"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            重み αⱼ
          </text>
          <text
            x="610"
            y="32"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            vⱼ
          </text>
          <text
            x="748"
            y="32"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            寄与 αⱼvⱼ
          </text>
          {ATTENTION_TOKENS.map((token, index) => {
            const y = 81 + index * 46;
            const score = row.maskedScores[index] ?? 0;
            const weight = row.weights[index] ?? 0;
            return (
              <g key={token.id}>
                <path d={`M 12 ${y + 17} H 808`} className="stroke-border" />
                <text x="12" y={y} className="fill-foreground text-xs">
                  {index + 1}：{token.label}
                </text>
                <text
                  x="168"
                  y={y}
                  textAnchor="middle"
                  className="fill-foreground text-xs tabular-nums"
                >
                  {formatVector(token.key, 1)}
                </text>
                <text
                  x="281"
                  y={y}
                  textAnchor="middle"
                  className="fill-foreground text-xs tabular-nums"
                >
                  {formatNumber(row.dotProducts[index] ?? 0)}
                </text>
                <text
                  x="384"
                  y={y}
                  textAnchor="middle"
                  className="fill-foreground text-xs tabular-nums"
                >
                  {formatNumber(score)}
                </text>
                <text
                  x="496"
                  y={y}
                  textAnchor="middle"
                  className="fill-foreground text-xs font-semibold tabular-nums"
                >
                  {(weight * 100).toFixed(1)}%
                </text>
                <text
                  x="610"
                  y={y}
                  textAnchor="middle"
                  className="fill-foreground text-xs tabular-nums"
                >
                  {formatVector(token.value, 1)}
                </text>
                <text
                  x="748"
                  y={y}
                  textAnchor="middle"
                  className="fill-foreground text-xs tabular-nums"
                >
                  {formatVector(row.contributions[index] ?? [0, 0])}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">
        マスクされた位置の点数は−∞、重みは厳密に0となる。
        softmaxは参照可能な位置だけで正規化する。重みを掛ける相手はKではなくVである。
      </p>
    </figure>
  );
}

function ValueMixture({ row }: { row: AttentionRow }) {
  const id = useId();
  const originX = 250;
  const originY = 180;
  const scale = 84;
  const outputX = originX + row.output[0] * scale;
  const outputY = originY - row.output[1] * scale;

  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold">
        3. Vを混ぜると、出力は重み付き平均になる
      </figcaption>
      <div className="overflow-x-auto rounded-lg border bg-background">
        <svg
          aria-labelledby={`${id}-title ${id}-description`}
          viewBox="0 0 500 368"
          className="block h-auto w-full min-w-sm"
        >
          <title id={`${id}-title`}>
            2次元のVと、Attentionによる重み付き平均
          </title>
          <desc id={`${id}-description`}>
            {`丸の中心は各位置のVを示し、半透明の円の面積が重みに比例する。重み0は小さな白抜きの丸で示す。番号はトークンの位置である。ひし形が出力で、座標は${formatVector(row.output, 3)}。出力は参照可能なVの重み付き平均であり、それらの点の凸包内にある。`}
          </desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 8 4 L 0 8 Z" className="fill-chart-2" />
            </marker>
          </defs>
          {[-1, 0, 1].map((tick) => (
            <g key={tick}>
              <path
                d={`M ${originX + tick * scale} 38 V 314 M 104 ${originY - tick * scale} H 408`}
                className="stroke-border"
              />
              <text
                x={originX + tick * scale}
                y="333"
                textAnchor="middle"
                className="fill-muted-foreground text-xs"
              >
                {tick}
              </text>
              <text
                x="92"
                y={originY - tick * scale + 4}
                textAnchor="end"
                className="fill-muted-foreground text-xs"
              >
                {tick}
              </text>
            </g>
          ))}
          <path
            d={`M 104 ${originY} H 408 M ${originX} 38 V 314`}
            className="stroke-muted-foreground"
          />
          <text
            x="432"
            y={originY + 5}
            className="fill-muted-foreground text-xs"
          >
            成分1
          </text>
          <text
            x={originX + 8}
            y="28"
            className="fill-muted-foreground text-xs"
          >
            成分2
          </text>
          {ATTENTION_TOKENS.map((token, index) => {
            const x = originX + token.value[0] * scale;
            const y = originY - token.value[1] * scale;
            const weight = row.weights[index] ?? 0;
            return (
              <g key={token.id}>
                <circle
                  cx={svgNumber(x)}
                  cy={svgNumber(y)}
                  r={svgNumber(Math.sqrt(weight) * 26)}
                  className="fill-primary"
                  opacity="0.25"
                />
                <circle
                  cx={svgNumber(x)}
                  cy={svgNumber(y)}
                  r="3"
                  className={
                    weight > 0
                      ? "fill-primary stroke-primary"
                      : "fill-background stroke-muted-foreground"
                  }
                />
                <text
                  x={svgNumber(x + 10)}
                  y={svgNumber(y - 8)}
                  className="fill-foreground text-xs font-semibold"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
          <path
            d={`M ${originX} ${originY} L ${svgNumber(outputX)} ${svgNumber(outputY)}`}
            strokeWidth="3"
            markerEnd={`url(#${id}-arrow)`}
            className="stroke-chart-2"
          />
          <polygon
            points={`${svgNumber(outputX)},${svgNumber(outputY - 7)} ${svgNumber(outputX + 7)},${svgNumber(outputY)} ${svgNumber(outputX)},${svgNumber(outputY + 7)} ${svgNumber(outputX - 7)},${svgNumber(outputY)}`}
            strokeWidth="2"
            className="fill-chart-2 stroke-foreground"
          />
          <circle cx="148" cy="352" r="4" className="fill-primary" />
          <text x="160" y="356" className="fill-muted-foreground text-xs">
            丸：V（番号は位置）
          </text>
          <polygon
            points="313,346 319,352 313,358 307,352"
            className="fill-chart-2 stroke-foreground"
          />
          <text x="325" y="356" className="fill-muted-foreground text-xs">
            ひし形：出力
          </text>
        </svg>
      </div>
      <output
        className="block rounded-lg bg-muted p-4 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        出力 o = Σⱼ αⱼvⱼ = <strong>{formatVector(row.output, 3)}</strong>
      </output>
      <p className="text-sm text-muted-foreground">
        半透明の円の面積は重みを表す。重みは非負で合計が1なので、出力は参照可能なVの点が囲む範囲内に収まる。
        因果マスクを有効にして1番目を選ぶと、参照先が自分だけになり、出力とv₁が一致する。
        軸は説明用の成分であり、「人物」や「時制」などの意味を割り当てたものではない。
      </p>
    </figure>
  );
}

export function LlmAttentionDemo() {
  const id = useId();
  const [queryIndex, setQueryIndex] = useState(2);
  const [masked, setMasked] = useState(true);
  const rows = calculateAttentionMatrix(ATTENTION_TOKENS, masked);
  const row = rows[queryIndex];
  if (!row) {
    return null;
  }

  return (
    <DemoFrame
      label="因果マスクとAttentionの実験"
      title="Q・K・Vから、情報の混ざり方を計算する"
      description="Queryを切り替えると、内積、重み、出力が連動して変わる。因果マスクを外すと、未来への参照がどのように加わるか比較できる。"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label htmlFor={`${id}-query`} className="block text-sm font-medium">
            情報を集める位置（Query）
          </label>
          <select
            id={`${id}-query`}
            value={queryIndex}
            aria-describedby={`${id}-note`}
            onChange={(event) => setQueryIndex(Number(event.target.value))}
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {ATTENTION_TOKENS.map((token, index) => (
              <option key={token.id} value={index}>
                {index + 1}：{token.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-pressed={masked}
          onClick={() => setMasked((current) => !current)}
        >
          因果マスク：{masked ? "有効" : "無効"}
        </Button>
      </div>
      <p className="text-sm">
        {masked
          ? `${queryIndex + 1}番目までを参照する。選択中の位置自身も参照範囲に含まれる。`
          : "全位置を参照する。学習時にこの状態で次のトークンを予測すると、未来の正解情報を参照できてしまう。"}
      </p>
      <AttentionMatrix rows={rows} queryIndex={queryIndex} masked={masked} />
      <AttentionCalculation row={row} queryIndex={queryIndex} />
      <ValueMixture row={row} />
      <p id={`${id}-note`} className="text-xs text-muted-foreground">
        トークンの区切りとQ・K・Vは説明用の固定値であり、学習済みモデルの実測ではない。
        1ヘッドのdense attentionを dₖ = dᵥ = 2 で計算している。 GPT-3 175Bの dₖ
        = 128 やsparse層の参照パターンを再現したものではない。
        ここで示すのは出力射影と残差加算の前の値である。
      </p>
    </DemoFrame>
  );
}
