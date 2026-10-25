import { cinemaClamp, cinemaNumber } from "./cinema-operation-math";
import {
  CinemaArrow,
  CinemaLabel,
  CinemaOutput,
  CinemaValue,
} from "./cinema-operation-primitives";
import type { CinemaSceneProps } from "./cinema-operation-primitives";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import { decodeFlow, FLOW_VOCABULARY } from "./generation-math";
import { approximateGelu } from "./representation-math";
import { svgNumber } from "./svg-number";

const DRAW = 0.62;

function ease(value: number): number {
  const t = cinemaClamp(value);
  return t * t * (3 - 2 * t);
}

function requiredValue(values: readonly number[], index: number): number {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`可視化に必要な成分 ${index} がありません。`);
  }
  return value;
}

function geluGeometry(input: readonly number[], mobile: boolean) {
  const left = mobile ? 76 : 530;
  const top = mobile ? 355 : 170;
  const width = mobile ? 448 : 425;
  const height = mobile ? 165 : 310;
  const extent = Math.max(3, Math.ceil(Math.max(...input.map(Math.abs))));
  return {
    left,
    top,
    width,
    height,
    extent,
    plotX: (value: number) => left + ((value + extent) / (2 * extent)) * width,
    plotY: (value: number) =>
      top + ((extent - value) / (extent + 0.4)) * height,
  };
}

function GeluPlot({
  input,
  output,
  component,
  mobile,
}: {
  input: readonly number[];
  output: readonly number[];
  component: number;
  mobile: boolean;
}) {
  const { left, top, width, height, extent, plotX, plotY } = geluGeometry(
    input,
    mobile
  );
  const z = requiredValue(input, component);
  const g = requiredValue(output, component);
  const curve = Array.from({ length: 121 }, (_, index) => {
    const x = -extent + (index / 120) * extent * 2;
    return `${index === 0 ? "M" : "L"}${svgNumber(plotX(x))} ${svgNumber(plotY(approximateGelu(x)))}`;
  }).join(" ");

  return (
    <g data-cinema-gelu-curve>
      <CinemaLabel x={left + width / 2} y={top - 32} size={mobile ? 25 : 30}>
        GELU：各成分に同じ関数
      </CinemaLabel>
      <path
        d={`M${svgNumber(left)} ${svgNumber(plotY(0))} H${svgNumber(left + width)} M${svgNumber(plotX(0))} ${svgNumber(top)} V${svgNumber(top + height)}`}
        fill="none"
        strokeWidth="2"
        className="stroke-muted-foreground/50"
      />
      <path d={curve} fill="none" strokeWidth="4" className="stroke-primary" />
      {input.map((value, index) => (
        <circle
          key={index}
          cx={svgNumber(plotX(value))}
          cy={svgNumber(plotY(requiredValue(output, index)))}
          r={index === component ? "7" : "4"}
          className={index === component ? "fill-primary" : "fill-primary/30"}
        />
      ))}
      <path
        d={`M${svgNumber(plotX(z))} ${svgNumber(plotY(0))} V${svgNumber(plotY(g))} H${svgNumber(plotX(0))}`}
        fill="none"
        strokeWidth="2"
        strokeDasharray="7 5"
        className="stroke-chart-2"
      />
      <circle
        cx={svgNumber(plotX(z))}
        cy={svgNumber(plotY(g))}
        r="11"
        strokeWidth="3"
        className="fill-primary stroke-background"
        data-gelu-probe
      />
      <CinemaLabel x={left} y={top + height + 29} size={24}>
        −{extent}
      </CinemaLabel>
      <CinemaLabel x={left + width} y={top + height + 29} size={24}>
        {extent}
      </CinemaLabel>
      <CinemaLabel x={plotX(0)} y={top + height + 29} size={24}>
        0
      </CinemaLabel>
      <CinemaLabel
        x={left + width - 5}
        y={top + height - 15}
        size={24}
        anchor="end"
      >
        入力 z
      </CinemaLabel>
      <CinemaLabel
        x={mobile ? 300 : 740}
        y={mobile ? 292 : 555}
        size={mobile ? 28 : 30}
        active
      >
        第{component + 1}成分：{cinemaNumber(z)} → {cinemaNumber(g)}
      </CinemaLabel>
    </g>
  );
}

