import { svgNumber } from "./svg-number";

export type Point3 = readonly [number, number, number];

export type StructureNode = {
  id: string;
  label: string;
  shape: string;
  description: string;
  part: "A" | "B" | "C";
  center: Point3;
  size: Point3;
  kind: "tensor" | "sum";
  layerRange?: readonly [number, number];
};

type StructureEdge = {
  id: string;
  from: string;
  to: string;
  points: readonly Point3[];
  residual?: boolean;
};

export type StructureView = "overview" | "block";

type StructureScene = {
  nodes: readonly StructureNode[];
  edges: readonly StructureEdge[];
  description: string;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
};

type PrismFace = {
  key: "top" | "front" | "left" | "right";
  points: string;
  depth: number;
};

const TENSOR_SIZE: Point3 = [220, 12, 80];
const SUM_SIZE: Point3 = [28, 28, 28];
const DEGREES_TO_RADIANS = Math.PI / 180;

const overviewNodes: readonly StructureNode[] = [
  {
    id: "tokens",
    label: "トークン ID",
    shape: "n",
    description: "入力をトークン ID の列にする。n は現在の文脈の長さ。",
    part: "A",
    center: [0, -340, 0],
    size: [220, 12, 24],
    kind: "tensor",
  },
  {
    id: "embedding",
    label: "トークン埋め込み ＋ 位置埋め込み",
    shape: "n × d",
    description:
      "ID に対応するベクトルと学習済み位置埋め込みを足す。GPT-3 175B では d = 12,288。",
    part: "A",
    center: [0, -255, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "block-1",
    label: "ブロック 1",
    shape: "n × d",
    description: "最初の Pre-LN Transformer ブロックで文脈表現を更新する。",
    part: "B",
    center: [0, -170, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
    layerRange: [1, 1],
  },
  {
    id: "blocks-2-95",
    label: "ブロック 2–95（94 層を省略）",
    shape: "n × d",
    description:
      "94 層を図では 1 段に省略している。各層は別々の重みを持ち、同じ重みを使い回すわけではない。",
    part: "B",
    center: [0, -85, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
    layerRange: [2, 95],
  },
  {
    id: "block-96",
    label: "ブロック 96",
    shape: "n × d",
    description:
      "最後の Transformer ブロック。全 96 層で系列長 n と幅 d を保つ。",
    part: "B",
    center: [0, 0, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
    layerRange: [96, 96],
  },
  {
    id: "final-ln",
    label: "最終 LayerNorm",
    shape: "n × d",
    description: "すべてのブロックを通った表現を、位置ごとに正規化する。",
    part: "C",
    center: [0, 85, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "last-position",
    label: "最後の位置を取り出す",
    shape: "d",
    description:
      "次の 1 トークンを生成するため、現在の最後の位置のベクトルを選ぶ。学習時は通常、各位置で次トークンを予測する。",
    part: "C",
    center: [0, 170, 0],
    size: [32, 12, 80],
    kind: "tensor",
  },
  {
    id: "lm-head",
    label: "語彙への線形射影（LM head）",
    shape: "|V|",
    description:
      "隠れた表現の d 成分から語彙ごとの logit に写す。ここから奥行きの軸は表現成分ではなく語彙 ID を表す。寸法は実寸比ではない。",
    part: "C",
    center: [0, 255, 0],
    size: [32, 12, 120],
    kind: "tensor",
  },
  {
    id: "softmax",
    label: "softmax → 次トークンの分布",
    shape: "|V|",
    description:
      "logit を語彙上の確率分布に変換する。その分布に基づいて次のトークンを選ぶ。",
    part: "C",
    center: [0, 340, 0],
    size: [32, 12, 120],
    kind: "tensor",
  },
];

const blockNodes: readonly StructureNode[] = [
  {
    id: "hidden",
    label: "ブロックへの入力 h",
    shape: "n × d",
    description:
      "直前のブロックの出力、または埋め込みを残差ストリームとして受け取る。",
    part: "B",
    center: [0, -330, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "ln-1",
    label: "LayerNorm 1",
    shape: "n × d",
    description:
      "Attention に入る分岐だけを正規化する。残差の直通経路は通過しない。",
    part: "B",
    center: [0, -240, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "attention",
    label: "因果 Multi-Head Attention",
    shape: "n × d",
    description:
      "96 個のヘッド（各 128 成分）で参照して結合し、出力射影 Wₒ を通す。GPT-3 は層により dense または疎な因果 Attention を使う。",
    part: "B",
    center: [0, -145, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "add-1",
    label: "残差加算 1 → u",
    shape: "n × d",
    description: "元の h と Attention の出力を、同じ位置・同じ成分ごとに足す。",
    part: "B",
    center: [0, -50, 0],
    size: SUM_SIZE,
    kind: "sum",
  },
  {
    id: "ln-2",
    label: "LayerNorm 2",
    shape: "n × d",
    description: "1 回目の加算結果から MLP に入る分岐だけを正規化する。",
    part: "B",
    center: [0, 45, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "mlp",
    label: "位置ごとの MLP",
    shape: "n × d → n × 4d → n × d",
    description:
      "各位置に同じ重みを使い、d → 4d の線形変換、GELU、4d → d の線形変換を行う。GPT-3 175B では 12,288 → 49,152 → 12,288。位置どうしは混ぜない。",
    part: "B",
    center: [0, 140, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
  {
    id: "add-2",
    label: "残差加算 2 → h′",
    shape: "n × d",
    description: "1 回目の加算結果と MLP の出力を、同じ形状のまま足す。",
    part: "B",
    center: [0, 235, 0],
    size: SUM_SIZE,
    kind: "sum",
  },
  {
    id: "output",
    label: "次のブロックへの出力 h′",
    shape: "n × d",
    description:
      "残差ストリームを次のブロックへ渡す。最後のブロックの後には最終 LayerNorm がある。",
    part: "B",
    center: [0, 330, 0],
    size: TENSOR_SIZE,
    kind: "tensor",
  },
];

function sequentialEdges(nodes: readonly StructureNode[]): StructureEdge[] {
  return nodes.slice(1).map((target, index) => {
    const source = nodes[index];
    if (!source) {
      throw new Error("構造図の接続元が見つかりません。");
    }
    // 加算記号はスクリーン上の円で描くため、矢尻が隠れない間隔を取る。
    const sourceMargin = source.kind === "sum" ? 22 : source.size[1] / 2;
    const targetMargin = target.kind === "sum" ? 22 : target.size[1] / 2;
    return {
      id: `${source.id}-to-${target.id}`,
      from: source.id,
      to: target.id,
      points: [
        [source.center[0], source.center[1] + sourceMargin, 0],
        [target.center[0], target.center[1] - targetMargin, 0],
      ],
    };
  });
}

export const STRUCTURE_SCENES: Record<StructureView, StructureScene> = {
  overview: {
    nodes: overviewNodes,
    edges: sequentialEdges(overviewNodes),
    description:
      "GPT-3 175B の次トークン生成を表す。横方向は系列の位置、奥行きは各位置の表現成分。下方向は計算の順序であり、テンソルの軸ではない。語彙への射影後は奥行きが語彙軸に変わる。幅・奥行き・段間隔は模式的で、パラメーター数や計算量の比率を表さない。",
  },
  block: {
    nodes: blockNodes,
    edges: [
      ...sequentialEdges(blockNodes),
      {
        id: "attention-residual",
        from: "hidden",
        to: "add-1",
        residual: true,
        points: [
          [-110, -330, 0],
          [-195, -330, 0],
          [-195, -50, 0],
          [-26, -50, 0],
        ],
      },
      {
        id: "mlp-residual",
        from: "add-1",
        to: "add-2",
        residual: true,
        points: [
          [0, -28, 0],
          [-195, -28, 0],
          [-195, 235, 0],
          [-26, 235, 0],
        ],
      },
    ],
    description:
      "1 個の Pre-LN Transformer ブロック。LayerNorm → Attention と LayerNorm → MLP の各分岐に、正規化を通らない残差の直通経路がある。円内の加算記号は演算を表し、テンソルの形状を意味しない。バッチ軸とバイアスは省略している。",
  },
};

/** 世界座標を正射影する。depth が大きい面ほどカメラに近い。 */
export function projectPoint(
  [x, y, z]: Point3,
  yaw: number,
  pitch: number
): ProjectedPoint {
  const yawRadians = yaw * DEGREES_TO_RADIANS;
  const pitchRadians = pitch * DEGREES_TO_RADIANS;
  const rotatedX = x * Math.cos(yawRadians) + z * Math.sin(yawRadians);
  const rotatedZ = -x * Math.sin(yawRadians) + z * Math.cos(yawRadians);
  return {
    x: 290 + rotatedX,
    y: 410 + y * Math.cos(pitchRadians) + rotatedZ * Math.sin(pitchRadians),
    depth: -y * Math.sin(pitchRadians) + rotatedZ * Math.cos(pitchRadians),
  };
}

/** 指定した視点から見える直方体の面を、奥から手前の順で返す。 */
export function prismFaces(
  node: StructureNode,
  yaw: number,
  pitch: number
): PrismFace[] {
  const vertex = (dx: number, dy: number, dz: number): Point3 => [
    node.center[0] + (node.size[0] * dx) / 2,
    node.center[1] + (node.size[1] * dy) / 2,
    node.center[2] + (node.size[2] * dz) / 2,
  ];
  const faces: { key: PrismFace["key"]; vertices: readonly Point3[] }[] = [
    {
      key: "top",
      vertices: [
        vertex(-1, -1, -1),
        vertex(1, -1, -1),
        vertex(1, -1, 1),
        vertex(-1, -1, 1),
      ],
    },
    {
      key: "front",
      vertices: [
        vertex(-1, -1, 1),
        vertex(1, -1, 1),
        vertex(1, 1, 1),
        vertex(-1, 1, 1),
      ],
    },
  ];
  if (yaw !== 0) {
    const side = yaw > 0 ? -1 : 1;
    faces.push({
      key: yaw > 0 ? "left" : "right",
      vertices: [
        vertex(side, -1, -1),
        vertex(side, -1, 1),
        vertex(side, 1, 1),
        vertex(side, 1, -1),
      ],
    });
  }
  return faces
    .map(({ key, vertices }) => {
      const projected = vertices.map((point) =>
        projectPoint(point, yaw, pitch)
      );
      return {
        key,
        points: projected
          .map(({ x, y }) => `${svgNumber(x)},${svgNumber(y)}`)
          .join(" "),
        depth: projected.reduce((sum, point) => sum + point.depth, 0) / 4,
      };
    })
    .toSorted((first, second) => first.depth - second.depth);
}
