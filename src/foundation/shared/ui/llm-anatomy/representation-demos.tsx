"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVGを1つの図として読み上げるため、imgのロールと図の代替説明を指定する。 */

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  EMBEDDING_TABLE,
  EMBEDDING_TOKEN_IDS,
  embeddingAt,
  evaluateMlp,
  MLP_B1,
  MLP_B2,
  MLP_W1,
  MLP_W2,
} from "./representation-math";
import type { Pair } from "./representation-math";
import { svgNumber } from "./svg-number";
import { DemoFrame } from "./visual-frame";

function signedNumber(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function plotX(value: number): number {
  return 50 + ((value + 2) / 4) * 460;
}

function SignedBar({ value, limit }: { value: number; limit: number }) {
  const width = (Math.abs(value) / limit) * 48;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      className="h-3 w-full"
    >
      <rect width="100" height="12" rx="2" className="fill-muted" />
      <rect
        x={svgNumber(value < 0 ? 50 - width : 50)}
        y="2"
        width={svgNumber(width)}
        height="8"
        rx="1"
        className={value < 0 ? "fill-chart-2" : "fill-primary"}
      />
      <line x1="50" x2="50" y1="0" y2="12" className="stroke-foreground" />
    </svg>
  );
}

function VectorCell({ value, limit = 1.6 }: { value: number; limit?: number }) {
  return (
    <td className="space-y-1 p-2 text-center tabular-nums">
      <span>{signedNumber(value)}</span>
      <SignedBar value={value} limit={limit} />
    </td>
  );
}