function GeluFlight({
  input,
  output,
  component,
  mobile,
  progress,
}: {
  input: readonly number[];
  output: readonly number[];
  component: number;
  mobile: boolean;
  progress: number;
}) {
  const { plotX, plotY } = geluGeometry(input, mobile);
  const z = requiredValue(input, component);
  const g = requiredValue(output, component);
  const source = {
    x: mobile ? 78 + (component % 4) * 148 : 80 + (component % 4) * 105,
    y: mobile
      ? 67 + Math.floor(component / 4) * 59
      : 175 + Math.floor(component / 4) * 83,
  };
  const destination = {
    x: mobile ? 96 + (component % 4) * 136 : 1070 + (component % 4) * 102,
    y: mobile
      ? 632 + Math.floor(component / 4) * 57
      : 210 + Math.floor(component / 4) * 84,
  };
  const entering = progress <= 0.5;
  const curve = [plotX(z), plotY(g)] as const;
  const t = entering ? ease(progress / 0.4) : ease((progress - 0.6) / 0.4);
  const outgoing = mobile
    ? ([
        curve,
        [170, curve[1]],
        [170, destination.y],
        [destination.x, destination.y],
      ] as const)
    : ([curve, [destination.x, destination.y]] as const);
  const point = pathPoint(
    entering ? [[source.x, source.y], curve] : outgoing,
    t
  );
  return (
    <g
      data-cinema-gelu-flight
      data-gelu-flight-value={svgNumber(entering ? z : g)}
    >
      <circle
        cx={svgNumber(point.x)}
        cy={svgNumber(point.y)}
        r="9"
        strokeWidth="3"
        className="fill-primary stroke-background"
      />
    </g>
  );
}

export function CinemaGelu({
  trace,
  frame,
  computation,
  mobile,
  marker,
}: CinemaSceneProps) {
  const input = trace.mlpPre.at(-1);
  const output = trace.mlpActivated.at(-1);
  if (!(input && output)) {
    throw new Error("GELUの入出力がありません。");
  }
  const component = computation.activeComponent;
  const limit = Math.max(1, ...input.map(Math.abs));
  return (
    <g data-cinema-special="gelu">
      <CinemaLabel
        x={mobile ? 300 : 240}
        y={mobile ? 30 : 105}
        size={mobile ? 26 : 30}
      >
        変換前 z：16成分
      </CinemaLabel>
      {input.map((value, index) => (
        <CinemaValue
          key={index}
          x={mobile ? 78 + (index % 4) * 148 : 80 + (index % 4) * 105}
          y={
            mobile
              ? 67 + Math.floor(index / 4) * 59
              : 175 + Math.floor(index / 4) * 83
          }
          width={mobile ? 130 : 94}
          height={mobile ? 48 : 64}
          value={value}
          active={index === component}
          limit={limit}
        />
      ))}
      {!mobile && <CinemaArrow path="M452 300 H505" marker={marker} />}
      <GeluPlot
        input={input}
        output={output}
        component={component}
        mobile={mobile}
      />
      {!mobile && <CinemaArrow path="M970 300 H1005" marker={marker} />}
      <CinemaOutput
        values={output}
        activeComponent={component}
        mobile={mobile}
        label="変換後 g：16成分"
      />
      <GeluFlight
        input={input}
        output={output}
        component={component}
        mobile={mobile}
        progress={frame.operationProgress}
      />
    </g>
  );
}

