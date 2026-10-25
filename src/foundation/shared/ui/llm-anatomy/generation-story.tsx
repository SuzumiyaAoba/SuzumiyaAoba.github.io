"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- 接続を固定したSVGに図全体の説明を与える。 */

import { memo, useId, useMemo } from "react";
import type { Ref } from "react";
import { GenerationDistribution } from "./generation-distribution";
import { decodeFlow, FLOW_VOCABULARY } from "./generation-math";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import { generationPayloads } from "./generation-payload";
import type { GenerationPayload } from "./generation-payload";
import {
  pointOnRouteEdge,
  ROUTE_EDGES,
  ROUTE_NODES,
  routeFrame,
  routeNodeById,
} from "./generation-route";
import type { RouteEdge, RouteNode, RouteNodeId } from "./generation-route";
import { STORY_PHASES } from "./generation-story-timeline";
import type { StoryStage } from "./generation-story-timeline";
import { svgNumber } from "./svg-number";

type StoryProps = {
  trace: GenerationTrace;
  selection: GenerationSelection;
  stage: StoryStage;
  progress: number;
  viewportRef?: Ref<HTMLDivElement> | undefined;
};

type NodePayloads = ReturnType<typeof generationPayloads>;

const SYMBOLS: Record<string, string> = {
  text: "文字",
  ids: "IDs",
  h0: "H⁰",
  attention: "A",
  u: "U",
  mlp: "M",
  "h-prime": "H′",
  "last-hidden": "h",
  logits: "z",
  probabilities: "π",
  "selected-id": "ID",
  decoded: "ID",
  "next-ids": "IDs+",
};

const WAITING_CAPTIONS: Partial<Record<RouteNodeId, string>> = {
  "attention-add": "U = H⁰ + A",
  mlp: "4 → 16 → 4",
  "mlp-add": "H′ = U + M",
  "final-norm": "末尾の4成分",
  selection: "8確率 → 1 ID",
  decode: "ID → 文字片",
  return: "n → n+1個のID",
};

function decimal(value: number | undefined): string {
  return (value ?? 0).toFixed(3);
}

