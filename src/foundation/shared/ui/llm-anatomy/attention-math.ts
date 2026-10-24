import { softmax } from "./probability";

export type AttentionVector = readonly [number, number];

export type AttentionToken = {
  id: string;
  label: string;
  query: AttentionVector;
  key: AttentionVector;
  value: AttentionVector;
};

// 1 ヘッドの計算を追うための説明用データ。学習済みモデルの実測値ではない。
export const ATTENTION_TOKENS = [
  {
    id: "t1",
    label: "太郎は",
    query: [1.4, 0.2],
    key: [0.8, -0.4],
    value: [1, 0.2],
  },
  {
    id: "t2",
    label: "花子に",
    query: [0.2, 1.4],
    key: [0.2, 1.2],
    value: [-0.6, 1.2],
  },
  {
    id: "t3",
    label: "ノートを",
    query: [1.2, 1],
    key: [1.4, 0.8],
    value: [1.4, -0.4],
  },
  {
    id: "t4",
    label: "借りた。",
    query: [1.8, -0.4],
    key: [1.8, -0.3],
    value: [0.4, 1.4],
  },
  {
    id: "t5",
    label: "あした、",
    query: [-0.2, 1.2],
    key: [-0.6, 1.1],
    value: [-1, 0.4],
  },
  {
    id: "t6",
    label: "ノートを",
    query: [1.4, 0.8],
    key: [1.2, 0.9],
    value: [0.8, -1],
  },
] as const satisfies readonly AttentionToken[];

export type AttentionRow = {
  query: AttentionVector;
  dotProducts: number[];
  scaledScores: number[];
  maskedScores: number[];
  weights: number[];
  contributions: AttentionVector[];
  output: AttentionVector;
};

export function dotProduct(
  left: AttentionVector,
  right: AttentionVector
): number {
  return left[0] * right[0] + left[1] * right[1];
}

/** 行ごとに softmax を適用する、2 次元の dense scaled dot-product attention。 */
export function calculateAttentionRow(
  tokens: readonly AttentionToken[],
  queryIndex: number,
  masked: boolean
): AttentionRow {
  const token = tokens[queryIndex];
  if (!token) {
    throw new Error("Query の位置は入力トークンの範囲内で指定してください。");
  }

  const { query } = token;
  const dotProducts = tokens.map(({ key }) => dotProduct(query, key));
  const scaledScores = dotProducts.map((score) => score / Math.sqrt(2));
  const maskedScores = scaledScores.map((score, index) =>
    masked && index > queryIndex ? -Infinity : score
  );
  const weights = softmax(maskedScores);
  const contributions: AttentionVector[] = tokens.map(({ value }, index) => {
    const weight = weights[index] ?? 0;
    return [weight * value[0], weight * value[1]];
  });
  let first = 0;
  let second = 0;
  for (const contribution of contributions) {
    first += contribution[0];
    second += contribution[1];
  }

  return {
    query,
    dotProducts,
    scaledScores,
    maskedScores,
    weights,
    contributions,
    output: [first, second],
  };
}

export function calculateAttentionMatrix(
  tokens: readonly AttentionToken[],
  masked: boolean
): AttentionRow[] {
  return tokens.map((_, index) => calculateAttentionRow(tokens, index, masked));
}