function ProbabilityRows({
  trace,
  selection,
  frame,
  mobile,
  marker,
}: CinemaSceneProps) {
  const maximum = Math.max(...trace.logits.map(Math.abs), Number.EPSILON);
  const arrived =
    frame.kind === "selection" ? 1 : ease(frame.operationProgress);
  return (
    <g data-cinema-probability-rows>
      <CinemaLabel x={mobile ? 52 : 100} y={mobile ? 25 : 28} size={24}>
        ID
      </CinemaLabel>
      <CinemaLabel x={mobile ? 162 : 330} y={mobile ? 25 : 28} size={26}>
        スコア z
      </CinemaLabel>
      <CinemaLabel x={mobile ? 385 : 895} y={mobile ? 25 : 28} size={26}>
        確率 π（全幅100%）
      </CinemaLabel>
      {trace.probabilities.map((probability, tokenId) => {
        const y = (mobile ? 70 : 80) + tokenId * (mobile ? 50 : 54);
        const left = mobile ? 280 : 680;
        const scale = mobile ? 210 : 450;
        const active =
          frame.kind === "selection" &&
          frame.operationProgress >= 0.65 &&
          tokenId === selection.id;
        const packetX = (mobile ? 233 : 475) + arrived * (mobile ? 28 : 165);
        return (
          <ProbabilityRow
            key={tokenId}
            tokenId={tokenId}
            active={active}
            mobile={mobile}
            y={y}
            trace={trace}
            maximum={maximum}
            marker={marker}
            arrived={arrived}
            packetX={packetX}
            left={left}
            scale={scale}
            probability={probability}
          />
        );
      })}
    </g>
  );
}

function ProbabilityRow({
  tokenId,
  active,
  mobile,
  y,
  trace,
  maximum,
  marker,
  arrived,
  packetX,
  left,
  scale,
  probability,
}: {
  tokenId: number;
  active: boolean;
  mobile: boolean;
  y: number;
  trace: GenerationTrace;
  maximum: number;
  marker: string;
  arrived: number;
  packetX: number;
  left: number;
  scale: number;
  probability: number;
}) {
  return (
    <g
      key={tokenId}
      data-cinema-probability-id={tokenId}
      data-selected={active ? "true" : "false"}
    >
      <CinemaLabel
        x={mobile ? 52 : 100}
        y={y + 6}
        size={mobile ? 24 : 28}
        active={active}
      >
        {tokenId}{" "}
        {FLOW_VOCABULARY[tokenId]?.isEnd
          ? "終"
          : FLOW_VOCABULARY[tokenId]?.piece}
      </CinemaLabel>
      <CinemaValue
        x={mobile ? 165 : 330}
        y={y}
        width={mobile ? 120 : 220}
        height={mobile ? 42 : 46}
        value={requiredValue(trace.logits, tokenId)}
        limit={maximum}
        active={active}
      />
      <CinemaArrow
        path={`M${mobile ? "233" : "475"} ${svgNumber(y)} H${mobile ? "262" : "640"}`}
        marker={marker}
        width={2}
      />
      {arrived < 1 && (
        <circle
          cx={svgNumber(packetX)}
          cy={svgNumber(y)}
          r="5"
          className="fill-primary"
        />
      )}
      <rect
        x={svgNumber(left)}
        y={svgNumber(y - 13)}
        width={svgNumber(scale)}
        height="26"
        rx="4"
        className="fill-muted"
      />
      <rect
        x={svgNumber(left)}
        y={svgNumber(y - 13)}
        width={svgNumber(probability * scale)}
        height="26"
        rx="4"
        fillOpacity={svgNumber(0.25 + arrived * 0.75)}
        className={active ? "fill-chart-2" : "fill-primary"}
        data-cinema-probability-width={svgNumber(probability)}
      />
      <CinemaLabel
        x={mobile ? 548 : 1260}
        y={y + 7}
        size={mobile ? 24 : 30}
        active={active}
      >
        {(probability * 100).toFixed(1)}%
      </CinemaLabel>
    </g>
  );
}

