import { decodeFlow, FLOW_DIMENSION } from "./generation-math";
import type {
  FlowMatrix,
  GenerationSelection,
  GenerationTrace,
} from "./generation-math";
import type { RouteNodeId } from "./generation-route";

export type GenerationPayload = {
  key: string;
  label: string;
  shape: string;
  summary: string;
  rows?: FlowMatrix;
  values?: readonly number[];
  ids?: readonly number[];
  selectedId?: number;
  piece?: string;
};

function vectorSummary(values: readonly number[]): string {
  return `[${values.map((value) => value.toFixed(2)).join(", ")}]`;
}

function matrixPayload(
  key: string,
  label: string,
  rows: FlowMatrix
): GenerationPayload {
  return {
    key,
    label,
    shape: `${rows.length} × ${FLOW_DIMENSION}`,
    summary: `末尾 ${vectorSummary(rows.at(-1) ?? [])}`,
    rows,
  };
}

/** 同じ辺を渡る値は同じオブジェクトを共有し、計算結果はtraceから参照する。 */
export function generationPayloads(
  trace: GenerationTrace,
  selection: GenerationSelection
): Record<
  RouteNodeId,
  { input: GenerationPayload; output: GenerationPayload }
> {
  const text: GenerationPayload = {
    key: "text",
    label: "入力文",
    shape: "文字列",
    summary: `「${decodeFlow(trace.ids)}」`,
  };
  const ids: GenerationPayload = {
    key: "ids",
    label: "入力ID列",
    shape: `${trace.ids.length}個のID`,
    summary: `[${trace.ids.join(", ")}]`,
    ids: trace.ids,
  };
  const h0 = matrixPayload("h0", "H⁰", trace.input);
  const attention = matrixPayload("attention", "A", trace.attention);
  const u = matrixPayload("u", "U = H⁰ + A", trace.afterAttention);
  const mlp = matrixPayload("mlp", "M", trace.mlpOutput);
  const hPrime = matrixPayload("h-prime", "H′ = U + M", trace.afterMlp);
  const lastHidden: GenerationPayload = {
    key: "last-hidden",
    label: "末尾の正規化表現 h",
    shape: `${trace.lastHidden.length}成分`,
    summary: vectorSummary(trace.lastHidden),
    values: trace.lastHidden,
  };
  const logits: GenerationPayload = {
    key: "logits",
    label: "スコア z",
    shape: `${trace.logits.length}個`,
    summary: "IDごとに1スコア",
    values: trace.logits,
  };
  const probabilities: GenerationPayload = {
    key: "probabilities",
    label: "確率 π",
    shape: `${trace.probabilities.length}個（合計1）`,
    summary: "各IDの次トークン確率",
    values: trace.probabilities,
  };
  const selectedId: GenerationPayload = {
    key: "selected-id",
    label: `ID ${selection.id}`,
    shape: "整数1個",
    summary: "確率から選択したID",
    selectedId: selection.id,
  };
  const piece = decodeFlow([selection.id]);
  const decoded: GenerationPayload = {
    key: "decoded",
    label: selection.isEnd
      ? `ID ${selection.id} → 終了`
      : `ID ${selection.id} →「${piece}」`,
    shape: "IDと文字片",
    summary: selection.isEnd
      ? "終了IDを保持し、生成を終了"
      : `文字片を表示・ID ${selection.id}を追加`,
    selectedId: selection.id,
    piece,
  };
  const nextIds = [...trace.ids, selection.id];
  const appended: GenerationPayload = {
    key: "next-ids",
    label: "次の入力ID列",
    shape: `${nextIds.length}個のID`,
    summary: selection.isEnd
      ? `[${nextIds.join(", ")}] · 生成終了`
      : `[${nextIds.join(", ")}] · 次の計算へ`,
    ids: nextIds,
    selectedId: selection.id,
  };

  return {
    input: { input: text, output: ids },
    embedding: { input: ids, output: h0 },
    attention: { input: h0, output: attention },
    "attention-add": { input: attention, output: u },
    mlp: { input: u, output: mlp },
    "mlp-add": { input: mlp, output: hPrime },
    "final-norm": { input: hPrime, output: lastHidden },
    output: { input: lastHidden, output: logits },
    probabilities: { input: logits, output: probabilities },
    selection: { input: probabilities, output: selectedId },
    decode: { input: selectedId, output: decoded },
    return: { input: decoded, output: appended },
  };
}
