"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- データに連動するSVGを、説明付きの図として読み上げる。 */

import { useId } from "react";
import { decodeFlow, FLOW_VOCABULARY } from "./generation-math";
import type {
  FlowMatrix,
  GenerationSelection,
  GenerationTrace,
} from "./generation-math";
import type { GenerationStage } from "./generation-stages";
import { prismFaces, projectPoint } from "./structure-model";
import type { Point3, StructureNode } from "./structure-model";
import { svgNumber } from "./svg-number";

type DiagramProps = {
  trace: GenerationTrace;
  stage: GenerationStage;
  position: number;
  headIndex: number;
  selection: GenerationSelection;
  draw: number;
  playing: boolean;
};

const PITCH = 32;
const YAW = -18;

function lane(position: number, count: number): number {
  return (
    (position - (count - 1) / 2) * Math.min(155, 580 / Math.max(1, count - 1))
  );
}

function screen(point: Point3) {
  const projected = projectPoint(point, YAW, PITCH);
  return { x: projected.x + 100, y: projected.y - 115 };
}

function pathThrough(points: readonly Point3[]): string {
  return points
    .map((point, index) => {
      const projected = screen(point);
      return `${index === 0 ? "M" : "L"} ${svgNumber(projected.x)} ${svgNumber(projected.y)}`;
    })
    .join(" ");
}

function DataArrow({
  path,
  marker,
  playing,
  secondary = false,
  weight = 1,
  payload,
}: {
  path: string;
  marker: string;
  playing: boolean;
  secondary?: boolean;
  weight?: number;
  payload?: string;
}) {
  return (
    <g>
      <path
        d={path}
        fill="none"
        strokeWidth={svgNumber(1.5 + weight * 2.5)}
        className={secondary ? "stroke-chart-2" : "stroke-primary"}
        strokeDasharray={secondary ? "5 4" : undefined}
        markerEnd={`url(#${marker})`}
      />
      {playing && (
        <g className="motion-reduce:hidden">
          <circle r="4" className="fill-primary" />
          {payload && (
            <text x="8" y="-7" className="fill-foreground text-xs font-medium">
              {payload}
            </text>
          )}
          <animateMotion dur="1.6s" repeatCount="indefinite" path={path} />
        </g>
      )}
    </g>
  );
}