function ProbabilityIntervals({
  trace,
  selection,
  frame,
  computation,
  mobile,
}: CinemaSceneProps) {
  const left = mobile ? 40 : 420;
  const width = mobile ? 520 : 600;
  const top = mobile ? 608 : 560;
  const selecting = frame.kind === "selection";
  const selected = selecting && frame.operationProgress >= 0.65;
  const markerX = left + DRAW * width;
  const markerY = top - 28 + ease(frame.operationProgress / 0.65) * 28;
  let start = 0;
  const intervals = trace.probabilities.map((probability, id) => {
    const interval = { id, probability, start };
    start += probability;
    return interval;
  });
  const sum = trace.probabilities.reduce((total, value) => total + value, 0);
  const max = Math.max(...trace.logits);
  const denominator = trace.logits.reduce(
    (total, value) => total + Math.exp((value - max) / trace.temperature),
    0
  );
  const representative = selecting ? selection.id : computation.activeComponent;
  const numerator = Math.exp(
    (requiredValue(trace.logits, representative) - max) / trace.temperature
  );
  return (
    <g data-cinema-intervals>
      <ProbabilityFormula
        mobile={mobile}
        representative={representative}
        numerator={numerator}
        denominator={denominator}
        trace={trace}
        sum={sum}
        selecting={selecting}
      />
      {intervals.map((interval) => {
        const active = selected && interval.id === selection.id;
        return (
          <g key={interval.id} data-cinema-interval-id={interval.id}>
            <rect
              x={svgNumber(left + interval.start * width)}
              y={svgNumber(top)}
              width={svgNumber(interval.probability * width)}
              height="44"
              strokeWidth="2"
              className={
                active
                  ? "fill-chart-2 stroke-background"
                  : interval.id % 2 === 0
                    ? "fill-primary/45 stroke-background"
                    : "fill-primary/80 stroke-background"
              }
            />
            {interval.probability * width >= 24 && (
              <CinemaLabel
                x={left + (interval.start + interval.probability / 2) * width}
                y={top + 30}
                size={24}
              >
                {interval.id}
              </CinemaLabel>
            )}
          </g>
        );
      })}
      <CinemaLabel x={left} y={top + 77} size={24}>
        0
      </CinemaLabel>
      <CinemaLabel x={left + width} y={top + 77} size={24}>
        1
      </CinemaLabel>
      {selecting && (
        <g data-cinema-draw={DRAW}>
          <CinemaLabel x={markerX} y={markerY - 36} size={26} active>
            r = {DRAW}
          </CinemaLabel>
          <path
            d={`M${svgNumber(markerX)} ${svgNumber(markerY - 25)} V${svgNumber(markerY - 10)} M${svgNumber(markerX - 9)} ${svgNumber(markerY - 12)} L${svgNumber(markerX)} ${svgNumber(markerY)} L${svgNumber(markerX + 9)} ${svgNumber(markerY - 12)}`}
            fill="none"
            strokeWidth="4"
            className="stroke-chart-2"
          />
        </g>
      )}
      {selecting && (
        <g opacity={svgNumber(ease((frame.operationProgress - 0.65) / 0.2))}>
          <rect
            x={mobile ? "190" : "1120"}
            y={mobile ? "710" : "535"}
            width="220"
            height="76"
            rx="12"
            className="fill-primary/10 stroke-primary"
            strokeWidth="3"
          />
          <CinemaLabel
            x={mobile ? 300 : 1230}
            y={mobile ? 758 : 584}
            size={36}
            active
          >
            整数ID {selection.id}
          </CinemaLabel>
          {!mobile && (
            <CinemaLabel x={1230} y={635} size={26}>
              同じπの幅から一つ選ぶ
            </CinemaLabel>
          )}
        </g>
      )}
    </g>
  );
}

function ProbabilityFormula({
  mobile,
  representative,
  numerator,
  denominator,
  trace,
  sum,
  selecting,
}: {
  mobile: boolean;
  representative: number;
  numerator: number;
  denominator: number;
  trace: GenerationTrace;
  sum: number;
  selecting: boolean;
}) {
  return (
    <g data-cinema-probability-formula>
      <CinemaLabel
        x={mobile ? 300 : 270}
        y={mobile ? 480 : 515}
        size={mobile ? 25 : 28}
      >
        ID {representative}：{cinemaNumber(numerator)} /{" "}
        {cinemaNumber(denominator)} ≈{" "}
        {cinemaNumber(requiredValue(trace.probabilities, representative))}
      </CinemaLabel>
      <CinemaLabel
        x={mobile ? 300 : 1200}
        y={mobile ? 515 : 505}
        size={mobile ? 25 : 28}
      >
        Σa = {cinemaNumber(denominator)} ／ Σπ = {sum.toFixed(3)}
      </CinemaLabel>
      <CinemaLabel x={mobile ? 300 : 200} y={mobile ? 697 : 565} size={24}>
        aᵢ = exp((zᵢ − max z) / T)
      </CinemaLabel>
      <CinemaLabel
        x={mobile ? 300 : 200}
        y={mobile ? (selecting ? 835 : 735) : 610}
        size={24}
      >
        T = {cinemaNumber(trace.temperature)} ／ πᵢ = aᵢ / Σa
      </CinemaLabel>
    </g>
  );
}