function payloadSymbol(payload: GenerationPayload): string {
  if (payload.selectedId !== undefined && !payload.ids) {
    return `ID ${payload.selectedId}`;
  }
  return SYMBOLS[payload.key] ?? payload.label;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mergeOffset(progress: number): number {
  const local = clamp(progress / 0.55);
  return 40 * Math.min(clamp(local / 0.25), clamp((1 - local) / 0.25));
}

function boundary(
  center: readonly [number, number],
  toward: readonly [number, number],
  node: RouteNode
): readonly [number, number] {
  const [x, y] = center;
  const [targetX, targetY] = toward;
  return [
    x + Math.sign(targetX - x) * (node.width / 2 + 8),
    y + Math.sign(targetY - y) * (node.height / 2 + 8),
  ];
}

function polygonPoints(
  coordinates: readonly (readonly [number, number])[]
): string {
  return coordinates
    .map(([x, y]) => `${svgNumber(x)},${svgNumber(y)}`)
    .join(" ");
}

// 移動の中心線は変えず、矢印だけをカードの外側までに切り詰める。
function visiblePath(edge: RouteEdge): string {
  const points = edge.waypoints.map(([x, y]) => [x, y] as const);
  const [first, second] = points;
  const last = points.at(-1);
  const beforeLast = points.at(-2);
  if (!first || !second || !last || !beforeLast) {
    return edge.path;
  }
  const source = routeNodeById(edge.from);
  const target = routeNodeById(edge.to);
  points[0] = boundary(first, second, source);
  points[points.length - 1] = boundary(last, beforeLast, target);
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${svgNumber(x)} ${svgNumber(y)}`
    )
    .join(" ");
}

/** 各セルは実際の成分。立体の厚みは模式的で、色の濃さが絶対値を表す。 */
function TensorGlyph({ payload }: { payload: GenerationPayload }) {
  const rows = payload.rows ?? (payload.values ? [payload.values] : []);
  if (rows.length === 0) {
    return null;
  }
  return (
    <g transform="translate(-82 -7)">
      {rows.map((row, rowIndex) =>
        row.map((value, column) => {
          const x = column * 10 + rowIndex * 5;
          const y = rowIndex * 6 - column * 2;
          return (
            <g key={`${rowIndex}-${column}`}>
              <polygon
                points={polygonPoints([
                  [x, y],
                  [x + 8, y - 2],
                  [x + 13, y + 1],
                  [x + 5, y + 3],
                ])}
                className={
                  value < 0
                    ? "fill-chart-2 stroke-background"
                    : "fill-primary stroke-background"
                }
                fillOpacity={svgNumber(
                  0.2 + Math.min(Math.abs(value) / 3, 1) * 0.8
                )}
                strokeWidth="0.6"
              />
              <polygon
                points={polygonPoints([
                  [x, y],
                  [x + 5, y + 3],
                  [x + 5, y + 8],
                  [x, y + 5],
                ])}
                className="fill-muted stroke-border"
                strokeWidth="0.6"
              />
              <polygon
                points={polygonPoints([
                  [x + 5, y + 3],
                  [x + 13, y + 1],
                  [x + 13, y + 6],
                  [x + 5, y + 8],
                ])}
                className="fill-muted-foreground/30 stroke-border"
                strokeWidth="0.6"
              />
            </g>
          );
        })
      )}
    </g>
  );
}

function nodeResult(payload: GenerationPayload): string {
  if (payload.ids) {
    return `[${payload.ids.join(", ")}]`;
  }
  if (payload.piece !== undefined) {
    return `${payload.selectedId} →「${payload.piece}」`;
  }
  if (payload.selectedId !== undefined) {
    return `ID ${payload.selectedId}`;
  }
  return `${payloadSymbol(payload)} · ${payload.shape}`;
}

function OperationCardView({
  node,
  payload,
  settled,
  active,
  receiving,
  nextInput,
}: {
  node: RouteNode;
  payload: GenerationPayload;
  settled: boolean;
  active: boolean;
  receiving: boolean;
  nextInput?: GenerationPayload | undefined;
}) {
  const [x, y] = node.center;
  const shown = nextInput ?? payload;
  const known = settled || !!nextInput;
  return (
    <g
      transform={`translate(${x} ${y})`}
      data-route-node={node.id}
      data-node-state={active ? "active" : known ? "computed" : "waiting"}
      data-result-key={known ? shown.key : undefined}
    >
      <rect
        x={-node.width / 2}
        y={-node.height / 2}
        width={node.width}
        height={node.height}
        rx="12"
        strokeWidth={active || receiving ? "3" : "1.5"}
        className={
          active || receiving
            ? "fill-primary/5 stroke-primary"
            : "fill-background stroke-border"
        }
      />
      <text
        y="-25"
        textAnchor="middle"
        fontSize="26"
        className="fill-foreground font-semibold"
      >
        {node.label}
      </text>
      {known ? (
        <StoredOperationResult shown={shown} />
      ) : (
        <text
          y="9"
          textAnchor="middle"
          fontSize="22"
          opacity={active ? "0" : "1"}
          className="fill-muted-foreground"
        >
          {WAITING_CAPTIONS[node.id] ?? node.shape}
        </text>
      )}
      <text
        y="39"
        textAnchor="middle"
        fontSize="19"
        className="fill-muted-foreground"
      >
        {nextInput
          ? "次の予測の入力"
          : active
            ? "計算中"
            : known
              ? shown.shape
              : "入力を待つ"}
      </text>
    </g>
  );
}

const OperationCard = memo(OperationCardView);

function StoredOperationResult({ shown }: { shown: GenerationPayload }) {
  return (
    <g data-stored-result={shown.key}>
      <TensorGlyph payload={shown} />
      <text
        x={shown.rows || shown.values ? 25 : 0}
        y="9"
        textAnchor="middle"
        fontSize="24"
        className="fill-foreground font-medium"
      >
        {shown.rows || shown.values ? payloadSymbol(shown) : nodeResult(shown)}
      </text>
    </g>
  );
}

function EdgeView({
  edge,
  active,
  done,
  marker,
}: {
  edge: RouteEdge;
  active: boolean;
  done: boolean;
  marker: string;
}) {
  return (
    <path
      data-route-edge={edge.id}
      data-edge-kind={edge.kind}
      data-center-path={edge.path}
      d={visiblePath(edge)}
      fill="none"
      strokeWidth={active ? "5" : "2.5"}
      strokeDasharray={edge.kind === "residual" ? "8 6" : undefined}
      className={
        edge.kind === "residual"
          ? "stroke-chart-2"
          : active || done
            ? "stroke-primary"
            : "stroke-muted-foreground/50"
      }
      markerEnd={`url(#${marker})`}
    >
      <title>
        {edge.label ??
          `${routeNodeById(edge.from).label} → ${routeNodeById(edge.to).label}`}
      </title>
    </path>
  );
}

const Edge = memo(EdgeView);

function ResidualPacket({
  edge,
  payload,
  moment,
  start,
  arrive,
  consumed,
}: {
  edge: RouteEdge;
  payload: GenerationPayload;
  moment: number;
  start: number;
  arrive: number;
  consumed: number;
}) {
  const visible = moment >= start && moment < consumed;
  const [targetX, targetY] = routeNodeById(edge.to).center;
  const port = edge.to === "attention-add" ? [74, 0] : [0, 37];
  const [portX = 0, portY = 0] = port;
  let length = 0;
  for (const [index, [x, y]] of edge.waypoints.slice(1).entries()) {
    const [previousX = x, previousY = y] = edge.waypoints[index] ?? [];
    length += Math.hypot(x - previousX, y - previousY);
  }
  const stop = 1 - Math.hypot(portX, portY) / length;
  let point = pointOnRouteEdge(
    edge,
    clamp((moment - start) / (arrive - start)) * stop
  );
  if (moment >= arrive) {
    const local = clamp((moment - arrive) / (consumed - arrive));
    const enter = clamp(local / 0.25);
    const leave = clamp((1 - local) / 0.25);
    point = {
      x: targetX + (portX + (40 - portX) * enter) * leave,
      y: targetY + portY * (1 - enter),
    };
  }
  return (
    <g
      transform={`translate(${svgNumber(point.x)} ${svgNumber(point.y)})`}
      opacity={visible ? "1" : "0"}
      data-residual-packet={payload.key}
      data-residual-visible={visible ? "true" : "false"}
      aria-hidden="true"
    >
      <rect
        x="-27"
        y="-16"
        width="54"
        height="32"
        rx="10"
        strokeDasharray="5 3"
        strokeWidth="3"
        className="fill-background stroke-chart-2"
      />
      <text
        y="8"
        textAnchor="middle"
        fontSize="24"
        className="fill-foreground font-semibold"
      >
        {payloadSymbol(payload)}
      </text>
    </g>
  );
}

function computation(
  node: RouteNodeId,
  trace: GenerationTrace,
  selection: GenerationSelection
): string {
  const position = trace.ids.length - 1;
  const first = (rows: readonly (readonly number[])[]) =>
    decimal(rows[position]?.[0]);
  switch (node) {
    case "input": {
      return trace.ids
        .map((id) => `「${FLOW_VOCABULARY[id]?.piece}」→ ${id}`)
        .join("、");
    }
    case "embedding": {
      return `末尾の第1成分：${first(trace.e)} + ${first(trace.p)} = ${first(trace.input)}。同じ行列H⁰をAttentionと残差の2経路へ渡す。`;
    }
    case "attention": {
      const [head] = trace.heads;
      const terms = trace.ids.map(
        (_id, source) =>
          `${decimal(head?.weights[position]?.[source])} × ${decimal(head?.values[source]?.[0])}`
      );
      return `Head 1・末尾の第1成分：${terms.join(" + ")} = ${decimal(head?.outputs[position]?.[0])}。2ヘッドを連結してWₒを掛け、Aを得る。`;
    }
    case "attention-add": {
      return `末尾の第1成分：H⁰ ${first(trace.input)} + A ${first(trace.attention)} = U ${first(trace.afterAttention)}。迂回したH⁰をここで加える。`;
    }
    case "mlp": {
      return `LN₂の後、4 → 16成分へ変換。中間の第1成分 ${first(trace.mlpPre)} → GELU → ${first(trace.mlpActivated)}。16 → 4成分へ戻し、Mを得る。`;
    }
    case "mlp-add": {
      return `末尾の第1成分：U ${first(trace.afterAttention)} + M ${first(trace.mlpOutput)} = H′ ${first(trace.afterMlp)}。迂回したUをここで加える。`;
    }
    case "final-norm": {
      return `H′の各行をLayerNormで正規化し、次の予測に使う末尾の4成分だけを取り出す。h = [${trace.lastHidden.map((value) => decimal(value)).join(", ")}]。`;
    }
    case "output": {
      return `hと埋め込み表の各行の内積を求める。ID ${selection.id}の行との内積は z[${selection.id}] = ${decimal(trace.logits[selection.id])}。8個のIDに対応する8スコアを得る。`;
    }
    case "probabilities": {
      return `π[${selection.id}] = exp(z[${selection.id}]/T) ÷ Σᵢ exp(z[i]/T) = ${((trace.probabilities[selection.id] ?? 0) * 100).toFixed(1)}%。T = ${trace.temperature}、8個の確率の合計は100%。`;
    }
    case "selection": {
      return `0〜1を各確率の幅で区切る。r = 0.62 は [${decimal(selection.intervalStart)}, ${decimal(selection.intervalEnd)}) に入るため、整数ID ${selection.id}を選ぶ。`;
    }
    case "decode": {
      return `語彙表[${selection.id}] →「${selection.piece}」。文字片を表示し、選んだ整数ID ${selection.id}も保持する。`;
    }
    case "return": {
      return `[${trace.ids.join(", ")}] に整数ID ${selection.id}を追加 → [${[...trace.ids, selection.id].join(", ")}]。文字列を再びトークン化する処理ではない。`;
    }
    default: {
      throw new Error(`未定義の計算段階: ${String(node)}`);
    }
  }
}

function PayloadReadout({ payload }: { payload: GenerationPayload }) {
  return (
    <div className="min-w-0 space-y-1" data-payload-readout={payload.key}>
      <p className="font-medium">
        {payload.label}{" "}
        <span className="text-xs text-muted-foreground">{payload.shape}</span>
      </p>
      <p className="font-mono text-xs break-words text-muted-foreground">
        {payload.summary}
      </p>
    </div>
  );
}

function ConnectionReadoutView({
  edge,
  activeId,
  payloads,
  trace,
  selection,
  completed,
}: {
  edge: RouteEdge | undefined;
  activeId: RouteNodeId;
  payloads: NodePayloads;
  trace: GenerationTrace;
  selection: GenerationSelection;
  completed: boolean;
}) {
  const pair = payloads[activeId];
  const passing = edge ? payloads[edge.from].output : undefined;
  const outputVisible = payloads.decode.output;
  return (
    <div
      className="space-y-3 border-t bg-muted/20 p-4 text-sm"
      data-connection-readout
    >
      <p className="font-semibold" data-connection-title>
        {edge
          ? `${routeNodeById(edge.from).label}の出力 → ${routeNodeById(edge.to).label}の入力`
          : `${routeNodeById(activeId).label}で計算中`}
      </p>
      {passing ? (
        <div
          className="rounded-md border bg-background p-3"
          data-transfer-key={passing.key}
        >
          <PayloadReadout payload={passing} />
          <p className="mt-2 text-xs">
            {edge?.kind === "loop"
              ? "このID列が次の予測の入力になる。"
              : "矢印上を移動している値を、そのまま次の入力へ渡す。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 rounded-md border bg-background p-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">入力</p>
            <PayloadReadout payload={pair.input} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">計算で得る出力</p>
            <PayloadReadout payload={pair.output} />
          </div>
        </div>
      )}
      <p className="leading-relaxed" data-current-computation>
        {computation(activeId, trace, selection)}
      </p>
      {(activeId === "decode" || activeId === "return") && (
        <p data-decoded-output>
          表示する文字列：
          <strong>
            {decodeFlow(trace.ids)}
            {outputVisible.piece}
          </strong>{" "}
          ／ 次の入力に追加する値：ID {selection.id}
        </p>
      )}
      {completed && (
        <p className="text-xs text-muted-foreground" data-next-input-ready>
          次の入力が整った。図に残した中間値は今回の一巡分であり、長くなった入力での再計算はまだ行っていない。
        </p>
      )}
    </div>
  );
}

const ConnectionReadout = memo(ConnectionReadoutView);

export function GenerationOverview({
  trace,
  selection,
  stage,
  progress,
  viewportRef,
}: StoryProps) {
  const titleId = useId();
  const descriptionId = useId();
  const markerId = useId();
  const residualMarkerId = useId();
  const payloads = useMemo(
    () => generationPayloads(trace, selection),
    [trace, selection]
  );
  const frame = routeFrame(stage, progress);
  const edge = ROUTE_EDGES.find(
    (candidate) => candidate.id === frame.activeEdgeId
  );
  const packet = edge
    ? payloads[edge.from].output
    : payloads[frame.activeNodeId].input;
  const phaseIndex = STORY_PHASES.findIndex((phase) => phase.stage === stage);
  const moment = phaseIndex + progress;
  const completed = stage === "return" && progress >= 1;
  const merging = !edge && (stage === "attention-add" || stage === "mlp-add");
  const offset = merging ? mergeOffset(progress) : 0;
  const residualEdges = ROUTE_EDGES.filter(
    (candidate) => candidate.kind === "residual"
  );

  return (
    <div ref={viewportRef} className="llm-generation-map">
      <svg
        viewBox="-24 -24 848 600"
        preserveAspectRatio="xMidYMin meet"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="block h-auto w-full"
        data-story-stage={stage}
        data-active-node={frame.activeNodeId}
      >
        <title id={titleId}>
          入力から次の入力まで、接続を固定したLLMの計算図
        </title>
        <desc id={descriptionId}>
          12個の処理とすべての矢印を同じ場所に表示し続ける。実線を進むデータが各処理の出力から次の入力になる。破線では元の値を保持し、2か所の残差加算で合流する。最後は選んだIDを追加した列が入力へ戻る。計算結果は元の場所に残る。
        </desc>
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" className="fill-primary" />
          </marker>
          <marker
            id={residualMarkerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" className="fill-chart-2" />
          </marker>
        </defs>
        {ROUTE_EDGES.map((candidate) => (
          <Edge
            key={candidate.id}
            edge={candidate}
            active={candidate.id === frame.activeEdgeId}
            done={
              frame.settledIds.includes(candidate.from) &&
              frame.settledIds.includes(candidate.to)
            }
            marker={candidate.kind === "residual" ? residualMarkerId : markerId}
          />
        ))}
        <text
          x="595"
          y="-1"
          textAnchor="middle"
          fontSize="20"
          className="fill-chart-2"
        >
          H⁰を保持
        </text>
        <text
          x="400"
          y="286"
          textAnchor="middle"
          fontSize="20"
          paintOrder="stroke"
          strokeWidth="8"
          className="fill-chart-2 stroke-background"
        >
          Uを保持 → 残差加算②
        </text>
        {ROUTE_NODES.map((node) => (
          <OperationCard
            key={node.id}
            node={node}
            payload={payloads[node.id].output}
            settled={frame.settledIds.includes(node.id)}
            active={node.id === frame.activeNodeId && !edge}
            receiving={node.id === edge?.to}
            nextInput={
              completed && node.id === "input"
                ? payloads.return.output
                : undefined
            }
          />
        ))}
        {residualEdges.map((candidate, index) => (
          <ResidualPacket
            key={candidate.id}
            edge={candidate}
            payload={payloads[candidate.from].output}
            moment={moment}
            start={index === 0 ? 1.55 : 3.55}
            arrive={index === 0 ? 3 : 5}
            consumed={index === 0 ? 3.55 : 5.55}
          />
        ))}
        <g
          transform={`translate(${svgNumber(frame.packet.x)} ${svgNumber(frame.packet.y)})`}
          data-packet="primary"
          data-packet-key={packet.key}
          data-packet-edge={edge?.id}
          opacity={
            stage === "return" ? svgNumber(clamp((1 - progress) / 0.08)) : "1"
          }
          aria-hidden="true"
        >
          <g transform={`translate(${svgNumber(-offset)} 0)`}>
            <rect
              x="-33"
              y="-17"
              width="66"
              height="34"
              rx="12"
              strokeWidth="3"
              className="fill-primary stroke-background"
            />
            <text
              y="8"
              textAnchor="middle"
              fontSize="24"
              className="fill-primary-foreground font-semibold"
            >
              {payloadSymbol(packet)}
            </text>
          </g>
          <text
            y="8"
            textAnchor="middle"
            fontSize="24"
            opacity={svgNumber(clamp((offset - 25) / 15))}
            className="fill-foreground font-semibold"
            data-residual-sum
          >
            ＋
          </text>
        </g>
        <text
          x="400"
          y="568"
          textAnchor="middle"
          fontSize="22"
          className="fill-muted-foreground"
        >
          選んだ整数IDを追加し、左の戻り線から次の入力へ
        </text>
      </svg>
    </div>
  );
}

/** 記事で使っていた全体図と数値の縦配置。単体表示の互換性を保つ。 */
export function GenerationStory(props: StoryProps) {
  const { trace, selection, stage, progress } = props;
  const payloads = useMemo(
    () => generationPayloads(trace, selection),
    [trace, selection]
  );
  const frame = routeFrame(stage, progress);
  const edge = ROUTE_EDGES.find(
    (candidate) => candidate.id === frame.activeEdgeId
  );
  return (
    <div>
      <GenerationOverview {...props} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
        <span>実線：前段の出力を次段へ</span>
        <span>破線：元の値を保つ残差接続</span>
        <span>立体セル：実際の成分の符号・大きさ</span>
      </div>
      <ConnectionReadout
        edge={edge}
        activeId={frame.activeNodeId}
        payloads={payloads}
        trace={trace}
        selection={selection}
        completed={stage === "return" && progress >= 1}
      />
      <GenerationDistribution
        trace={trace}
        selection={selection}
        stage={stage}
        progress={progress}
      />
    </div>
  );
}
