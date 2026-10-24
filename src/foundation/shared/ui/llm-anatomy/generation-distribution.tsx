"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- 実際の確率と抽選区間を示すSVGに図全体の説明を与える。 */

import { useId } from "react";
import { FLOW_VOCABULARY } from "./generation-math";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import type { StoryStage } from "./generation-story-timeline";
import { svgNumber } from "./svg-number";

type StoryProps = {
  trace: GenerationTrace;
  selection: GenerationSelection;
  stage: StoryStage;
  progress: number;
};

const DRAW = 0.62;
const INTERVAL_LEFT = 20;
const INTERVAL_WIDTH = 600;
const INTERVAL_TOP = 74;

function ease(progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function GenerationDistribution({
  trace,
  selection,
  stage,
  progress,
}: StoryProps) {
  const id = useId();
  if (
    stage !== "probabilities" &&
    stage !== "selection" &&
    stage !== "decode" &&
    stage !== "return"
  ) {
    return null;
  }

  const growing = stage === "probabilities" ? ease(progress / 0.55) : 1;
  let arrival = 1;
  if (stage === "probabilities") {
    arrival = 0;
  } else if (stage === "selection") {
    arrival = ease(progress / 0.45);
  }
  const selected = arrival === 1;
  const largest = Math.max(...trace.probabilities);
  const markerX = INTERVAL_LEFT + DRAW * INTERVAL_WIDTH;
  const markerTip = 48 + 26 * arrival;
  const intervals: {
    tokenId: number;
    probability: number;
    start: number;
  }[] = [];
  let intervalStart = 0;
  for (const [tokenId, probability] of trace.probabilities.entries()) {
    intervals.push({ tokenId, probability, start: intervalStart });
    intervalStart += probability;
  }

  return (
    <div
      className="space-y-3 rounded-md border bg-background p-3"
      data-generation-distribution
    >
      <p className="text-sm font-medium">
        同じ確率πを、棒の長さとIDの区間の幅で表す
      </p>
      <p className="text-xs text-muted-foreground">
        zは語彙のスコア、右端はsoftmax後の確率。棒は最大確率を基準に表示する。
      </p>
      <ul className="m-0 list-none space-y-2 p-0">
        {trace.probabilities.map((probability, tokenId) => {
          const width =
            largest > 0 ? (probability / largest) * 100 * growing : 0;
          const highlighted = selected && tokenId === selection.id;
          const entry = FLOW_VOCABULARY[tokenId];
          return (
            <li
              key={tokenId}
              className="flex items-center gap-3"
              data-probability-id={tokenId}
              data-selected={highlighted ? "true" : "false"}
            >
              <div className="w-20 shrink-0">
                <p
                  className={
                    highlighted
                      ? "text-sm font-semibold text-primary"
                      : "text-sm"
                  }
                >
                  {tokenId} · {entry?.isEnd ? "終端" : entry?.piece}
                </p>
                <p className="text-xs text-muted-foreground">
                  z {(trace.logits[tokenId] ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <svg
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="h-3 w-full"
                >
                  <rect width="100" height="12" rx="3" className="fill-muted" />
                  <rect
                    width={svgNumber(width)}
                    height="12"
                    rx="3"
                    className={
                      highlighted
                        ? "fill-primary"
                        : tokenId % 2 === 0
                          ? "fill-primary/35"
                          : "fill-primary/65"
                    }
                  />
                </svg>
              </div>
              <p
                className={
                  highlighted
                    ? "w-16 shrink-0 text-right text-sm font-semibold text-primary"
                    : "w-16 shrink-0 text-right text-sm"
                }
              >
                {percent(probability)}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="pt-1 text-sm font-medium">同じπを、0〜1のIDの区間へ</p>
      <svg
        viewBox="0 0 640 150"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="block h-auto w-full"
      >
        <title id={`${id}-title`}>確率をIDの区間の幅に対応させる</title>
        <desc id={`${id}-description`}>
          上の棒と同じ確率を0から1の区間の幅で表す。抽選値0.62が入る区間のID{" "}
          {selection.id}を選び、そのIDを文字列への復元へ渡す。
        </desc>
        {intervals.map(({ tokenId, probability, start }) => {
          const left = INTERVAL_LEFT + start * INTERVAL_WIDTH;
          const width = probability * INTERVAL_WIDTH;
          const highlighted = selected && tokenId === selection.id;
          return (
            <g key={tokenId} data-probability-interval={tokenId}>
              <rect
                x={svgNumber(left)}
                y={INTERVAL_TOP}
                width={svgNumber(width)}
                height="32"
                strokeWidth="1.5"
                className={
                  highlighted
                    ? "fill-primary stroke-background"
                    : tokenId % 2 === 0
                      ? "fill-primary/35 stroke-background"
                      : "fill-primary/65 stroke-background"
                }
              >
                <title>
                  ID {tokenId}：区間の幅 {percent(probability)}
                </title>
              </rect>
              {width >= 36 && (
                <text
                  x={svgNumber(left + width / 2)}
                  y={INTERVAL_TOP + 25}
                  textAnchor="middle"
                  fontSize="24"
                  className={
                    highlighted
                      ? "fill-primary-foreground font-semibold"
                      : "fill-foreground"
                  }
                >
                  {tokenId}
                </text>
              )}
            </g>
          );
        })}
        <g
          opacity={stage === "probabilities" ? "0.55" : "1"}
          data-distribution-draw="0.62"
        >
          <text
            x={svgNumber(markerX)}
            y={svgNumber(markerTip - 25)}
            textAnchor="middle"
            fontSize="24"
            className="fill-chart-2 font-semibold"
          >
            r = 0.62
          </text>
          <path
            d={`M${svgNumber(markerX)} ${svgNumber(markerTip - 19)} V${svgNumber(markerTip - 8)}`}
            fill="none"
            strokeWidth="3"
            className="stroke-chart-2"
          />
          <path
            d={`M${svgNumber(markerX - 7)} ${svgNumber(markerTip - 9)} L${svgNumber(markerX)} ${svgNumber(markerTip)} L${svgNumber(markerX + 7)} ${svgNumber(markerTip - 9)} Z`}
            className="fill-chart-2"
          />
        </g>
        <text x="20" y="139" fontSize="24" className="fill-muted-foreground">
          0
        </text>
        <text
          x="620"
          y="139"
          textAnchor="end"
          fontSize="24"
          className="fill-muted-foreground"
        >
          1
        </text>
        {selected && (
          <text
            x="320"
            y="139"
            textAnchor="middle"
            fontSize="24"
            className="fill-foreground font-semibold"
          >
            この区間から、整数ID {selection.id}を選ぶ
          </text>
        )}
      </svg>
    </div>
  );
}