export function LlmEmbeddingDemo() {
  const [position, setPosition] = useState(2);
  const selected = embeddingAt(position);

  return (
    <DemoFrame
      title="同じトークンに、異なる位置情報を足す"
      label="埋め込みと位置情報の可視化"
      description="図は説明用の4次元ベクトルである。トークン分割・ID・数値はGPT-3の実測ではない。各成分は学習で決まる座標であり、人名・時刻などの意味軸ではない。GPT-3 175Bでは各位置を12,288次元で表す。"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium">① 入力列から位置を選ぶ</p>
        <div className="flex flex-wrap gap-2">
          {EMBEDDING_TOKEN_IDS.map((tokenId, index) => (
            <Button
              key={`position-${index + 1}`}
              type="button"
              variant={position === index ? "default" : "outline"}
              aria-pressed={position === index}
              onClick={() => setPosition(index)}
            >
              {index + 1}：{EMBEDDING_TABLE[tokenId].token}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          ② トークンIDを使って表の1行を取り出す
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm tabular-nums">
            <caption className="sr-only">
              説明用の埋め込み表。選択中の行を明記する。
            </caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="p-2">
                  ID・トークン
                </th>
                {[1, 2, 3, 4].map((dimension) => (
                  <th key={dimension} scope="col" className="p-2 text-center">
                    成分{dimension}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMBEDDING_TABLE.map((entry) => (
                <tr
                  key={entry.id}
                  className={
                    entry.id === selected.id ? "border-b bg-accent" : "border-b"
                  }
                >
                  <th
                    scope="row"
                    className="p-2 text-left font-normal whitespace-nowrap"
                  >
                    {entry.id}：{entry.token}
                    {entry.id === selected.id ? " ← 選択行" : ""}
                  </th>
                  {entry.vector.map((value, dimension) => (
                    <VectorCell
                      key={`component-${dimension + 1}`}
                      value={value}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">③ 位置ベクトルを成分ごとに足す</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm tabular-nums">
            <caption className="sr-only">
              位置{position + 1}の埋め込み、位置ベクトル、加算結果
            </caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="p-2">
                  成分
                </th>
                <th scope="col" className="p-2 text-center">
                  埋め込み e
                </th>
                <th scope="col" className="p-2 text-center">
                  位置 p
                </th>
                <th scope="col" className="p-2 text-center">
                  入力 h⁰ = e + p
                </th>
              </tr>
            </thead>
            <tbody>
              {selected.vector.map((value, dimension) => (
                <tr key={`sum-${dimension + 1}`} className="border-b">
                  <th scope="row" className="p-2 text-left font-normal">
                    {dimension + 1}
                  </th>
                  <VectorCell value={value} />
                  <VectorCell value={selected.positional[dimension] ?? 0} />
                  <VectorCell value={selected.hidden[dimension] ?? 0} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          棒は中央が0で、右が正、左が負である。すべて同じ尺度で描いている。
        </p>
      </div>

      <output
        className="block rounded-md border bg-muted p-3 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        位置{position + 1}「{selected.token}」はID {selected.id}
        の埋め込みを参照する。
        位置3と位置6の「ノートを」を切り替えると、参照する行は同じまま、位置ベクトルと加算結果が変わる。
        この段階では、周囲のトークンの内容はまだ混ざっていない。
      </output>
    </DemoFrame>
  );
}

function NetworkDiagram({
  input,
  activated,
  output,
}: {
  input: Pair;
  activated: readonly number[];
  output: readonly number[];
}) {
  const id = useId();
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 560 300"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="w-full min-w-md"
      >
        <title id={`${id}-title`}>MLPの2→8→2の接続</title>
        <desc id={`${id}-description`}>
          左が入力2成分、中央が活性化後の8成分、右が出力2成分である。線は重みで、実線は正、破線は負を表す。線が濃いほど重みの絶対値が大きい。丸の中に現在の値を表示する。
        </desc>
        <text
          x="75"
          y="22"
          textAnchor="middle"
          className="fill-foreground text-xs"
        >
          入力 a：2成分
        </text>
        <text
          x="280"
          y="22"
          textAnchor="middle"
          className="fill-foreground text-xs"
        >
          中間層：8成分
        </text>
        <text
          x="485"
          y="22"
          textAnchor="middle"
          className="fill-foreground text-xs"
        >
          出力 m：2成分
        </text>
        {MLP_W1.map((weights, hiddenIndex) =>
          weights.map((weight, inputIndex) => (
            <line
              key={`first-${inputIndex}-${hiddenIndex}`}
              x1="99"
              y1={105 + inputIndex * 100}
              x2="256"
              y2={50 + hiddenIndex * 32}
              strokeWidth="1.5"
              strokeDasharray={weight < 0 ? "4 3" : undefined}
              strokeOpacity={svgNumber(Math.abs(weight) * 0.7)}
              className="stroke-muted-foreground"
            />
          ))
        )}
        {MLP_W2.map((weights, outputIndex) =>
          weights.map((weight, hiddenIndex) => (
            <line
              key={`second-${hiddenIndex}-${outputIndex}`}
              x1="304"
              y1={50 + hiddenIndex * 32}
              x2="461"
              y2={105 + outputIndex * 100}
              strokeWidth="1.5"
              strokeDasharray={weight < 0 ? "4 3" : undefined}
              strokeOpacity={svgNumber(Math.abs(weight) * 0.7)}
              className="stroke-muted-foreground"
            />
          ))
        )}
        {input.map((value, index) => (
          <g key={`input-${index + 1}`}>
            <circle
              cx="75"
              cy={105 + index * 100}
              r="24"
              className="fill-background stroke-border"
            />
            <text
              x="75"
              y={109 + index * 100}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              {signedNumber(value)}
            </text>
          </g>
        ))}
        {activated.map((value, index) => (
          <g key={`hidden-${index + 1}`}>
            <rect
              x="254"
              y={38 + index * 32}
              width="52"
              height="24"
              rx="8"
              className={
                value < 0
                  ? "fill-chart-2/15 stroke-chart-2"
                  : "fill-primary/15 stroke-primary"
              }
            />
            <text
              x="280"
              y={54 + index * 32}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              {signedNumber(value)}
            </text>
          </g>
        ))}
        {output.map((value, index) => (
          <g key={`output-${index + 1}`}>
            <circle
              cx="485"
              cy={105 + index * 100}
              r="24"
              className="fill-background stroke-border"
            />
            <text
              x="485"
              y={109 + index * 100}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              {signedNumber(value)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MlpCurve({ input, nonlinear }: { input: Pair; nonlinear: boolean }) {
  const id = useId();
  const samples = Array.from({ length: 81 }, (_, index) => {
    const x = -2 + index / 20;
    return {
      x,
      gelu: evaluateMlp([x, input[1]]).output[0] ?? 0,
      linear: evaluateMlp([x, input[1]], false).output[0] ?? 0,
    };
  });
  const limit = Math.max(
    1,
    ...samples.flatMap(({ gelu, linear }) => [Math.abs(gelu), Math.abs(linear)])
  );
  const plotY = (y: number) => 130 - (y / limit) * 95;
  const path = (key: "gelu" | "linear") =>
    samples
      .map(
        (sample, index) =>
          `${index === 0 ? "M" : "L"}${svgNumber(plotX(sample.x))},${svgNumber(plotY(sample[key]))}`
      )
      .join(" ");
  const current = evaluateMlp(input, nonlinear).output[0] ?? 0;
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 560 280"
          role="img"
          aria-labelledby={`${id}-title ${id}-description`}
          className="w-full min-w-md"
        >
          <title id={`${id}-title`}>入力a₁と出力m₁の関係</title>
          <desc id={`${id}-description`}>
            a₂を現在の値に固定し、a₁を−2から2まで動かした場合の出力m₁を描く。実線はGELUあり、破線はGELU省略である。丸は現在選択している計算の出力を示す。破線は直線になる。
          </desc>
          <line x1="50" x2="510" y1="130" y2="130" className="stroke-border" />
          <line x1="280" x2="280" y1="30" y2="230" className="stroke-border" />
          <path
            d={path("linear")}
            fill="none"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="stroke-chart-2"
          />
          <path
            d={path("gelu")}
            fill="none"
            strokeWidth="3"
            className="stroke-primary"
          />
          <circle
            cx={svgNumber(plotX(input[0]))}
            cy={svgNumber(plotY(current))}
            r="6"
            className="fill-foreground stroke-background"
            strokeWidth="2"
          />
          <text
            x="50"
            y="250"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            −2
          </text>
          <text
            x="280"
            y="250"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            0
          </text>
          <text
            x="510"
            y="250"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            +2
          </text>
          <text
            x="280"
            y="272"
            textAnchor="middle"
            className="fill-foreground text-xs"
          >
            入力 a₁（a₂ = {input[1].toFixed(1)} に固定）
          </text>
          <text
            x="42"
            y="40"
            textAnchor="end"
            className="fill-muted-foreground text-xs"
          >
            {limit.toFixed(1)}
          </text>
          <text
            x="42"
            y="134"
            textAnchor="end"
            className="fill-muted-foreground text-xs"
          >
            0
          </text>
          <text
            x="42"
            y="228"
            textAnchor="end"
            className="fill-muted-foreground text-xs"
          >
            −{limit.toFixed(1)}
          </text>
          <text x="52" y="18" className="fill-foreground text-xs">
            出力 m₁
          </text>
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">
        実線：GELUあり。破線：GELU省略。丸：現在の入力と選択中の計算。a₂を固定した断面であり、出力の全体像は2変数の関数である。
      </p>
    </div>
  );
}

export function LlmMlpDemo() {
  const id = useId();
  const [input, setInput] = useState<Pair>([0.8, -0.4]);
  const [nonlinear, setNonlinear] = useState(true);
  const { preactivation, activated, output } = evaluateMlp(input, nonlinear);

  return (
    <DemoFrame
      title="中間表現の拡張と非線形変換"
      label="MLPと非線形変換の可視化"
      description="説明用の2→8→2のMLPである。入力幅を4倍にする比率はGPT-3と同じである。重みと数値には説明用に設定した値を使う。ここでは任意の入力aに対するMLPだけを計算し、LayerNormと残差加算は計算しない。"
    >
      <p className="rounded-md border bg-muted p-3 text-sm">
        実際のブロックとの対応は a = LN(u)、m = MLP(a)、次の状態 = u + m
        である。
        スライダーはMLP入力aを直接操作する。aを残差入力uとして扱うことはできない。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {input.map((value, index) => (
          <div key={`input-control-${index + 1}`} className="space-y-2">
            <label
              htmlFor={`${id}-input-${index}`}
              className="block text-sm font-medium"
            >
              入力 a{index === 0 ? "₁" : "₂"}：{signedNumber(value)}
            </label>
            <input
              id={`${id}-input-${index}`}
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={value}
              onChange={(event) => {
                const next = Number(event.target.value);
                setInput((current) =>
                  index === 0 ? [next, current[1]] : [current[0], next]
                );
              }}
              className="h-8 w-full accent-primary"
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        aria-pressed={!nonlinear}
        onClick={() => setNonlinear((current) => !current)}
      >
        {nonlinear ? "GELUを省いて比較する" : "GELUを有効に戻す"}
      </Button>
      <p className="text-sm font-medium">
        a → z = W₁a + b₁ → {nonlinear ? "g = GELU(z)" : "g = z（GELU省略）"} → m
        = W₂g + b₂
      </p>
      <NetworkDiagram input={input} activated={activated} output={output} />
      <p className="text-xs text-muted-foreground">
        接続線は学習される重みを表す。実線は正、破線は負、濃さは重みの絶対値である。中間層の値にはバイアスと活性化関数の効果も含まれる。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-md text-sm tabular-nums">
          <caption className="sr-only">
            8個の中間成分の前活性と活性化後の値。棒は中央が0。
          </caption>
          <thead>
            <tr className="border-b text-left">
              <th scope="col" className="p-2">
                中間成分
              </th>
              <th scope="col" className="p-2 text-center">
                前活性 z
              </th>
              <th scope="col" className="p-2 text-center">
                {nonlinear ? "GELU(z)" : "z（そのまま）"}
              </th>
            </tr>
          </thead>
          <tbody>
            {preactivation.map((value, index) => (
              <tr key={`preactivation-${index + 1}`} className="border-b">
                <th scope="row" className="p-2 text-left font-normal">
                  {index + 1}
                </th>
                <VectorCell value={value} limit={4} />
                <VectorCell value={activated[index] ?? 0} limit={4} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <output
        className="block text-sm tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {nonlinear ? "GELUあり" : "GELU省略"}の出力 m = [
        {output.map(signedNumber).join(", ")}]ᵀ
      </output>
      <p className="text-sm">
        GELUは負の値を一律に0にはしない。負の入力も滑らかに弱める。GELUを省くと、バイアスを含む2回の変換は1回のアフィン変換にまとめられ、下の関係は直線になる。
      </p>
      <MlpCurve input={input} nonlinear={nonlinear} />
      <details className="rounded-md border p-3 text-sm">
        <summary className="cursor-pointer font-medium">
          この図で使った重み・バイアス・GELU近似式
        </summary>
        <div className="mt-3 space-y-3">
          <p>
            aは列ベクトルである。W₁は8×2、W₂は2×8で、すべての位置に同じMLPを適用する。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-md text-xs tabular-nums">
              <caption className="sr-only">
                中間成分ごとの入力側の重み、バイアス、出力側の重み
              </caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="p-2">
                    j
                  </th>
                  <th scope="col" className="p-2">
                    W₁[j,1]
                  </th>
                  <th scope="col" className="p-2">
                    W₁[j,2]
                  </th>
                  <th scope="col" className="p-2">
                    b₁[j]
                  </th>
                  <th scope="col" className="p-2">
                    W₂[1,j]
                  </th>
                  <th scope="col" className="p-2">
                    W₂[2,j]
                  </th>
                </tr>
              </thead>
              <tbody>
                {MLP_B1.map((bias, index) => (
                  <tr key={`weight-${index + 1}`} className="border-b">
                    <th scope="row" className="p-2 font-normal">
                      {index + 1}
                    </th>
                    <td className="p-2">{MLP_W1[index]?.[0]}</td>
                    <td className="p-2">{MLP_W1[index]?.[1]}</td>
                    <td className="p-2">{bias}</td>
                    <td className="p-2">{MLP_W2[0][index]}</td>
                    <td className="p-2">{MLP_W2[1][index]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            b₂ = [{MLP_B2.join(", ")}]ᵀ。GELUにはGPT-2と同じ近似式 0.5z × (1 +
            tanh(√(2/π) × (z + 0.044715z³))) を使っている。
          </p>
        </div>
      </details>
    </DemoFrame>
  );
}
