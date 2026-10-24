"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVGに図の役割と代替説明を与える。HTMLのimgでは操作に応じた確率図を表せない。 */

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { sampleIndex, softmax } from "./probability";
import { svgNumber } from "./svg-number";
import { DemoFrame } from "./visual-frame";

const CANDIDATES = [
  { token: "返す", score: 3, fill: "fill-chart-1" },
  { token: "読む", score: 2, fill: "fill-chart-2" },
  { token: "買う", score: 1, fill: "fill-chart-3" },
  { token: "捨てる", score: 0, fill: "fill-chart-4" },
] as const;

export function LlmSamplingDemo() {
  const id = useId();
  const [temperature, setTemperature] = useState(1);
  const [draw, setDraw] = useState(0.75);
  const probabilities = softmax(
    CANDIDATES.map(({ score }) => score),
    temperature
  );
  const selected = sampleIndex(probabilities, draw);
  let cumulative = 0;
  const intervals = probabilities.map((probability) => {
    const start = cumulative;
    cumulative += probability;
    return { start, end: cumulative };
  });

  return (
    <DemoFrame
      title="logit → 確率分布 → 累積区間 → 次のトークン"
      description="4候補の説明用モデルで、softmax(z/T)とサンプリングを実際に計算する。候補とスコアはGPT-3の測定値ではない。top-k・top-pによる候補の制限は行わない。"
      label="温度とサンプリングの実験"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={`${id}-temperature`} className="block font-medium">
            温度 T：{temperature.toFixed(1)}
          </label>
          <input
            id={`${id}-temperature`}
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
            className="h-8 w-full accent-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-draw`} className="block font-medium">
            乱数 u：{draw.toFixed(3)}（0以上1未満）
          </label>
          <input
            id={`${id}-draw`}
            type="range"
            min="0"
            max="0.999"
            step="0.001"
            value={draw}
            onChange={(event) => setDraw(Number(event.target.value))}
            className="h-8 w-full accent-primary"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-labelledby={`${id}-chart-title ${id}-chart-description`}
          viewBox="0 0 640 245"
          className="h-auto w-full min-w-lg"
        >
          <title id={`${id}-chart-title`}>確率分布とサンプリング区間</title>
          <desc id={`${id}-chart-description`}>
            上段の棒の長さが各候補の確率を表す。下段は同じ確率で0から1を分割した区間で、
            乱数uの縦線が入った区間の候補を選ぶ。現在は
            {CANDIDATES[selected]?.token}を選択している。
          </desc>
          {CANDIDATES.map((candidate, index) => {
            const probability = probabilities[index] ?? 0;
            const y = 12 + index * 34;
            return (
              <g key={candidate.token}>
                <text x="8" y={y + 18} className="fill-foreground text-sm">
                  {candidate.token}
                </text>
                <rect
                  x="80"
                  y={y}
                  width="470"
                  height="26"
                  className="fill-muted"
                />
                <rect
                  x="80"
                  y={y}
                  width={svgNumber(470 * probability)}
                  height="26"
                  className={candidate.fill}
                  fillOpacity="0.65"
                />
                <text
                  x="626"
                  y={y + 18}
                  textAnchor="end"
                  className="fill-foreground text-sm"
                >
                  {(probability * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}
          <text x="8" y="172" className="fill-foreground text-sm">
            累積区間（候補の順序は上から）
          </text>
          {CANDIDATES.map((candidate, index) => (
            <rect
              key={candidate.token}
              x={svgNumber(20 + (intervals[index]?.start ?? 0) * 600)}
              y="185"
              width={svgNumber((probabilities[index] ?? 0) * 600)}
              height="28"
              className={candidate.fill}
              fillOpacity="0.65"
            />
          ))}
          <line
            x1={svgNumber(20 + draw * 600)}
            x2={svgNumber(20 + draw * 600)}
            y1="178"
            y2="220"
            className="stroke-foreground"
            strokeWidth="2"
          />
          <text x="20" y="239" className="fill-foreground text-sm">
            0
          </text>
          <text
            x="320"
            y="239"
            textAnchor="middle"
            className="fill-foreground text-sm"
          >
            0.5
          </text>
          <text
            x="620"
            y="239"
            textAnchor="end"
            className="fill-foreground text-sm"
          >
            1
          </text>
        </svg>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">
            各候補のスコア、確率、サンプリング区間
          </caption>
          <thead>
            <tr className="border-b">
              {["候補", "z", "z / T", "確率", "累積区間 [開始, 終了)"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="p-2 font-medium whitespace-nowrap"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {CANDIDATES.map((candidate, index) => (
              <tr key={candidate.token} className="border-b">
                <th scope="row" className="p-2 font-normal whitespace-nowrap">
                  {candidate.token}
                  {selected === index ? " ← 選択" : ""}
                </th>
                <td className="p-2">{candidate.score}</td>
                <td className="p-2">
                  {(candidate.score / temperature).toFixed(2)}
                </td>
                <td className="p-2">
                  {((probabilities[index] ?? 0) * 100).toFixed(1)}%
                </td>
                <td className="p-2 whitespace-nowrap">
                  [{intervals[index]?.start.toFixed(4)},{" "}
                  {intervals[index]?.end.toFixed(4)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDraw(Math.random())}
        >
          乱数を生成する
        </Button>
        <output aria-live="polite" aria-atomic="true">
          選ばれた候補：<strong>{CANDIDATES[selected]?.token}</strong>
        </output>
      </div>
      <p className="text-muted-foreground">
        温度は区間の長さを変え、乱数は区間内の位置を決める。
        表示値は丸めているが、選択には丸める前の確率を使う。
      </p>
    </DemoFrame>
  );
}
