import type { StoryStage } from "./generation-story-timeline";
import { svgNumber } from "./svg-number";

export type RouteNodeId = StoryStage | "final-norm";
export type RoutePoint = { x: number; y: number };
type Waypoint = readonly [number, number];

export type RouteNode = {
  id: RouteNodeId;
  label: string;
  shape: string;
  center: Waypoint;
  width: number;
  height: number;
  part: "A" | "B" | "C";
};

export type RouteEdge = {
  id: string;
  from: RouteNodeId;
  to: RouteNodeId;
  path: string;
  waypoints: readonly Waypoint[];
  kind: "main" | "residual" | "loop";
  label?: string;
};

export type RouteFrame = {
  activeNodeId: RouteNodeId;
  activeEdgeId: string | null;
  edgeProgress: number;
  settledIds: readonly RouteNodeId[];
  packet: RoutePoint;
};

// 同じ場所に同じ演算を置き続け、前段の出力が次段へ届く様子を追えるようにする。
export const ROUTE_NODES: readonly RouteNode[] = [
  {
    id: "input",
    label: "入力をIDへ",
    shape: "n個のID",
    center: [120, 70],
    width: 200,
    height: 110,
    part: "A",
  },
  {
    id: "embedding",
    label: "埋め込み",
    shape: "n × 4",
    center: [400, 70],
    width: 200,
    height: 110,
    part: "A",
  },
  {
    id: "attention",
    label: "LN₁→Attention",
    shape: "n × 4 → n × 4",
    center: [680, 70],
    width: 200,
    height: 110,
    part: "B",
  },
  {
    id: "attention-add",
    label: "残差加算①",
    shape: "u = h⁰ + a",
    center: [680, 210],
    width: 200,
    height: 110,
    part: "B",
  },
  {
    id: "mlp",
    label: "LN₂ → MLP",
    shape: "4 → 16 → 4 ／ 各位置",
    center: [400, 210],
    width: 200,
    height: 110,
    part: "B",
  },
  {
    id: "mlp-add",
    label: "残差加算②",
    shape: "h′ = u + m",
    center: [120, 210],
    width: 200,
    height: 110,
    part: "B",
  },
  {
    id: "final-norm",
    label: "最終LN",
    shape: "末尾位置の4成分",
    center: [120, 350],
    width: 200,
    height: 110,
    part: "C",
  },
  {
    id: "output",
    label: "語彙スコア",
    shape: "4成分 → 8スコア",
    center: [400, 350],
    width: 200,
    height: 110,
    part: "C",
  },
  {
    id: "probabilities",
    label: "softmax",
    shape: "8スコア → 8確率",
    center: [680, 350],
    width: 200,
    height: 110,
    part: "C",
  },
  {
    id: "selection",
    label: "IDを選択",
    shape: "確率分布 → 1個のID",
    center: [680, 490],
    width: 200,
    height: 110,
    part: "C",
  },
  {
    id: "decode",
    label: "文字列へ復元",
    shape: "選択ID → トークン",
    center: [400, 490],
    width: 200,
    height: 110,
    part: "C",
  },
  {
    id: "return",
    label: "IDを追加",
    shape: "n個 → n + 1個のID",
    center: [120, 490],
    width: 200,
    height: 110,
    part: "C",
  },
];

export function routeNodeById(id: RouteNodeId): RouteNode {
  const node = ROUTE_NODES.find((candidate) => candidate.id === id);
  if (!node) {
    throw new Error(`生成経路にノード ${id} がありません。`);
  }
  return node;
}

function makeEdge(
  from: RouteNodeId,
  to: RouteNodeId,
  kind: RouteEdge["kind"],
  intermediate: readonly Waypoint[] = [],
  label?: string
): RouteEdge {
  const waypoints = [
    routeNodeById(from).center,
    ...intermediate,
    routeNodeById(to).center,
  ];
  return {
    id: `${from}-to-${to}`,
    from,
    to,
    kind,
    ...(label === undefined ? {} : { label }),
    waypoints,
    path: waypoints
      .map(
        ([x, y], index) =>
          `${index === 0 ? "M" : "L"}${svgNumber(x)} ${svgNumber(y)}`
      )
      .join(" "),
  };
}

