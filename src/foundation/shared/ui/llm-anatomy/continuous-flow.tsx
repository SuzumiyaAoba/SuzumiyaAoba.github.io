"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVGワールド全体に説明を付け、計算器ごとの構造を保つ。 */

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { CinemaOperationContent } from "./cinema-operation";
import {
  cinemaClamp,
  cinemaNumber,
  cinemaOutputCell,
} from "./cinema-operation-math";
import { CinemaLabel } from "./cinema-operation-primitives";
import {
  continuousCalculationProgress,
  continuousCamera,
  continuousConnectionPath,
  continuousInputOffset,
  continuousLayout,
  continuousNodePosition,
  continuousPacketPoint,
} from "./continuous-flow-layout";
import type { FlowLayout, FlowPoint } from "./continuous-flow-layout";
import {
  continuousTransferProgress,
  createContinuousFlow,
} from "./continuous-flow-model";
import type {
  ContinuousConnection,
  ContinuousFlow as FlowModel,
  ContinuousOperation,
  ContinuousSupportOperation,
} from "./continuous-flow-model";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import { svgNumber } from "./svg-number";

type FlowProps = {
  trace: GenerationTrace;
  selection: GenerationSelection;
  elapsed: number;
};

const SHORT_LABELS: Record<string, string> = {
  tokenize: "入力 → 整数ID列",
  "embedding-lookup": "ID → 埋め込み表の行",
  "embedding-add": "埋め込み ＋ 位置 → H⁰",
  ln1: "LN₁：全位置を正規化",
  "qkv-query": "Head 1：Q",
  "qkv-key": "Head 1：K",
  "qkv-value": "Head 1：V",
  "score-mask-score": "Head 1：QKᵀ / √2",
  "score-mask-mask": "Head 1：mask → softmax",
  "weighted-head-1": "Head 1：α₁V₁",
  "weighted-head-2": "Head 2：α₂V₂",
  "attention-output": "2ヘッド連結 → Wₒ → A",
  residual1: "H⁰ ＋ A → U",
  ln2: "LN₂：全位置を正規化",
  expand: "W₁x ＋ b₁：4 → 16",
  gelu: "GELU：16 → 16",
  contract: "W₂g ＋ b₂：16 → 4",
  residual2: "U ＋ M → H′",
  finalnorm: "最終LN → 末尾の h",
  logits: "h → 8語彙のスコア",
  softmax: "スコア → 確率",
  select: "確率 → 整数ID",
  decode: "整数ID → 表示文字片",
  return: "同じ整数ID → 入力列へ追加",
};