export function CinemaProbabilities(props: CinemaSceneProps) {
  return (
    <g data-cinema-special={props.frame.kind}>
      <ProbabilityRows {...props} />
      <ProbabilityIntervals {...props} />
    </g>
  );
}

function IdTile({
  x,
  y,
  id,
  active = false,
  width = 134,
}: {
  x: number;
  y: number;
  id: number;
  active?: boolean;
  width?: number;
}) {
  return (
    <g transform={`translate(${svgNumber(x)} ${svgNumber(y)})`}>
      <rect
        x={svgNumber(-width / 2)}
        y="-33"
        width={svgNumber(width)}
        height="66"
        rx="12"
        strokeWidth="3"
        className={
          active
            ? "fill-primary/10 stroke-primary"
            : "fill-background stroke-border"
        }
      />
      <CinemaLabel x={0} y={11} size={32} active={active}>
        ID {id}
      </CinemaLabel>
    </g>
  );
}

function VocabularyLookup({
  selection,
  mobile,
  progress,
}: Pick<CinemaSceneProps, "selection" | "mobile"> & { progress: number }) {
  const x = mobile ? 300 : 575;
  const top = mobile ? 170 : 135;
  const step = mobile ? 34 : 49;
  return (
    <g data-cinema-vocabulary>
      <CinemaLabel x={x} y={top - 45} size={mobile ? 27 : 32}>
        同じ語彙表を引く
      </CinemaLabel>
      {FLOW_VOCABULARY.map((entry) => {
        const y = top + entry.id * step;
        const active = entry.id === selection.id && progress > 0.45;
        return (
          <g
            key={entry.id}
            data-vocabulary-id={entry.id}
            data-lookup-active={active ? "true" : "false"}
          >
            <rect
              x={svgNumber(x - 135)}
              y={svgNumber(y - step / 2 + 1)}
              width="270"
              height={svgNumber(step - 2)}
              rx="5"
              strokeWidth={active ? "3" : "1"}
              className={
                active
                  ? "fill-primary/15 stroke-primary"
                  : "fill-muted/20 stroke-border"
              }
            />
            <CinemaLabel
              x={x - 72}
              y={y + 8}
              size={mobile ? 24 : 28}
              active={active}
            >
              ID {entry.id}
            </CinemaLabel>
            <CinemaLabel
              x={x + 52}
              y={y + 8}
              size={mobile ? 24 : 28}
              active={active}
            >
              {entry.isEnd ? "〈終了〉" : entry.piece}
            </CinemaLabel>
          </g>
        );
      })}
    </g>
  );
}

function pathPoint(
  points: readonly (readonly [number, number])[],
  progress: number
) {
  const [first] = points;
  const last = points.at(-1);
  if (!(first && last)) {
    throw new Error("データを移動させる経路がありません。");
  }
  const lengths = points.slice(1).map(([x, y], index) => {
    const previous = points[index] ?? first;
    return Math.hypot(x - previous[0], y - previous[1]);
  });
  let remaining =
    lengths.reduce((total, length) => total + length, 0) *
    cinemaClamp(progress);
  for (const [index, length] of lengths.entries()) {
    const start = points[index] ?? first;
    const end = points[index + 1] ?? last;
    if (remaining <= length && length > 0) {
      const fraction = remaining / length;
      return {
        x: start[0] + (end[0] - start[0]) * fraction,
        y: start[1] + (end[1] - start[1]) * fraction,
      };
    }
    remaining -= length;
  }
  return { x: last[0], y: last[1] };
}

