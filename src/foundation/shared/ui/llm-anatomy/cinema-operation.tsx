"use client";

import { memo } from "react";
import {
  cinemaClamp,
  cinemaNumber,
  cinemaOutputCell,
  cinemaPathPoint,
  cinemaTermState,
} from "./cinema-operation-math";
import {
  CinemaArrow,
  CinemaLabel,
  CinemaOutput,
  CinemaValue,
} from "./cinema-operation-primitives";
import type { CinemaSceneProps } from "./cinema-operation-primitives";
import {
  CinemaDecode,
  CinemaGelu,
  CinemaProbabilities,
} from "./cinema-operation-special";
import { computationFrame } from "./generation-computation-model";
import type { ComputationFrame } from "./generation-computation-model";
import type { GenerationTrace } from "./generation-math";
import { decodeFlow, FLOW_VOCABULARY, FLOW_WEIGHTS } from "./generation-math";
import { svgNumber } from "./svg-number";
import type { CinemaFrame } from "./cinema-timeline";

type CinemaOperationContentProps = Omit<CinemaSceneProps, "computation"> & {
  computation?: ComputationFrame;
};
type Point = readonly [number, number];

function path(points: readonly Point[]): string {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${svgNumber(x)} ${svgNumber(y)}`
    )
    .join(" ");
}

function pairPosition(index: number, count: number, mobile: boolean) {
  if (mobile) {
    return count > 4
      ? {
          x: 70 + (index % 4) * 120,
          y: 110 + Math.floor(index / 4) * 105,
          width: 104,
          height: 100,
        }
      : {
          x: 150 + (index % 2) * 250,
          y: 165 + Math.floor(index / 2) * 135,
          width: 190,
          height: 100,
        };
  }
  return count > 8
    ? {
        x: 130 + (index % 4) * 170,
        y: 135 + Math.floor(index / 4) * 118,
        width: 150,
        height: 100,
      }
    : { x: 245, y: 150 + index * 100, width: 390, height: 80 };
}

function termPath(
  index: number,
  count: number,
  mobile: boolean,
  offset = 0
): readonly Point[] {
  const source = pairPosition(index, count, mobile);
  source.y += offset;
  if (mobile) {
    const gap = source.y + source.height / 2 + 8;
    return [
      [source.x, source.y + source.height / 2],
      [source.x, gap],
      [550, gap],
      [550, Math.max(count > 4 ? 495 : 395, gap + 20)],
      [365, count > 4 ? 550 : 500],
    ];
  }
  if (count > 8) {
    const gap = source.y + source.height / 2 + 8;
    return [
      [source.x, source.y + source.height / 2],
      [source.x, gap],
      [760, gap],
      [812, 320],
    ];
  }
  return [
    [source.x + source.width / 2, source.y],
    [812, 320],
  ];
}

function Particle({
  x,
  y,
  value,
  scale = 1,
}: {
  x: number;
  y: number;
  value: number;
  scale?: number;
}) {
  return (
    <g
      transform={`translate(${svgNumber(x)} ${svgNumber(y)}) scale(${svgNumber(scale)})`}
      data-cinema-product
    >
      <rect
        x="-52"
        y="-21"
        width="104"
        height="42"
        rx="12"
        strokeWidth="2"
        className="fill-primary stroke-background"
      />
      <text
        y="8"
        textAnchor="middle"
        fontSize="26"
        className="fill-primary-foreground font-mono font-semibold"
      >
        {cinemaNumber(value)}
      </text>
    </g>
  );
}

function normalizationStatistics({
  computation,
  mobile,
  marker,
}: CinemaSceneProps) {
  const scalars = computation.inputs.filter(
    (input) => input.values.length === 1
  );
  const values = computation.inputs[0]?.values ?? [];
  const selected = values[computation.activeComponent] ?? Number.NaN;
  const mean = scalars[0]?.values[0] ?? Number.NaN;
  const denominator = scalars[3]?.values[0] ?? Number.NaN;
  const standardized = computation.terms[0]?.left ?? Number.NaN;
  const selectedX = mobile
    ? 96 + computation.activeComponent * 136
    : 100 + computation.activeComponent * 160;
  return (
    <g>
      {scalars.slice(0, 4).map((input, index) => (
        <g key={input.label}>
          <CinemaLabel
            x={mobile ? 90 + (index % 2) * 300 : 125 + index * 210}
            y={mobile ? 55 + Math.floor(index / 2) * 66 : 55}
            size={24}
          >
            {input.label}
          </CinemaLabel>
          <CinemaLabel
            x={mobile ? 90 + (index % 2) * 300 : 125 + index * 210}
            y={mobile ? 83 + Math.floor(index / 2) * 66 : 92}
            size={28}
            active
          >
            {cinemaNumber(input.values[0] ?? Number.NaN)}
          </CinemaLabel>
        </g>
      ))}
      <CinemaLabel x={mobile ? 300 : 380} y={mobile ? 182 : 140} size={26}>
        入力 x の4成分
      </CinemaLabel>
      {values.map((value, index) => (
        <CinemaValue
          key={`normalization-x-${index}`}
          x={mobile ? 96 + index * 136 : 100 + index * 160}
          y={mobile ? 220 : 185}
          width={mobile ? 124 : 130}
          height={58}
          value={value}
          active={index === computation.activeComponent}
          limit={2}
        />
      ))}
      <CinemaLabel
        x={mobile ? 300 : 410}
        y={mobile ? 280 : 260}
        size={24}
        active
      >
        ({cinemaNumber(selected)} − {cinemaNumber(mean)}) ÷{" "}
        {cinemaNumber(denominator)} = {cinemaNumber(standardized)}
      </CinemaLabel>
      <CinemaArrow
        path={
          mobile
            ? `M${svgNumber(selectedX)} 249 H20 V345 H55`
            : `M${svgNumber(selectedX)} 214 H20 V320 H50`
        }
        marker={marker}
      />
    </g>
  );
}

function residualPath(
  index: number,
  component: number,
  mobile: boolean
): readonly Point[] {
  if (mobile) {
    const x = 150 + (component % 2) * 200;
    const y = (index === 0 ? 165 : 365) + Math.floor(component / 2) * 80;
    return index === 0
      ? [
          [x + 75, y],
          [525, y],
          [525, 600],
          [365, 600],
        ]
      : [
          [x + 75, y],
          [300, y],
          [300, 535],
        ];
  }
  const x = 110 + component * 145;
  return index === 0
    ? [
        [x + 65, 180],
        [700, 180],
        [700, 48],
        [900, 48],
        [900, 232],
      ]
    : [
        [x + 65, 430],
        [760, 430],
        [812, 320],
      ];
}

function ResidualSources({ computation, mobile }: CinemaSceneProps) {
  return (
    <g data-cinema-residual>
      {computation.inputs.slice(0, 2).map((input, branch) => (
        <g key={input.label}>
          <CinemaLabel
            x={mobile ? 250 : 330}
            y={mobile ? (branch === 0 ? 100 : 300) : branch === 0 ? 105 : 355}
            size={28}
            active={branch === 0}
          >
            {input.label}
            {branch === 0 ? "：同じ4値を保持" : "：同じ成分へ加算"}
          </CinemaLabel>
          {input.values.map((value, index) => (
            <CinemaValue
              key={`${input.label}-${index}`}
              x={mobile ? 150 + (index % 2) * 200 : 110 + index * 145}
              y={
                mobile
                  ? (branch === 0 ? 165 : 365) + Math.floor(index / 2) * 80
                  : branch === 0
                    ? 180
                    : 430
              }
              width={mobile ? 150 : 130}
              height={mobile ? 60 : 66}
              value={value}
              active={index === computation.activeComponent}
              limit={2}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

function NumericScene(props: CinemaSceneProps) {
  const { frame, computation, mobile, marker, trace } = props;
  const isAdd = computation.termMode === "addends";
  const isNorm = frame.kind === "norm";
  const isWeighted = frame.operationId.startsWith("weighted-");
  const isResidual = frame.id === "residual1" || frame.id === "residual2";
  const normOffset = mobile ? 180 : 170;
  const state = cinemaTermState(computation.terms, frame.termProgress);
  const {
    outputPath,
    outputProgress,
    output,
    sumX,
    sumY,
  }: {
    outputPath: readonly Point[];
    outputProgress: number;
    output: { x: number; y: number; width: number; height: number };
    sumX: number;
    sumY: number;
  } = numericOutputLayout(mobile, isResidual, computation, frame);
  const sourcePath = (index: number) =>
    isResidual
      ? residualPath(index, computation.activeComponent, mobile)
      : termPath(
          index,
          computation.terms.length,
          mobile,
          isNorm ? normOffset : 0
        );
  const resultPoint = cinemaPathPoint(outputPath, outputProgress);
  const arrowOutputPath: readonly Point[] = [
    ...outputPath.slice(0, -1),
    [output.x, output.y - output.height / 2 - 6],
  ];
  return (
    <g
      data-cinema-numeric
      data-received-count={state.receivedCount}
      data-partial-sum={svgNumber(state.partialSum)}
    >
      <NumericSourceLabel
        isNorm={isNorm}
        props={props}
        isResidual={isResidual}
        mobile={mobile}
        isAdd={isAdd}
        isWeighted={isWeighted}
        frame={frame}
      />
      {isResidual && <ResidualSources {...props} />}
      {computation.terms.map((term, index) => {
        const source = pairPosition(index, computation.terms.length, mobile);
        const edge = sourcePath(index);
        const weight = isWeighted ? 2 + Math.max(0, term.left) * 14 : 2;
        const token = isWeighted
          ? `位置${index + 1}「${FLOW_VOCABULARY[trace.ids[index] ?? -1]?.piece ?? ""}」`
          : term.label;
        const received = state.items[index]?.received ?? false;
        const offset = isNorm ? normOffset : 0;
        return (
          <g
            key={`${frame.operationId}-${index}`}
            data-cinema-term={index}
            data-term-received={received ? "true" : "false"}
          >
            <CinemaArrow
              path={path(edge)}
              marker={marker}
              width={weight}
              secondary={isResidual && index === 0}
            />
            {!isResidual && (
              <g
                transform={`translate(${svgNumber(source.x)} ${svgNumber(source.y + offset)})`}
              >
                <rect
                  x={svgNumber(-source.width / 2)}
                  y={svgNumber(-source.height / 2)}
                  width={svgNumber(source.width)}
                  height={svgNumber(source.height)}
                  rx="10"
                  strokeWidth="2"
                  className={
                    received
                      ? "fill-primary/10 stroke-primary"
                      : "fill-background stroke-border"
                  }
                />
                <CinemaLabel
                  x={0}
                  y={mobile || computation.terms.length > 8 ? -25 : -15}
                  size={24}
                >
                  {token}
                </CinemaLabel>
                {isAdd ? (
                  <CinemaLabel x={0} y={25} size={mobile ? 32 : 36} active>
                    {cinemaNumber(term.left)}
                  </CinemaLabel>
                ) : mobile || computation.terms.length > 8 ? (
                  <>
                    <CinemaLabel x={0} y={4} size={24}>
                      {cinemaNumber(term.left)}
                    </CinemaLabel>
                    <CinemaLabel x={0} y={32} size={24}>
                      × {cinemaNumber(term.right)}
                    </CinemaLabel>
                  </>
                ) : (
                  <CinemaLabel x={0} y={25} size={32}>
                    {cinemaNumber(term.left)} × {cinemaNumber(term.right)}
                  </CinemaLabel>
                )}
              </g>
            )}
          </g>
        );
      })}
      <NumericAccumulator
        sumX={sumX}
        sumY={sumY}
        mobile={mobile}
        state={state}
        computation={computation}
        arrowOutputPath={arrowOutputPath}
        marker={marker}
        isNorm={isNorm}
      />
      <CinemaOutput
        values={computation.output.values}
        activeComponent={computation.activeComponent}
        activePending={outputProgress < 0.8}
        mobile={mobile}
        {...(mobile && isResidual ? { originY: 770 } : {})}
        label={mobile ? "全出力" : computation.output.label}
      />
      {computation.terms.map((term, index) => {
        const travel = state.items[index];
        if (!travel?.moving) {
          return null;
        }
        const location = cinemaPathPoint(sourcePath(index), travel.progress);
        return (
          <Particle
            key={`product-${index}`}
            x={location.x}
            y={location.y}
            value={term.product}
            scale={Math.min(1, (1 - travel.progress) / 0.2)}
          />
        );
      })}
      {state.complete && (
        <Particle
          x={resultPoint.x}
          y={resultPoint.y}
          value={computation.result}
          scale={Math.min(1, outputProgress / 0.2, (1 - outputProgress) / 0.2)}
        />
      )}
    </g>
  );
}

function NumericSourceLabel({
  isNorm,
  props,
  isResidual,
  mobile,
  isAdd,
  isWeighted,
  frame,
}: {
  isNorm: boolean;
  props: CinemaSceneProps;
  isResidual: boolean;
  mobile: boolean;
  isAdd: boolean;
  isWeighted: boolean;
  frame: CinemaFrame;
}) {
  if (isNorm) {
    return normalizationStatistics(props);
  }
  if (isResidual) {
    return null;
  }
  return (
    <CinemaLabel
      x={mobile ? 260 : 385}
      y={mobile ? 32 : 65}
      size={mobile ? 26 : 30}
    >
      {isAdd
        ? "対応する同じ成分を加える"
        : isWeighted
          ? "各位置の α × V"
          : frame.operationId === "score-mask-score"
            ? "Qの成分 × Kの同じ成分"
            : "対応する重み × 入力"}
    </CinemaLabel>
  );
}

function numericOutputLayout(
  mobile: boolean,
  isResidual: boolean,
  computation: ComputationFrame,
  frame: CinemaFrame
) {
  const sumX = mobile ? 300 : 900;
  const sumY = mobile
    ? isResidual
      ? 600
      : computation.terms.length > 4
        ? 550
        : 500
    : 320;
  const outputProgress = cinemaClamp((frame.operationProgress - 0.8) / 0.1);
  const output = cinemaOutputCell(
    computation.output.values.length,
    computation.activeComponent,
    mobile,
    mobile && isResidual ? 770 : undefined
  );
  const outputPath: readonly Point[] = mobile
    ? [
        [300, sumY + 65],
        [300, sumY + 78],
        [output.x, sumY + 78],
        [output.x, output.y],
      ]
    : [
        [988, 320],
        [1005, 320],
        [1005, output.y - output.height / 2 - 14],
        [output.x, output.y - output.height / 2 - 14],
        [output.x, output.y],
      ];
  return { outputPath, outputProgress, output, sumX, sumY };
}

function NumericAccumulator({
  sumX,
  sumY,
  mobile,
  state,
  computation,
  arrowOutputPath,
  marker,
  isNorm,
}: {
  sumX: number;
  sumY: number;
  mobile: boolean;
  state: {
    items: {
      product: number;
      progress: number;
      received: boolean;
      moving: boolean;
    }[];
    receivedCount: number;
    partialSum: number;
    complete: boolean;
  };
  computation: ComputationFrame;
  arrowOutputPath: readonly Point[];
  marker: string;
  isNorm: boolean;
}) {
  return (
    <g data-cinema-accumulator>
      <circle
        cx={sumX}
        cy={sumY}
        r={mobile ? 65 : 88}
        strokeWidth="3"
        className="fill-primary/5 stroke-primary"
      />
      <CinemaLabel
        x={mobile ? 100 : sumX}
        y={mobile ? sumY - 10 : sumY - 92}
        size={mobile ? 26 : 30}
      >
        {mobile ? "到着分" : "到着した項の和"}
      </CinemaLabel>
      <CinemaLabel x={sumX} y={sumY - 30} size={mobile ? 38 : 44} active>
        Σ
      </CinemaLabel>
      <CinemaLabel x={sumX} y={sumY + 30} size={mobile ? 32 : 42} active>
        {cinemaNumber(state.partialSum)}
      </CinemaLabel>
      <CinemaLabel
        x={mobile ? 100 : sumX}
        y={mobile ? sumY + 30 : sumY + 100}
        size={24}
      >
        {state.receivedCount} / {computation.terms.length} 項
      </CinemaLabel>
      <CinemaArrow path={path(arrowOutputPath)} marker={marker} />
      {state.complete && (
        <>
          <CinemaLabel
            x={mobile ? 480 : 1150}
            y={mobile ? sumY - 15 : 610}
            size={24}
            active
          >
            {outputAdjustmentLabel(computation, isNorm)}
          </CinemaLabel>
          <CinemaLabel
            x={mobile ? 480 : 1150}
            y={mobile ? sumY + 25 : 640}
            size={24}
            active
          >
            → {cinemaNumber(computation.result)}
          </CinemaLabel>
        </>
      )}
    </g>
  );
}

function outputAdjustmentLabel(computation: ComputationFrame, isNorm: boolean) {
  return computation.divisor === undefined
    ? computation.bias === 0 && !isNorm
      ? "Σ → 出力"
      : `＋ ${isNorm ? "β" : "b"} ${cinemaNumber(computation.bias)}`
    : `÷ ${cinemaNumber(computation.divisor)}`;
}

function LookupScene({ trace, frame, mobile, marker }: CinemaSceneProps) {
  const id = trace.ids.at(-1);
  if (id === undefined) {
    throw new Error("埋め込み参照には入力IDが必要です。");
  }
  const embedding = frame.operationId === "embedding-lookup";
  if (!embedding) {
    return (
      <TokenizeScene
        mobile={mobile}
        trace={trace}
        marker={marker}
        frame={frame}
      />
    );
  }
  const selected = FLOW_WEIGHTS.embedding[id];
  if (!selected) {
    throw new Error(`語彙にID ${id}の埋め込みがありません。`);
  }
  const left = mobile ? 40 : 330;
  const top = mobile ? 170 : 155;
  const rowHeight = mobile ? 43 : 48;
  const columnGap = mobile ? 80 : 110;
  const firstValueX = mobile ? 260 : 570;
  const rowY = top + id * rowHeight;
  const route: readonly Point[] = mobile
    ? [
        [550, rowY],
        [575, rowY],
        [575, 545],
        [300, 600],
      ]
    : [
        [985, rowY],
        [1060, rowY],
        [1060, 500],
        [1230, 500],
      ];
  const packet = cinemaPathPoint(
    route,
    cinemaClamp((frame.operationProgress - 0.2) / 0.65)
  );
  return (
    <EmbeddingLookup
      mobile={mobile}
      id={id}
      left={left}
      top={top}
      rowHeight={rowHeight}
      firstValueX={firstValueX}
      columnGap={columnGap}
      route={route}
      marker={marker}
      selected={selected}
      packet={packet}
    />
  );
}

function EmbeddingLookup({
  mobile,
  id,
  left,
  top,
  rowHeight,
  firstValueX,
  columnGap,
  route,
  marker,
  selected,
  packet,
}: {
  mobile: boolean;
  id: number;
  left: number;
  top: number;
  rowHeight: number;
  firstValueX: number;
  columnGap: number;
  route: readonly Point[];
  marker: string;
  selected:
    | readonly [0.7, -0.4, 0.2, 0.5]
    | readonly [-0.2, 0.6, 0.4, -0.3]
    | readonly [0.5, 0.1, -0.6, 0.8]
    | readonly [-0.4, 0.3, 0.7, 0.2]
    | readonly [0.2, -0.5, 0.6, -0.1]
    | readonly [0.8, 0.4, -0.2, -0.6]
    | readonly [-0.5, -0.2, 0.1, 0.7]
    | readonly [0.1, 0.8, -0.4, -0.5];
  packet: { x: number; y: number };
}) {
  return (
    <g data-cinema-lookup="embedding">
      <CinemaLabel
        x={mobile ? 300 : 660}
        y={mobile ? 65 : 70}
        size={mobile ? 30 : 36}
      >
        ID {id} が E の行を選ぶ
      </CinemaLabel>
      <CinemaLabel x={mobile ? 300 : 660} y={mobile ? 110 : 112} size={26}>
        IDを掛け算せず、その行の4値を取り出す
      </CinemaLabel>
      {FLOW_WEIGHTS.embedding.map((row, rowIndex) => (
        <g key={`vocabulary-${rowIndex}`}>
          <rect
            x={svgNumber(left)}
            y={svgNumber(top + rowIndex * rowHeight - 26)}
            width={mobile ? 520 : 650}
            height={rowHeight - 3}
            rx="5"
            className={
              rowIndex === id
                ? "fill-primary/15 stroke-primary"
                : "fill-muted/20 stroke-border"
            }
          />
          <CinemaLabel
            x={mobile ? 58 : 350}
            y={top + rowIndex * rowHeight + 4}
            anchor="start"
            size={24}
            active={rowIndex === id}
          >
            ID {rowIndex}「{FLOW_VOCABULARY[rowIndex]?.piece}」
          </CinemaLabel>
          {row.map((value, column) => (
            <CinemaLabel
              key={`${rowIndex}-${column}`}
              x={firstValueX + column * columnGap}
              y={top + rowIndex * rowHeight + 4}
              size={24}
              active={rowIndex === id}
            >
              {cinemaNumber(value)}
            </CinemaLabel>
          ))}
        </g>
      ))}
      <CinemaArrow path={path(route)} marker={marker} />
      <CinemaOutput
        values={selected}
        activeComponent={2}
        mobile={mobile}
        label={`E[ID ${id}] の同じ4値`}
      />
      <g transform={`translate(${svgNumber(packet.x)} ${svgNumber(packet.y)})`}>
        <rect
          x="-40"
          y="-24"
          width="80"
          height="48"
          rx="8"
          className="fill-primary"
        />
        <text
          y="8"
          textAnchor="middle"
          fontSize="24"
          className="fill-primary-foreground"
        >
          E[{id}]
        </text>
      </g>
    </g>
  );
}

function TokenizeScene({
  mobile,
  trace,
  marker,
  frame,
}: {
  mobile: boolean;
  trace: GenerationTrace;
  marker: string;
  frame: CinemaFrame;
}) {
  return (
    <g data-cinema-lookup="tokenize">
      <CinemaLabel
        x={mobile ? 300 : 720}
        y={mobile ? 85 : 90}
        size={mobile ? 38 : 48}
      >
        「{decodeFlow(trace.ids)}」
      </CinemaLabel>
      <CinemaLabel x={mobile ? 300 : 720} y={mobile ? 145 : 145} size={28}>
        語彙の文字片に対応する整数IDを得る
      </CinemaLabel>
      {trace.ids.map((tokenId, position) => {
        const x = mobile ? 100 + position * 200 : 350 + position * 340;
        return (
          <g key={`token-${position}`}>
            <CinemaLabel x={x} y={mobile ? 255 : 260} size={32}>
              「{FLOW_VOCABULARY[tokenId]?.piece}」
            </CinemaLabel>
            <CinemaArrow
              path={`M${x} ${mobile ? 285 : 290} V${mobile ? 470 : 425}`}
              marker={marker}
            />
            <CinemaValue
              x={x}
              y={mobile ? 520 : 475}
              width={mobile ? 140 : 190}
              height={72}
              value={tokenId}
              active={frame.operationProgress >= position / trace.ids.length}
              label="ID"
            />
          </g>
        );
      })}
      <CinemaLabel x={mobile ? 300 : 720} y={mobile ? 700 : 610} size={30}>
        入力ID列 [{trace.ids.join(", ")}]
      </CinemaLabel>
    </g>
  );
}

function MaskScene({ computation, trace, mobile }: CinemaSceneProps) {
  return (
    <g data-cinema-mask>
      {computation.matrices.slice(0, 3).map((matrix, matrixIndex) => {
        const x = mobile ? 110 : 95 + matrixIndex * 475;
        const y = mobile ? 130 + matrixIndex * 225 : 190;
        const cellWidth = mobile ? 140 : 108;
        const rowHeight = mobile ? 47 : 77;
        return (
          <g key={matrix.label}>
            <CinemaLabel
              x={mobile ? 300 : x + 140}
              y={y - 55}
              size={mobile ? 28 : 30}
            >
              {matrixIndex === 0
                ? "QKᵀ / √2"
                : matrixIndex === 1
                  ? "未来を −∞ にする"
                  : "softmax → 注意重み α"}
            </CinemaLabel>
            {trace.ids.map((id, column) => (
              <CinemaLabel
                key={`source-${column}`}
                x={x + column * cellWidth}
                y={y - 14}
                size={24}
              >
                {column + 1}「{FLOW_VOCABULARY[id]?.piece}」
              </CinemaLabel>
            ))}
            {matrix.rows.map((row, rowIndex) => (
              <g key={`row-${rowIndex}`}>
                <CinemaLabel
                  x={mobile ? 36 : x - 70}
                  y={y + rowIndex * rowHeight + 33}
                  size={24}
                >
                  {rowIndex + 1}
                </CinemaLabel>
                {row.map((value, column) => (
                  <CinemaValue
                    key={`${rowIndex}-${column}`}
                    x={x + column * cellWidth}
                    y={y + rowIndex * rowHeight + 25}
                    width={cellWidth - 8}
                    height={rowHeight - 5}
                    value={value}
                    active={
                      rowIndex === trace.ids.length - 1 &&
                      column === computation.activeComponent
                    }
                    limit={2}
                  />
                ))}
              </g>
            ))}
          </g>
        );
      })}
      <CinemaLabel x={mobile ? 300 : 720} y={mobile ? 825 : 605} size={26}>
        同じ行のαで、各参照元のVを集める → α × V
      </CinemaLabel>
    </g>
  );
}

function CinemaOperationContentView({
  trace,
  selection,
  frame,
  computation: suppliedComputation,
  mobile,
  marker,
}: CinemaOperationContentProps) {
  const computation =
    suppliedComputation ??
    computationFrame(trace, selection, frame.stage, frame.progress);
  const props = {
    trace,
    selection,
    frame,
    computation,
    mobile,
    marker,
  };
  if (frame.kind === "lookup") {
    return <LookupScene {...props} />;
  }
  if (frame.kind === "gelu") {
    return <CinemaGelu {...props} />;
  }
  if (frame.kind === "probabilities" || frame.kind === "selection") {
    return <CinemaProbabilities {...props} />;
  }
  if (frame.kind === "decode") {
    return <CinemaDecode {...props} />;
  }
  if (computation.terms.length === 0) {
    return <MaskScene {...props} />;
  }
  return <NumericScene {...props} />;
}

export const CinemaOperationContent = memo(CinemaOperationContentView);