function path(points: readonly FlowPoint[]): string {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${svgNumber(x)} ${svgNumber(y)}`
    )
    .join(" ");
}

function outputAnchor(
  operation: ContinuousOperation,
  layout: FlowLayout
): FlowPoint {
  if (operation.id === "tokenize") {
    return layout.mobile ? [570, 520] : [1125, 475];
  }
  if (operation.id === "select") {
    return layout.mobile ? [410, 748] : [1340, 573];
  }
  if (operation.id === "softmax") {
    return layout.mobile ? [560, 630] : [1020, 582];
  }
  if (operation.id === "decode") {
    return layout.mobile ? [570, 265] : [1365, 175];
  }
  if (operation.id === "return") {
    return layout.mobile ? [570, 675] : [1365, 535];
  }
  const cell = cinemaOutputCell(
    operation.computation.output.values.length,
    operation.computation.activeComponent,
    layout.mobile,
    layout.mobile &&
      (operation.id === "residual1" || operation.id === "residual2")
      ? 770
      : undefined
  );
  return [cell.x + cell.width / 2 + 5, cell.y];
}

function FlowNodeView({
  operation,
  layout,
  progress,
  current,
  trace,
  selection,
  marker,
}: {
  operation: ContinuousOperation;
  layout: FlowLayout;
  progress: number;
  current: boolean;
  trace: GenerationTrace;
  selection: GenerationSelection;
  marker: string;
}) {
  const position = continuousNodePosition(operation.id, layout);
  const frame = useMemo(
    () => ({
      ...operation.frame,
      operationProgress: progress,
      termProgress: cinemaClamp(progress / 0.8),
      ...(operation.id === "return" ? { progress } : {}),
    }),
    [operation, progress]
  );
  const anchor = outputAnchor(operation, layout);
  return (
    <g
      transform={`translate(${position.x} ${position.y})`}
      opacity={svgNumber(0.45 + 0.55 * cinemaClamp(progress / 0.1))}
      data-flow-node={operation.id}
      data-flow-calculation={svgNumber(progress)}
      data-current={current ? "true" : "false"}
    >
      <rect
        x="-10"
        y="-110"
        width={layout.width + 20}
        height={layout.height + 130}
        rx="26"
        strokeWidth={current ? "4" : "2"}
        className={
          current
            ? "fill-background stroke-primary"
            : "fill-background stroke-border"
        }
      />
      <CinemaLabel
        x={layout.width / 2}
        y={-55}
        size={layout.mobile ? 32 : 40}
        active={current}
      >
        {SHORT_LABELS[operation.id]}
      </CinemaLabel>
      <CinemaLabel x={layout.width / 2} y={-15} size={layout.mobile ? 22 : 24}>
        {operation.id.startsWith("qkv-") || operation.id.startsWith("score-")
          ? "Head 1の実計算・Head 2は別の枝"
          : "代表成分の計算を拡大・全成分も表示"}
      </CinemaLabel>
      {operation.id !== "decode" && (
        <path
          d={`M${svgNumber(anchor[0])} ${svgNumber(anchor[1])} H${layout.width - 12} V${layout.height / 2} H${layout.width}`}
          fill="none"
          strokeWidth="2"
          className="stroke-primary/50"
        />
      )}
      <CinemaOperationContent
        trace={trace}
        selection={selection}
        frame={frame}
        computation={operation.computation}
        mobile={layout.mobile}
        marker={marker}
      />
      <circle
        cx={layout.width}
        cy={layout.height / 2}
        r="7"
        className="fill-primary"
      />
    </g>
  );
}
const FlowNode = memo(FlowNodeView);

function SupportNodeView({
  support,
  layout,
}: {
  support: ContinuousSupportOperation;
  layout: FlowLayout;
}) {
  const position = continuousNodePosition(support.id, layout);
  const rows = [
    support.queries.at(-1) ?? [],
    support.keys[1] ?? [],
    support.values[1] ?? [],
    support.weights.at(-1) ?? [],
  ];
  const labels = [
    "Q₂：末尾位置",
    "K₂：参照元2",
    "V₂：参照元2",
    "α₂：末尾 → 全参照元",
  ];
  return (
    <g
      transform={`translate(${position.x} ${position.y})`}
      data-flow-node={support.id}
    >
      <rect
        x="-10"
        y="-110"
        width={layout.width + 20}
        height={layout.height + 130}
        rx="26"
        strokeWidth="2"
        className="fill-background stroke-chart-2"
      />
      <CinemaLabel
        x={layout.width / 2}
        y={-45}
        size={layout.mobile ? 32 : 40}
        active
      >
        Head 2：別の重みで並列計算
      </CinemaLabel>
      <CinemaLabel x={layout.width / 2} y={60} size={layout.mobile ? 24 : 32}>
        Q₂・K₂・V₂ → score → mask → α₂
      </CinemaLabel>
      {rows.map((values, index) => (
        <g key={labels[index]}>
          <CinemaLabel
            x={layout.width / 2}
            y={150 + index * (layout.mobile ? 160 : 120)}
            size={28}
          >
            {labels[index]}
          </CinemaLabel>
          <CinemaLabel
            x={layout.width / 2}
            y={200 + index * (layout.mobile ? 160 : 120)}
            size={layout.mobile ? 32 : 44}
            active
          >
            [{values.map(cinemaNumber).join(", ")}]
          </CinemaLabel>
        </g>
      ))}
      <CinemaLabel x={layout.width / 2} y={layout.height - 15} size={24}>
        Head 1のαやVを流用せず、全位置を計算
      </CinemaLabel>
    </g>
  );
}
const SupportNode = memo(SupportNodeView);

function PayloadValues({
  values,
  x,
  y,
  columns,
  size,
  gapX,
  gapY,
  pending = false,
}: {
  values: readonly number[];
  x: number;
  y: number;
  columns: number;
  size: number;
  gapX: number;
  gapY: number;
  pending?: boolean;
}) {
  return (
    <g>
      {values.map((value, index) => (
        <CinemaLabel
          key={index}
          x={x + (index % columns) * gapX}
          y={y + Math.floor(index / columns) * gapY}
          size={size}
        >
          {pending ? "…" : cinemaNumber(value)}
        </CinemaLabel>
      ))}
    </g>
  );
}

function FlowEdgeView({
  connection,
  flow,
  layout,
  progress,
  marker,
  packets = false,
  detailed = false,
}: {
  connection: ContinuousConnection;
  flow: FlowModel;
  layout: FlowLayout;
  progress: number;
  marker: string;
  packets?: boolean;
  detailed?: boolean;
}) {
  const offset = continuousInputOffset(flow, connection, layout);
  const points = useMemo(
    () => continuousConnectionPath(connection, layout, offset),
    [connection, layout, offset]
  );
  const target = continuousNodePosition(connection.to, layout);
  const secondary = connection.kind !== "data";
  const { values } = connection.payload.representative;
  const columns = layout.mobile ? 2 : 4;
  const rows = Math.ceil(values.length / columns);
  const width = layout.mobile ? 180 : 300;
  const boxX = target.x - width - 50;
  const boxY = target.y + layout.height / 2 + offset;
  const boxHeight = 88 + rows * 32;
  const boxTop = boxY - boxHeight / 2;
  const packet = continuousPacketPoint(connection, layout, progress, offset);
  const isFeedback = connection.kind === "feedback";
  const packetWidth = layout.mobile ? 360 : 520;
  const packetColumns = Math.min(values.length, layout.mobile ? 2 : 4);
  const packetRows = Math.ceil(values.length / packetColumns);
  const packetHeight = 110 + packetRows * 43;
  const alpha = Math.min(1, progress / 0.08, (1 - progress) / 0.08);
  return (
    <g
      data-flow-connection={packets ? undefined : connection.id}
      data-flow-from={connection.from}
      data-flow-to={connection.to}
      data-transfer={svgNumber(progress)}
    >
      {!packets && (
        <path
          d={path(points)}
          fill="none"
          strokeWidth={secondary ? "4" : "3"}
          strokeDasharray={secondary ? "12 8" : undefined}
          className={secondary ? "stroke-chart-2/70" : "stroke-primary/40"}
          markerEnd={`url(#${marker})`}
        />
      )}
      {!packets && !isFeedback && (
        <g data-flow-input={connection.id}>
          <rect
            x={boxX}
            y={boxTop}
            width={width}
            height={boxHeight}
            rx="14"
            strokeWidth="2"
            className={
              secondary
                ? "fill-background stroke-chart-2"
                : "fill-background stroke-border"
            }
          />
          <CinemaLabel
            x={boxX + width / 2}
            y={boxTop + 28}
            size={layout.mobile ? 20 : 22}
          >
            {connection.payload.label.length > (layout.mobile ? 10 : 18)
              ? connection.payload.label.slice(0, layout.mobile ? 10 : 18)
              : connection.payload.label}
          </CinemaLabel>
          <CinemaLabel
            x={boxX + width / 2}
            y={boxTop + 56}
            size={layout.mobile ? 18 : 20}
          >
            {connection.payload.representative.position === undefined
              ? `形状 ${connection.payload.shape.join("×")}`
              : `位置${connection.payload.representative.position + 1} ／ 全${connection.payload.shape[0]}位置`}
          </CinemaLabel>
          <PayloadValues
            values={values}
            x={boxX + width / (columns * 2)}
            y={boxTop + 88}
            columns={columns}
            size={layout.mobile ? 22 : 24}
            gapX={width / columns}
            gapY={32}
            pending={progress < 1}
          />
          <path
            d={`M${boxX + width} ${boxY} H${target.x}`}
            fill="none"
            strokeWidth="2"
            className="stroke-primary/40"
          />
        </g>
      )}
      {packets && progress > 0 && progress < 1 && (
        <g
          transform={`translate(${svgNumber(packet.x)} ${svgNumber(packet.y)})`}
          opacity={svgNumber(alpha)}
          data-flow-packet={connection.id}
        >
          {detailed ? (
            <>
              <rect
                x={-packetWidth / 2}
                y={-packetHeight / 2}
                width={packetWidth}
                height={packetHeight}
                rx="20"
                strokeWidth="4"
                className={
                  secondary
                    ? "fill-background stroke-chart-2"
                    : "fill-background stroke-primary"
                }
              />
              <CinemaLabel
                x={0}
                y={-packetHeight / 2 + 38}
                size={layout.mobile ? 24 : 28}
                active
              >
                {isFeedback ? "次回のID列" : connection.payload.label}
              </CinemaLabel>
              <CinemaLabel x={0} y={-packetHeight / 2 + 72} size={24}>
                {connection.payload.representative.label} ／{" "}
                {connection.payload.shape.join("×")}
              </CinemaLabel>
              <PayloadValues
                values={values}
                x={
                  (-(packetColumns - 1) * (packetWidth / (packetColumns + 1))) /
                  2
                }
                y={-packetHeight / 2 + 115}
                columns={packetColumns}
                size={layout.mobile ? 28 : 30}
                gapX={packetWidth / (packetColumns + 1)}
                gapY={43}
              />
            </>
          ) : (
            <circle
              r={layout.mobile ? 12 : 10}
              strokeWidth="3"
              className={
                secondary
                  ? "fill-chart-2 stroke-background"
                  : "fill-primary stroke-background"
              }
            />
          )}
        </g>
      )}
    </g>
  );
}
const FlowEdge = memo(FlowEdgeView);

