export type Pair = readonly [number, number];
type EmbeddingVector = readonly [number, number, number, number];

// トークン分割・ID・数値は仕組みの説明用であり、実在モデルの重みではない。
export const EMBEDDING_TABLE = [
  { id: 0, token: "太郎は", vector: [0.7, -0.4, 0.2, 0.5] },
  { id: 1, token: "花子に", vector: [-0.3, 0.8, 0.4, -0.2] },
  { id: 2, token: "ノートを", vector: [0.5, 0.2, -0.6, 0.9] },
  { id: 3, token: "借りた。", vector: [-0.6, 0.3, 0.8, 0.1] },
  { id: 4, token: "あした、", vector: [0.2, -0.7, 0.5, -0.4] },
] as const;

export const EMBEDDING_TOKEN_IDS = [0, 1, 2, 3, 4, 2] as const;

const POSITION_VECTORS: readonly EmbeddingVector[] = [
  [0.1, 0.2, -0.1, 0.3],
  [0.3, -0.1, 0.2, 0.1],
  [-0.2, 0.4, 0.1, -0.3],
  [0.4, 0.1, -0.3, 0.2],
  [-0.1, -0.3, 0.4, 0.2],
  [0.3, -0.2, -0.4, 0.1],
];

export function embeddingAt(position: number) {
  const tokenId = EMBEDDING_TOKEN_IDS[position];
  const positional = POSITION_VECTORS[position];
  if (tokenId === undefined || positional === undefined) {
    throw new Error("位置は説明用トークン列の範囲内で指定する必要がある");
  }
  const entry = EMBEDDING_TABLE[tokenId];
  return {
    ...entry,
    positional,
    hidden: entry.vector.map(
      (value, index) => value + (positional[index] ?? 0)
    ),
  };
}

// a は列ベクトル。W1 は 8×2、W2 は 2×8。
export const MLP_W1: readonly Pair[] = [
  [1, 0.5],
  [-1, 0.5],
  [0.5, -1],
  [-0.5, -1],
  [0.8, 0.4],
  [-0.8, 0.4],
  [0.4, -0.8],
  [-0.4, -0.8],
];
export const MLP_B1 = [0, 0.2, -0.2, 0.1, -0.1, 0.3, 0.2, -0.3] as const;
export const MLP_W2 = [
  [0.7, -0.6, 0.4, -0.3, 0.5, -0.4, 0.3, -0.2],
  [-0.4, 0.5, 0.6, -0.5, 0.3, -0.2, -0.6, 0.4],
] as const;
export const MLP_B2: Pair = [0.1, -0.1];

/** GPT-2 の実装と同じ tanh による GELU の近似式。 */
export function approximateGelu(value: number): number {
  return (
    0.5 *
    value *
    (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (value + 0.044715 * value ** 3)))
  );
}

export function evaluateMlp(input: Pair, nonlinear = true) {
  const preactivation = MLP_B1.map(
    (bias, index) =>
      (MLP_W1[index]?.[0] ?? 0) * input[0] +
      (MLP_W1[index]?.[1] ?? 0) * input[1] +
      bias
  );
  const activated = nonlinear
    ? preactivation.map(approximateGelu)
    : preactivation;
  const output = MLP_B2.map((bias, dimension) =>
    activated.reduce(
      (sum, value, index) => sum + (MLP_W2[dimension]?.[index] ?? 0) * value,
      bias
    )
  );
  return { preactivation, activated, output };
}
