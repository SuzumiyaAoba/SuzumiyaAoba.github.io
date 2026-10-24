/** -Infinity は参照禁止の候補を表す。最大値を引いて指数計算を安定させる。 */
export function softmax(scores: readonly number[], temperature = 1): number[] {
  if (!Number.isFinite(temperature) || temperature <= 0) {
    throw new Error("温度には有限の正の数を指定してください。");
  }
  if (
    scores.length === 0 ||
    scores.some((score) => Number.isNaN(score) || score === Infinity)
  ) {
    throw new Error("点数には数値を一つ以上指定してください。");
  }
  const maximum = Math.max(...scores);
  if (maximum === -Infinity) {
    throw new Error("参照できる候補が一つ以上必要です。");
  }
  const weights = scores.map((score) =>
    Math.exp((score - maximum) / temperature)
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

/** [0, 1) のくじを、確率で区切った半開区間に割り当てる。 */
export function sampleIndex(
  probabilities: readonly number[],
  draw: number
): number {
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) {
    throw new Error("くじの位置は0以上1未満にしてください。");
  }
  let cumulative = 0;
  for (const [index, probability] of probabilities.entries()) {
    cumulative += probability;
    if (draw < cumulative) {
      return index;
    }
  }
  // softmax の総和が浮動小数点の丸めでわずかに1を下回る場合への対処。
  return probabilities.findLastIndex((probability) => probability > 0);
}
