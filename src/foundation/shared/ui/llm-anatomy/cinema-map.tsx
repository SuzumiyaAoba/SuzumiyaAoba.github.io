"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG全体にモデル構造の説明を与える。 */

import { useId } from "react";
import { routeFrame, ROUTE_NODES } from "./generation-route";
import type { RouteNodeId } from "./generation-route";
import type { StoryStage } from "./generation-story-timeline";

const MOBILE_GROUPS = [
  { label: "ID", ids: ["input"] },
  { label: "埋め込み", ids: ["embedding"] },
  { label: "ブロック", ids: ["attention", "attention-add", "mlp", "mlp-add"] },
  { label: "語彙", ids: ["final-norm", "output"] },
  { label: "確率・ID", ids: ["probabilities", "selection"] },
  { label: "復元", ids: ["decode", "return"] },
] as const;

const ORDER: readonly RouteNodeId[] = [
  "input",
  "embedding",
  "attention",
  "attention-add",
  "mlp",
  "mlp-add",
  "final-norm",
  "output",
  "probabilities",
  "selection",
  "decode",
  "return",
];
function position(index: number) {
  return {
    x: index < 6 ? 110 + index * 220 : 1210 - (index - 6) * 220,
    y: index < 6 ? 48 : 125,
  };
}
function mainPath(index: number): string {
  if (index === 5) {
    return "M1306 48 H1310 V125 H1306";
  }
  const from = position(index),
    to = position(index + 1);
  const dx = Math.sign(to.x - from.x),
    dy = Math.sign(to.y - from.y);
  return `M${from.x + dx * 96} ${from.y + dy * 26} L${to.x - dx * 96} ${to.y - dy * 26}`;
}

/** 全体構造は動かさず、主図で追う演算の位置だけを強調する。 */
export function CinemaMap({
  stage,
  progress,
}: {
  stage: StoryStage;
  progress: number;
}) {
  const marker = useId();
  const residualMarker = useId();
  const description = useId();
  const { activeNodeId } = routeFrame(stage, progress);
  return (
    <section
      aria-label="LLM全体の中の現在位置"
      className="shrink-0 border-b bg-muted/10 px-3 py-2 sm:px-6"
      data-cinema-map
    >
      <svg
        viewBox="0 0 1320 158"
        role="img"
        aria-labelledby={description}
        className="llm-cinema-map-wide"
      >
        <title id={description}>
          {`入力から再入力までのPre-LN型Transformer。現在の処理は${ROUTE_NODES.find((node) => node.id === activeNodeId)?.label}。`}
        </title>
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 Z" className="fill-muted-foreground" />
          </marker>
          <marker
            id={residualMarker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 Z" className="fill-chart-2" />
          </marker>
        </defs>
        {ORDER.slice(0, -1).map((id, index) => (
          <path
            key={id}
            d={mainPath(index)}
            fill="none"
            strokeWidth="2"
            className="stroke-muted-foreground"
            markerEnd={`url(#${marker})`}
          />
        ))}
        <path
          d="M330 28 V12 H770 V28"
          fill="none"
          strokeWidth="2"
          strokeDasharray="5 4"
          className="stroke-chart-2"
          markerEnd={`url(#${residualMarker})`}
        />
        <path
          d="M770 68 V86 H1210 V68"
          fill="none"
          strokeWidth="2"
          strokeDasharray="5 4"
          className="stroke-chart-2"
          markerEnd={`url(#${residualMarker})`}
        />
        <path
          d="M14 125 H12 V48 H14"
          fill="none"
          strokeWidth="2"
          className="stroke-muted-foreground"
          markerEnd={`url(#${marker})`}
        />
        <text
          x="550"
          y="16"
          textAnchor="middle"
          fontSize="13"
          paintOrder="stroke"
          strokeWidth="6"
          className="fill-chart-2 stroke-background"
        >
          H⁰を保持
        </text>
        <text
          x="990"
          y="90"
          textAnchor="middle"
          fontSize="13"
          paintOrder="stroke"
          strokeWidth="6"
          className="fill-chart-2 stroke-background"
        >
          Uを保持
        </text>
        {ORDER.map((id, index) => {
          const active = id === activeNodeId;
          const point = position(index);
          return (
            <g
              key={id}
              data-cinema-node={id}
              data-current={active ? "true" : "false"}
            >
              <rect
                x={point.x - 88}
                y={point.y - 18}
                width="176"
                height="36"
                rx="8"
                strokeWidth={active ? "2" : "1"}
                className={
                  active
                    ? "fill-primary stroke-primary"
                    : "fill-background stroke-border"
                }
              />
              <text
                x={point.x}
                y={point.y + 6}
                textAnchor="middle"
                fontSize="18"
                className={
                  active
                    ? "fill-primary-foreground font-semibold"
                    : "fill-muted-foreground"
                }
              >
                {ROUTE_NODES.find((node) => node.id === id)?.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ol
        className="m-0 llm-cinema-map-compact list-none grid-cols-6 gap-1 p-0 text-center text-xs"
        aria-label="全体の流れ"
      >
        {MOBILE_GROUPS.map((group) => {
          const active = group.ids.some((id) => id === activeNodeId);
          return (
            <li
              key={group.label}
              aria-current={active ? "step" : undefined}
              className={
                active
                  ? "rounded bg-primary px-1 py-2 font-medium text-primary-foreground"
                  : "px-1 py-2 text-muted-foreground"
              }
            >
              {group.label}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