function LookupFlight({
  selection,
  mobile,
  progress,
}: Pick<CinemaSceneProps, "selection" | "mobile"> & { progress: number }) {
  if (progress >= 0.75) {
    return null;
  }
  const rowY = (mobile ? 170 : 135) + selection.id * (mobile ? 34 : 49);
  const integer = progress < 0.5;
  const idPoints = mobile
    ? ([
        [300, 56],
        [480, 56],
        [480, rowY],
        [228, rowY],
      ] as const)
    : ([
        [150, 285],
        [350, 285],
        [350, rowY],
        [503, rowY],
      ] as const);
  const wordPoints = mobile
    ? ([
        [352, rowY],
        [540, rowY],
        [540, 480],
        [300, 480],
        [300, 545],
      ] as const)
    : ([
        [627, rowY],
        [790, rowY],
        [790, 165],
        [1115, 165],
      ] as const);
  const point = pathPoint(
    integer ? idPoints : wordPoints,
    integer ? progress / 0.5 : (progress - 0.5) / 0.25
  );
  const opacity = integer
    ? ease(progress / 0.05) * (1 - ease((progress - 0.43) / 0.07))
    : ease((progress - 0.5) / 0.05) * (1 - ease((progress - 0.69) / 0.06));
  return (
    <g data-cinema-lookup-flight opacity={svgNumber(opacity)}>
      {integer ? (
        <IdTile x={point.x} y={point.y} id={selection.id} active />
      ) : (
        <g transform={`translate(${svgNumber(point.x)} ${svgNumber(point.y)})`}>
          <rect
            x="-65"
            y="-30"
            width="130"
            height="60"
            rx="10"
            className="fill-background stroke-primary"
            strokeWidth="3"
          />
          <CinemaLabel x={0} y={11} size={32} active>
            {selection.isEnd ? "終了" : selection.piece}
          </CinemaLabel>
        </g>
      )}
    </g>
  );
}

export function CinemaDecode({
  trace,
  selection,
  frame,
  mobile,
  marker,
}: CinemaSceneProps) {
  const returning = frame.stage === "return";
  const progress = ease(frame.operationProgress);
  const lookup = returning ? 1 : progress;
  const ready = returning || progress >= 0.75;
  const oldText = decodeFlow(trace.ids);
  const nextIds = selection.isEnd ? trace.ids : [...trace.ids, selection.id];
  const text = ready && !selection.isEnd ? decodeFlow(nextIds) : oldText;
  const { kept, finalX, nextY, source, lookupY, firstX, gap } = decodeLayout(
    mobile,
    selection,
    nextIds
  );
  const flight = returning && !selection.isEnd ? progress : 0;
  const flightPoint = pathPoint(
    [
      [kept.x, kept.y],
      [finalX, kept.y],
      [finalX, nextY],
    ],
    flight
  );
  return (
    <g data-cinema-special={frame.stage}>
      <IdTile x={source.x} y={source.y} id={selection.id} active />
      <CinemaArrow
        path={
          mobile
            ? `M367 56 H480 V${svgNumber(lookupY)} H442`
            : `M217 285 H350 V${svgNumber(lookupY)} H432`
        }
        marker={marker}
      />
      <VocabularyLookup
        selection={selection}
        mobile={mobile}
        progress={lookup}
      />
      <CinemaArrow
        path={
          mobile
            ? `M435 ${svgNumber(lookupY)} H540 V480 H300 V495`
            : `M710 ${svgNumber(lookupY)} H790 V165 H850`
        }
        marker={marker}
      />
      <DecodedText
        mobile={mobile}
        ready={ready}
        selection={selection}
        text={text}
      />
      <CinemaArrow
        path={mobile ? "M233 56 H45 V665 H226" : "M150 322 V585 H1060 V425"}
        marker={marker}
        secondary
      />
      <CinemaLabel
        x={mobile ? 300 : 620}
        y={mobile ? 625 : 620}
        size={mobile ? 24 : 29}
      >
        同じ整数IDを保持
      </CinemaLabel>
      <IdTile x={kept.x} y={kept.y} id={selection.id} active />
      {returning && !selection.isEnd && (
        <DecodeNextInput
          kept={kept}
          finalX={finalX}
          nextY={nextY}
          marker={marker}
          mobile={mobile}
          nextIds={nextIds}
          progress={progress}
          firstX={firstX}
          gap={gap}
          flight={flight}
          selection={selection}
          flightPoint={flightPoint}
        />
      )}
      {selection.isEnd && ready && (
        <CinemaLabel
          x={mobile ? 300 : 1110}
          y={mobile ? 790 : 540}
          size={30}
          active
        >
          生成終了
        </CinemaLabel>
      )}
      {!returning && (
        <LookupFlight
          selection={selection}
          mobile={mobile}
          progress={progress}
        />
      )}
    </g>
  );
}