function TensorValues({
  rows,
  y,
  position,
  count,
  onlySelected = false,
}: {
  rows: FlowMatrix;
  y: number;
  position: number;
  count: number;
  onlySelected?: boolean;
}) {
  const width = Math.min(94, (580 / Math.max(count, 4)) * 0.65);
  const cells = rows
    .flatMap((row, rowIndex) => {
      if (onlySelected && rowIndex !== position) {
        return [];
      }
      return row.map((value, component) => {
        const node: StructureNode = {
          id: `${rowIndex}-${component}`,
          label: "",
          shape: "",
          description: "",
          part: "B",
          kind: "tensor",
          center: [
            lane(rowIndex, count),
            y,
            (component - (row.length - 1) / 2) * 24,
          ],
          size: [width, 8, 22],
        };
        return { value, node, rowIndex, component, components: row.length };
      });
    })
    .toSorted(
      (left, right) =>
        projectPoint(left.node.center, YAW, PITCH).depth -
        projectPoint(right.node.center, YAW, PITCH).depth
    );
  return (
    <g>
      {cells.map(({ value, node, rowIndex, component, components }) => {
        const center = screen(node.center);
        return (
          <g key={node.id} data-flow-cell={`${rowIndex}-${component}`}>
            <g transform="translate(100 -115)">
              {prismFaces(node, YAW, PITCH).map((face) => (
                <polygon
                  key={face.key}
                  points={face.points}
                  className={
                    value < 0
                      ? "fill-chart-2 stroke-muted-foreground"
                      : "fill-primary stroke-muted-foreground"
                  }
                  fillOpacity={svgNumber(
                    0.06 + Math.min(Math.abs(value) / 3, 1) * 0.28
                  )}
                  strokeWidth={rowIndex === position ? "1.5" : "0.6"}
                />
              ))}
            </g>
            {(components <= 4 || component % 4 === 0) && (
              <text
                x={svgNumber(center.x)}
                y={svgNumber(center.y + 2)}
                textAnchor="middle"
                className={
                  rowIndex === position
                    ? "fill-foreground text-xs font-medium"
                    : "fill-muted-foreground text-xs"
                }
              >
                {value.toFixed(2)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function vectorText(values: readonly number[]): string {
  return `[${values.map((value) => value.toFixed(2)).join(", ")}]`;
}

function TokenLabels({
  trace,
  position,
}: {
  trace: GenerationTrace;
  position: number;
}) {
  return (
    <g>
      {trace.ids.map((tokenId, index) => {
        const point = screen([lane(index, trace.ids.length), -235, 0]);
        return (
          <g key={`label-${index + 1}`}>
            <text
              x={svgNumber(point.x)}
              y="38"
              textAnchor="middle"
              className="fill-foreground text-sm font-medium"
            >
              {FLOW_VOCABULARY[tokenId]?.piece}
            </text>
            <text
              x={svgNumber(point.x)}
              y="58"
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              位置{index + 1} · ID {tokenId}
              {index === position ? " ◀" : ""}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function OperandScene({
  trace,
  stage,
  position,
  marker,
  playing,
}: DiagramProps & { marker: string }) {
  let first = trace.e;
  let second = trace.p;
  let result = trace.input;
  let labels = ["埋め込み e(x)", "位置ベクトル p", "加算結果 h⁰"];
  if (stage === "attention-add") {
    first = trace.input;
    second = trace.attention;
    result = trace.afterAttention;
    labels = ["元の表現 h⁰", "Attentionの出力", "残差加算 u"];
  }
  if (stage === "mlp-add") {
    first = trace.afterAttention;
    second = trace.mlpOutput;
    result = trace.afterMlp;
    labels = ["元の表現 u", "MLPの出力 m", "残差加算 h′"];
  }
  const x = lane(position, trace.ids.length);
  const sum = screen([x, 105, 0]);
  return (
    <g>
      <TensorValues
        rows={first}
        y={-165}
        position={position}
        count={trace.ids.length}
      />
      <TensorValues
        rows={second}
        y={-10}
        position={position}
        count={trace.ids.length}
      />
      <TensorValues
        rows={result}
        y={195}
        position={position}
        count={trace.ids.length}
      />
      <DataArrow
        marker={marker}
        playing={playing}
        secondary
        payload={vectorText(first[position] ?? [])}
        path={pathThrough([
          [x - 40, -165, 0],
          [x - 80, -165, 0],
          [x - 80, 105, 0],
          [x - 20, 105, 0],
        ])}
      />
      <DataArrow
        marker={marker}
        playing={playing}
        path={pathThrough([
          [x, 30, 0],
          [x, 82, 0],
        ])}
      />
      <DataArrow
        marker={marker}
        playing={playing}
        path={pathThrough([
          [x, 128, 0],
          [x, 160, 0],
        ])}
      />
      <circle
        cx={svgNumber(sum.x)}
        cy={svgNumber(sum.y)}
        r="15"
        className="fill-background stroke-primary"
      />
      <text
        x={svgNumber(sum.x)}
        y={svgNumber(sum.y + 5)}
        textAnchor="middle"
        className="fill-foreground text-base"
      >
        ＋
      </text>
      {labels.map((label, index) => (
        <text
          key={label}
          x="18"
          y={[80, 205, 535][index]}
          className="fill-foreground text-xs font-medium"
        >
          {label}
        </text>
      ))}
    </g>
  );
}

function AttentionScene({
  trace,
  position,
  headIndex,
  marker,
  playing,
}: DiagramProps & { marker: string }) {
  const head = trace.heads[headIndex];
  const weights = head?.weights[position] ?? [];
  const targetX = lane(position, trace.ids.length);
  return (
    <g>
      <TensorValues
        rows={head?.values ?? []}
        y={-165}
        position={position}
        count={trace.ids.length}
      />
      <TensorValues
        rows={trace.attention}
        y={195}
        position={position}
        count={trace.ids.length}
      />
      {weights.map((weight, source) => {
        const start = screen([lane(source, trace.ids.length), -112, 0]);
        const end = screen([targetX, 0, 0]);
        end.x += headIndex === 0 ? -60 : 60;
        return (
          <g key={`reference-${source + 1}`}>
            {weight > 0 && (
              <DataArrow
                marker={marker}
                playing={playing}
                weight={weight}
                payload={vectorText(
                  head?.contributions[position]?.[source] ?? []
                )}
                path={`M ${svgNumber(start.x)} ${svgNumber(start.y)} Q ${svgNumber(start.x)} ${svgNumber(end.y - 35)} ${svgNumber(end.x)} ${svgNumber(end.y)}`}
              />
            )}
            <text
              x={svgNumber(start.x)}
              y={svgNumber(start.y + 20)}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              {source > position ? "未来：0" : `α=${weight.toFixed(3)}`}
            </text>
          </g>
        );
      })}
      {trace.heads.map((item, index) => {
        const center = screen([targetX, 0, 0]);
        const x = center.x + (index === 0 ? -60 : 60);
        const end = screen([targetX, 155, 0]);
        return (
          <g key={`head-output-${index + 1}`}>
            <rect
              x={svgNumber(x - 54)}
              y={svgNumber(center.y + 8)}
              width="108"
              height="50"
              rx="4"
              className={
                index === headIndex
                  ? "fill-primary/15 stroke-primary"
                  : "fill-muted stroke-border"
              }
            />
            <text
              x={svgNumber(x)}
              y={svgNumber(center.y + 27)}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              Head {index + 1}
            </text>
            <text
              x={svgNumber(x)}
              y={svgNumber(center.y + 46)}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              [
              {(item.outputs[position] ?? [])
                .map((value) => value.toFixed(2))
                .join(", ")}
              ]
            </text>
            <DataArrow
              marker={marker}
              playing={playing}
              payload={vectorText(item.outputs[position] ?? [])}
              path={`M ${svgNumber(x)} ${svgNumber(center.y + 63)} L ${svgNumber(end.x)} ${svgNumber(end.y)}`}
            />
          </g>
        );
      })}
      <text x="18" y="80" className="fill-foreground text-xs font-medium">
        LN₁(h⁰) → Wᵥ：各Vの2成分
      </text>
      <text x="18" y="515" className="fill-foreground text-xs font-medium">
        Q・Kから求めたαでVを集約
      </text>
      <text x="18" y="535" className="fill-foreground text-xs font-medium">
        両ヘッドを連結 → Wₒ → Attention出力：4成分
      </text>
    </g>
  );
}

function MlpScene({
  trace,
  position,
  marker,
  playing,
}: DiagramProps & { marker: string }) {
  const x = lane(position, trace.ids.length);
  return (
    <g>
      <TensorValues
        rows={trace.ln2}
        y={-165}
        position={position}
        count={trace.ids.length}
      />
      <TensorValues
        rows={trace.mlpActivated}
        y={10}
        position={position}
        count={trace.ids.length}
        onlySelected
      />
      <TensorValues
        rows={trace.mlpOutput}
        y={195}
        position={position}
        count={trace.ids.length}
      />
      <DataArrow
        marker={marker}
        playing={playing}
        path={pathThrough([
          [x, -118, 0],
          [x, -40, -130],
        ])}
      />
      <DataArrow
        marker={marker}
        playing={playing}
        path={pathThrough([
          [x, 75, 100],
          [x, 155, 0],
        ])}
      />
      <text x="18" y="80" className="fill-foreground text-xs font-medium">
        LN₂(u)：4成分
      </text>
      <text x="18" y="515" className="fill-muted-foreground text-xs">
        中央：W₁ ＋ b₁ → GELU（位置{position + 1}の16成分を展開）
      </text>
      <text x="18" y="535" className="fill-foreground text-xs font-medium">
        下：W₂ ＋ b₂ → MLP出力：4成分
      </text>
    </g>
  );
}

function VocabularyScene({
  trace,
  stage,
  selection,
  draw,
  marker,
  playing,
}: DiagramProps & { marker: string }) {
  const showProbability = stage !== "output";
  const showSelection = stage === "selection" || stage === "decode";
  return (
    <g>
      <text x="30" y="45" className="fill-foreground text-sm font-medium">
        最後の位置の表現 → 語彙の候補
      </text>
      <text x="30" y="85" className="fill-muted-foreground text-xs">
        LNfinal(h′ₜ)
      </text>
      {trace.lastHidden.map((value, index) => (
        <g key={`last-${index + 1}`}>
          <rect
            x="30"
            y={110 + index * 38}
            width="100"
            height="32"
            rx="4"
            className="fill-primary/10 stroke-primary"
          />
          <text
            x="80"
            y={131 + index * 38}
            textAnchor="middle"
            className="fill-foreground text-sm"
          >
            {value.toFixed(3)}
          </text>
        </g>
      ))}
      <DataArrow
        marker={marker}
        playing={playing}
        payload={vectorText(trace.lastHidden)}
        path="M 135 180 H 210"
      />
      <text
        x="160"
        y="150"
        textAnchor="middle"
        className="fill-foreground text-xs"
      >
        E · h
      </text>
      <text x="225" y="85" className="fill-foreground text-xs">
        ID → トークン
      </text>
      <text x="415" y="85" className="fill-foreground text-xs">
        logit
      </text>
      {showProbability && (
        <text x="545" y="85" className="fill-foreground text-xs">
          softmax → 確率
        </text>
      )}
      {FLOW_VOCABULARY.map((entry, index) => {
        const y = 110 + index * 40;
        const chosen = showSelection && entry.id === selection.id;
        return (
          <g key={entry.id}>
            <rect
              x="215"
              y={y}
              width="550"
              height="34"
              rx="3"
              className={
                chosen
                  ? "fill-primary/15 stroke-primary"
                  : "fill-muted/40 stroke-border"
              }
            />
            <text x="230" y={y + 22} className="fill-foreground text-sm">
              {entry.id} → {entry.piece}
            </text>
            <text x="420" y={y + 22} className="fill-foreground text-sm">
              {(trace.logits[index] ?? 0).toFixed(3)}
            </text>
            {showProbability && (
              <g>
                <rect
                  x="540"
                  y={y + 11}
                  width={svgNumber((trace.probabilities[index] ?? 0) * 200)}
                  height="12"
                  rx="2"
                  className="fill-primary/60"
                />
                <text
                  x="750"
                  y={y + 22}
                  textAnchor="end"
                  className="fill-foreground text-sm"
                >
                  {((trace.probabilities[index] ?? 0) * 100).toFixed(2)}%
                </text>
              </g>
            )}
          </g>
        );
      })}
      {showSelection && (
        <g>
          {trace.probabilities.map((probability, index) => {
            const start = trace.probabilities
              .slice(0, index)
              .reduce((sum, value) => sum + value, 0);
            const chosen = index === selection.id;
            return (
              <g key={`interval-${index}`}>
                <rect
                  x={svgNumber(30 + start * 735)}
                  y="450"
                  width={svgNumber(probability * 735)}
                  height="30"
                  className={
                    chosen
                      ? "fill-primary stroke-background"
                      : "fill-muted stroke-foreground"
                  }
                />
                {probability > 0.035 && (
                  <text
                    x={svgNumber(30 + (start + probability / 2) * 735)}
                    y="470"
                    textAnchor="middle"
                    className={
                      chosen
                        ? "fill-primary-foreground text-xs"
                        : "fill-foreground text-xs"
                    }
                  >
                    {index}
                  </text>
                )}
              </g>
            );
          })}
          <line
            x1={svgNumber(30 + draw * 735)}
            x2={svgNumber(30 + draw * 735)}
            y1="438"
            y2="485"
            strokeWidth="3"
            className="stroke-chart-2"
          />
          <text x="30" y="510" className="fill-foreground text-xs">
            r={draw.toFixed(6)} ∈ [{selection.intervalStart.toFixed(6)},{" "}
            {selection.intervalEnd.toFixed(6)}) → ID {selection.id}
          </text>
        </g>
      )}
      {stage === "decode" && (
        <g>
          <rect
            x="30"
            y="525"
            width="735"
            height="64"
            rx="6"
            className="fill-primary/10 stroke-primary"
          />
          <text x="45" y="550" className="fill-foreground text-sm font-medium">
            ID {selection.id} → {selection.piece} →{" "}
            {selection.isEnd ? "生成を終了する" : "文字列へ復元する"}
          </text>
          <text x="45" y="575" className="fill-foreground text-sm">
            {decodeFlow(trace.ids)}
            {selection.isEnd
              ? "（終了IDは文字列に含めない）"
              : decodeFlow([selection.id])}
          </text>
        </g>
      )}
    </g>
  );
}

export function GenerationDiagram(props: DiagramProps) {
  const id = useId();
  const marker = `${id}-arrow`;
  const vocabularyStage = [
    "output",
    "probabilities",
    "selection",
    "decode",
  ].includes(props.stage);
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <svg
        viewBox="0 0 800 610"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="h-auto w-full min-w-2xl"
      >
        <title id={`${id}-title`}>
          同じ入力から計算した中間表現、語彙スコア、選択IDの流れ
        </title>
        <desc id={`${id}-description`}>
          {vocabularyStage
            ? `末尾の位置${props.trace.ids.length}の4成分から、8つの語彙IDのスコアと確率を計算する。選択したIDに対応する文字列を復元する。`
            : `横方向は入力の位置、奥行きは表現の各成分、縦方向は計算の進行。着目位置は${props.position + 1}。`}
          数値は固定重みの小モデルを実行した結果である。詳細な計算は図の直後に示す。
        </desc>
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
          </marker>
        </defs>
        {!vocabularyStage && (
          <TokenLabels trace={props.trace} position={props.position} />
        )}
        {props.stage === "input" && (
          <g>
            {props.trace.ids.map((tokenId, position) => {
              const point = screen([
                lane(position, props.trace.ids.length),
                0,
                0,
              ]);
              return (
                <g key={`id-${position + 1}`}>
                  <text
                    x={svgNumber(point.x)}
                    y="180"
                    textAnchor="middle"
                    className="fill-foreground text-lg"
                  >
                    「{FLOW_VOCABULARY[tokenId]?.piece}」
                  </text>
                  <DataArrow
                    marker={marker}
                    playing={props.playing}
                    payload={`ID ${tokenId}`}
                    path={`M ${svgNumber(point.x)} 200 V 300`}
                  />
                  <rect
                    x={svgNumber(point.x - 40)}
                    y="320"
                    width="80"
                    height="65"
                    rx="5"
                    className="fill-primary/10 stroke-primary"
                  />
                  <text
                    x={svgNumber(point.x)}
                    y="360"
                    textAnchor="middle"
                    className="fill-foreground text-lg font-medium"
                  >
                    ID {tokenId}
                  </text>
                </g>
              );
            })}
            <text x="30" y="460" className="fill-foreground text-sm">
              説明用の語彙表でIDを引き、そのIDで埋め込み表の行を選ぶ。
            </text>
            <text x="30" y="490" className="fill-muted-foreground text-xs">
              IDの大小は意味の強さを表さない。
            </text>
          </g>
        )}
        {["embedding", "attention-add", "mlp-add"].includes(props.stage) && (
          <OperandScene {...props} marker={marker} />
        )}
        {props.stage === "attention" && (
          <AttentionScene {...props} marker={marker} />
        )}
        {props.stage === "mlp" && <MlpScene {...props} marker={marker} />}
        {vocabularyStage && <VocabularyScene {...props} marker={marker} />}
        {!vocabularyStage && (
          <g className="fill-muted-foreground text-xs">
            <text x="18" y="565">
              横：トークン位置 ／ 奥行き：数値成分 c₁, c₂, …
            </text>
            <text x="18" y="590">
              セルの数値は計算結果。正は主色、負は補助色。動く点は矢印上のデータの受け渡しを示す。
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