/** 計算器を消さずに配置し続け、同一の回路上をカメラと実データが移動する。 */
export function ContinuousFlow({ trace, selection, elapsed }: FlowProps) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1440, height: 600 });
  const id = useId();
  useEffect(() => {
    const element = host.current;
    if (!element || typeof ResizeObserver !== "function") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (
        entry &&
        entry.contentRect.width > 0 &&
        entry.contentRect.height > 0
      ) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const flow = useMemo(
    () => createContinuousFlow(trace, selection),
    [trace, selection]
  );
  const layout = useMemo(
    () => continuousLayout(size.width < 896),
    [size.width]
  );
  const camera = continuousCamera(
    flow,
    elapsed,
    layout,
    size.width / size.height
  );
  const marker = `${id}-wire`;
  const transferTarget = flow.operations.find((operation, index) => {
    const previous = flow.operations[index - 1];
    return (
      previous &&
      elapsed >= previous.start + previous.duration * 0.72 &&
      elapsed <= operation.start + operation.duration * 0.12
    );
  });
  const detailedConnection = flow.connections.find(
    (connection) => connection.enabled && connection.to === transferTarget?.id
  );
  return (
    <div
      ref={host}
      className="h-full min-h-0 w-full overflow-hidden"
      data-flow-world
      data-cinema-canvas
    >
      <svg
        className="h-full w-full"
        viewBox={[camera.x, camera.y, camera.width, camera.height]
          .map(svgNumber)
          .join(" ")}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
        data-flow-camera
        data-camera-x={svgNumber(camera.x)}
        data-camera-y={svgNumber(camera.y)}
        data-camera-height={svgNumber(camera.height)}
      >
        <title id={`${id}-title`}>同じ回路を通るLLMの連続した計算</title>
        <desc id={`${id}-desc`}>
          全計算器と配線は同じ場所に残る。計算結果の数値が次の計算器へ届いてから演算が始まり、カメラがその流れを連続して追う。Q・K・Vとヘッドは分岐し、元の表現は残差経路で保持する。
        </desc>
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="14"
            markerHeight="14"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 Z" className="fill-primary" />
          </marker>
        </defs>
        {flow.connections
          .filter((connection) => connection.enabled)
          .map((connection) => (
            <FlowEdge
              key={connection.id}
              connection={connection}
              flow={flow}
              layout={layout}
              progress={continuousTransferProgress(flow, connection, elapsed)}
              marker={marker}
            />
          ))}
        <SupportNode support={flow.support} layout={layout} />
        {flow.operations.map((operation) => (
          <FlowNode
            key={operation.id}
            operation={operation}
            layout={layout}
            progress={continuousCalculationProgress(operation, elapsed)}
            current={elapsed >= operation.start && elapsed < operation.end}
            trace={trace}
            selection={selection}
            marker={marker}
          />
        ))}
        {flow.connections
          .filter((connection) => connection.enabled)
          .map((connection) => (
            <FlowEdge
              key={connection.id}
              connection={connection}
              flow={flow}
              layout={layout}
              progress={continuousTransferProgress(flow, connection, elapsed)}
              marker={marker}
              packets
              detailed={connection.id === detailedConnection?.id}
            />
          ))}
      </svg>
    </div>
  );
}