const mainEdges = ROUTE_NODES.slice(0, -1).map((node, index) => {
  const next = ROUTE_NODES[index + 1];
  if (!next) {
    throw new Error("生成経路の次ノードがありません。");
  }
  return makeEdge(node.id, next.id, "main");
});

export const ROUTE_EDGES: readonly RouteEdge[] = [
  ...mainEdges,
  makeEdge(
    "embedding",
    "attention-add",
    "residual",
    [
      [400, 10],
      [790, 10],
      [790, 210],
    ],
    "h⁰をそのまま保持"
  ),
  makeEdge(
    "attention-add",
    "mlp-add",
    "residual",
    [
      [680, 280],
      [120, 280],
    ],
    "uをそのまま保持"
  ),
  makeEdge(
    "return",
    "input",
    "loop",
    [
      [10, 490],
      [10, 70],
    ],
    "追加したID列で次の予測へ"
  ),
];

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** SVGの折れ線と同じ経路を、区間の長さに比例した速度で進む。 */
export function pointOnRouteEdge(
  edge: RouteEdge,
  progress: number
): RoutePoint {
  const [first] = edge.waypoints;
  const last = edge.waypoints.at(-1);
  if (!first || !last) {
    throw new Error("生成経路には始点と終点が必要です。");
  }
  const t = clamp(progress);
  if (t === 0) {
    return { x: first[0], y: first[1] };
  }
  if (t === 1) {
    return { x: last[0], y: last[1] };
  }
  const distances = edge.waypoints.slice(1).map(([x, y], index) => {
    const previous = edge.waypoints[index] ?? first;
    return Math.hypot(x - previous[0], y - previous[1]);
  });
  let remaining =
    distances.reduce((total, distance) => total + distance, 0) * t;
  for (const [index, length] of distances.entries()) {
    const start = edge.waypoints[index] ?? first;
    const end = edge.waypoints[index + 1] ?? last;
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

function nodeFrame(id: RouteNodeId): RouteFrame {
  const nodeIndex = ROUTE_NODES.findIndex((node) => node.id === id);
  const [x, y] = routeNodeById(id).center;
  return {
    activeNodeId: id,
    activeEdgeId: null,
    edgeProgress: 0,
    settledIds: ROUTE_NODES.slice(0, nodeIndex).map((node) => node.id),
    packet: { x, y },
  };
}

function movingFrame(
  from: RouteNodeId,
  to: RouteNodeId,
  progress: number
): RouteFrame {
  const frame = nodeFrame(from);
  const edge = ROUTE_EDGES.find(
    (candidate) =>
      candidate.from === from &&
      candidate.to === to &&
      candidate.kind !== "residual"
  );
  if (!edge) {
    throw new Error(`生成経路に ${from} から ${to} への辺がありません。`);
  }
  const edgeProgress = clamp(progress);
  return {
    ...frame,
    activeEdgeId: edge.id,
    edgeProgress,
    settledIds: [...frame.settledIds, from],
    packet: pointOnRouteEdge(edge, edgeProgress),
  };
}

/** 各phaseの末尾は次phaseの始点と一致する。outputだけ2演算を順に通る。 */
export function routeFrame(stage: StoryStage, progress: number): RouteFrame {
  const t = clamp(progress);
  const processEnd = 0.55;
  if (stage === "output") {
    if (t < 0.25) {
      return nodeFrame("final-norm");
    }
    if (t < 0.5) {
      return movingFrame("final-norm", "output", (t - 0.25) / 0.25);
    }
    if (t < 0.7) {
      return nodeFrame("output");
    }
    return movingFrame("output", "probabilities", (t - 0.7) / 0.3);
  }
  if (t < processEnd) {
    return nodeFrame(stage);
  }
  if (stage === "return") {
    return movingFrame("return", "input", (t - processEnd) / (1 - processEnd));
  }
  const nodeIndex = ROUTE_NODES.findIndex((node) => node.id === stage);
  const next = ROUTE_NODES[nodeIndex + 1];
  if (!next) {
    throw new Error(`生成経路の ${stage} に次ノードがありません。`);
  }
  return movingFrame(stage, next.id, (t - processEnd) / (1 - processEnd));
}