function decodeLayout(
  mobile: boolean,
  selection: GenerationSelection,
  nextIds: readonly number[]
) {
  const source = { x: mobile ? 300 : 150, y: mobile ? 56 : 285 };
  const lookupY = (mobile ? 170 : 135) + selection.id * (mobile ? 34 : 49);
  const kept = { x: mobile ? 300 : 1060, y: mobile ? 665 : 385 };
  const nextY = mobile ? 785 : 535;
  const gap = mobile ? 138 : 120;
  const firstX = (mobile ? 300 : 1110) - ((nextIds.length - 1) * gap) / 2;
  const finalX = firstX + (nextIds.length - 1) * gap;
  return { kept, finalX, nextY, source, lookupY, firstX, gap };
}

function DecodedText({
  mobile,
  ready,
  selection,
  text,
}: {
  mobile: boolean;
  ready: boolean;
  selection: GenerationSelection;
  text: string;
}) {
  return (
    <g data-cinema-decoded-text>
      <rect
        x={mobile ? "100" : "865"}
        y={mobile ? "505" : "120"}
        width={mobile ? "400" : "500"}
        height={mobile ? "82" : "110"}
        rx="14"
        className="fill-muted/30 stroke-border"
        strokeWidth="2"
      />
      <CinemaLabel
        x={mobile ? 300 : 1115}
        y={mobile ? 528 : 95}
        size={mobile ? 25 : 30}
      >
        表示する文字列
      </CinemaLabel>
      <CinemaLabel
        x={mobile ? 300 : 1115}
        y={mobile ? 566 : 190}
        size={mobile ? 35 : 46}
        active={ready}
      >
        {selection.isEnd && ready ? "終了：表示文字なし" : `「${text}」`}
      </CinemaLabel>
    </g>
  );
}

function DecodeNextInput({
  kept,
  finalX,
  nextY,
  marker,
  mobile,
  nextIds,
  progress,
  firstX,
  gap,
  flight,
  selection,
  flightPoint,
}: {
  kept: { x: number; y: number };
  finalX: number;
  nextY: number;
  marker: string;
  mobile: boolean;
  nextIds: readonly number[];
  progress: number;
  firstX: number;
  gap: number;
  flight: number;
  selection: GenerationSelection;
  flightPoint: { x: number; y: number };
}) {
  return (
    <g data-cinema-next-input>
      <CinemaArrow
        path={`M${svgNumber(kept.x + 67)} ${svgNumber(kept.y)} H${svgNumber(finalX)} V${svgNumber(nextY - 40)}`}
        marker={marker}
      />
      <CinemaLabel
        x={mobile ? 300 : 1110}
        y={mobile ? 729 : 480}
        size={mobile ? 26 : 28}
      >
        次の予測に渡すID列
      </CinemaLabel>
      {nextIds.map((id, index) => (
        <g
          key={`${index}-${id}`}
          opacity={index === nextIds.length - 1 && progress < 0.95 ? "0" : "1"}
        >
          <IdTile
            x={firstX + index * gap}
            y={nextY}
            id={id}
            active={index === nextIds.length - 1}
            width={mobile ? 124 : 108}
          />
        </g>
      ))}
      {flight > 0 && flight < 1 && (
        <g data-cinema-returning-id data-returning-integer={selection.id}>
          <circle
            cx={svgNumber(flightPoint.x)}
            cy={svgNumber(flightPoint.y)}
            r="10"
            strokeWidth="3"
            className="fill-primary stroke-background"
          />
        </g>
      )}
      <CinemaLabel x={mobile ? 300 : 1110} y={mobile ? 844 : 620} size={24}>
        このID列での再計算は次の一巡
      </CinemaLabel>
    </g>
  );
}
