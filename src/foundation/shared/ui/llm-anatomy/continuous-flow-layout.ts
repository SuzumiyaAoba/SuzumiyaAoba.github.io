import { cinemaClamp, cinemaPathPoint } from "./cinema-operation-math";
import type {
  ContinuousConnection,
  ContinuousFlow,
  ContinuousNodeId,
  ContinuousOperation,
} from "./continuous-flow-model";
import { continuousWindowProgress } from "./continuous-flow-model";

export type FlowPoint = readonly [number, number];
export type FlowLayout = {
  width: number;
  height: number;
  stepX: number;
  stepY: number;
  mobile: boolean;
};
export type FlowCamera = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const GRID: Record<ContinuousNodeId, FlowPoint> = {
  tokenize: [0, 0],
  "embedding-lookup": [1, 0],
  "embedding-add": [2, 0],
  ln1: [3, 0],
  "qkv-query": [4, -1],
  "qkv-key": [4, 0],
  "qkv-value": [4, 1],
  "score-mask-score": [5, -0.5],
  "score-mask-mask": [6, -0.5],
  "head-2-preparation": [6, 1],
  "weighted-head-1": [7, -0.5],
  "weighted-head-2": [7, 1],
  "attention-output": [8, 0],
  residual1: [9, 0],
  ln2: [10, 0],
  expand: [11, 0],
  gelu: [12, 0],
  contract: [13, 0],
  residual2: [14, 0],
  finalnorm: [15, 0],
  logits: [16, 0],
  softmax: [17, 0],
  select: [18, 0],
  decode: [19, -0.6],
  return: [19, 0.6],
};

export function continuousLayout(mobile: boolean): FlowLayout {
  return mobile
    ? { width: 600, height: 850, stepX: 900, stepY: 1150, mobile }
    : { width: 1440, height: 650, stepX: 1900, stepY: 950, mobile };
}

export function continuousNodePosition(
  id: ContinuousNodeId,
  layout: FlowLayout
) {
  const [column, row] = GRID[id];
  return { x: column * layout.stepX, y: row * layout.stepY };
}

function focus(id: ContinuousNodeId, layout: FlowLayout): FlowPoint {
  const point = continuousNodePosition(id, layout);
  return [
    point.x + layout.width / 2 - (layout.mobile ? 90 : 100),
    point.y + layout.height / 2 - 10,
  ];
}

/** 同一ワールドのカメラを動かす。境界でも位置・倍率をリセットしない。 */
export function continuousCamera(
  flow: ContinuousFlow,
  elapsed: number,
  layout: FlowLayout,
  aspect: number
): FlowCamera {
  const ratio = Math.max(0.4, aspect);
  const normalHeight = layout.mobile ? 1020 : 840;
  const [first] = flow.operations;
  if (!first) {
    throw new Error("追従する計算器がありません。");
  }
  let center = focus(first.id, layout);
  const baseHeight = Math.max(
    normalHeight,
    (layout.width + (layout.mobile ? 300 : 600)) / ratio
  );
  let height = baseHeight;
  for (let index = 0; index < flow.operations.length - 1; index += 1) {
    const source = flow.operations[index];
    const target = flow.operations[index + 1];
    if (!(source && target)) {
      continue;
    }
    const start = source.start + source.duration * 0.72;
    const end = target.start + target.duration * 0.12;
    if (elapsed < start) {
      break;
    }
    const from = focus(source.id, layout);
    const to = focus(target.id, layout);
    const progress = continuousWindowProgress(elapsed, start, end);
    center = [
      from[0] + (to[0] - from[0]) * progress,
      from[1] + (to[1] - from[1]) * progress,
    ];
    const peak = Math.max(
      height,
      (Math.abs(to[0] - from[0]) + layout.width + 300) / ratio,
      Math.abs(to[1] - from[1]) + layout.height + 260
    );
    height =
      baseHeight + (peak - baseHeight) * Math.sin(Math.PI * progress) ** 2;
    if (elapsed < end) {
      break;
    }
  }
  return {
    x: center[0] - (height * ratio) / 2,
    y: center[1] - height / 2,
    width: height * ratio,
    height,
  };
}

export function continuousCalculationProgress(
  operation: ContinuousOperation,
  elapsed: number
): number {
  return cinemaClamp(
    (elapsed - operation.start - operation.duration * 0.12) /
      (operation.duration * 0.6)
  );
}

/** 数値の出入口を結ぶ。迂回枝は計算器の外周を通る。 */
export function continuousInputOffset(
  flow: ContinuousFlow,
  connection: ContinuousConnection,
  layout: FlowLayout
): number {
  const inputs = flow.connections.filter(
    (edge) =>
      edge.to === connection.to && edge.enabled && edge.kind !== "feedback"
  );
  const index = inputs.findIndex((edge) => edge.id === connection.id);
  return index === -1
    ? 0
    : (index - (inputs.length - 1) / 2) * (layout.mobile ? 190 : 180);
}

export function continuousConnectionPath(
  connection: ContinuousConnection,
  layout: FlowLayout,
  inputOffset = 0
): readonly FlowPoint[] {
  const source = continuousNodePosition(connection.from, layout);
  const target = continuousNodePosition(connection.to, layout);
  const from: FlowPoint = [
    source.x + layout.width,
    source.y + layout.height / 2,
  ];
  const to: FlowPoint = [
    target.x - (layout.mobile ? 230 : 350),
    target.y + layout.height / 2 + inputOffset,
  ];
  if (connection.kind === "feedback") {
    const rail = -layout.stepY * 1.8;
    return [
      from,
      [from[0] + 150, from[1]],
      [from[0] + 150, rail],
      [to[0] - 100, rail],
      [to[0] - 100, to[1]],
      to,
    ];
  }
  if (connection.kind === "residual" || connection.kind === "retained-id") {
    const rail =
      Math.max(
        source.y,
        target.y,
        connection.from === "embedding-add" || connection.from === "tokenize"
          ? layout.stepY
          : 0
      ) +
      layout.height +
      (connection.kind === "residual" ? 180 : 380);
    return [
      from,
      [from[0] + 100, from[1]],
      [from[0] + 100, rail],
      [to[0] - 80, rail],
      [to[0] - 80, to[1]],
      to,
    ];
  }
  if (connection.from === "qkv-value" && connection.to === "weighted-head-1") {
    const rail = source.y + layout.height + 180;
    return [
      from,
      [from[0] + 65, from[1]],
      [from[0] + 65, rail],
      [to[0] - 80, rail],
      [to[0] - 80, to[1]],
      to,
    ];
  }
  const middle = (from[0] + to[0]) / 2;
  return [from, [middle, from[1]], [middle, to[1]], to];
}

export function continuousPacketPoint(
  connection: ContinuousConnection,
  layout: FlowLayout,
  progress: number,
  inputOffset = 0
) {
  return cinemaPathPoint(
    continuousConnectionPath(connection, layout, inputOffset),
    progress
  );
}
