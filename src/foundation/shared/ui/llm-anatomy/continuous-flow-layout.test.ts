import { expect, it } from "vite-plus/test";
import { CINEMA_DURATION } from "./cinema-timeline";
import {
  continuousCalculationProgress,
  continuousCamera,
  continuousConnectionPath,
  continuousInputOffset,
  continuousLayout,
  continuousNodePosition,
  continuousPacketPoint,
} from "./continuous-flow-layout";
import { createContinuousFlow } from "./continuous-flow-model";
import type {
  ContinuousConnection,
  ContinuousNodeId,
} from "./continuous-flow-model";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";

const trace = runGeneration(DEFAULT_FLOW_IDS);
const flow = createContinuousFlow(trace, chooseGeneration(trace, 0.62));

function edge(
  from: ContinuousNodeId,
  to: ContinuousNodeId
): ContinuousConnection {
  const connection = flow.connections.find(
    (candidate) => candidate.from === from && candidate.to === to
  );
  if (!connection) {
    throw new Error(`必要な接続${from}→${to}がありません。`);
  }
  return connection;
}

it.each([false, true])(
  "mobile=%s：同じ入力から分かれるQ/K/Vと2ヘッドの計算器を並列に置く",
  (mobile) => {
    const layout = continuousLayout(mobile);
    const normalized = continuousNodePosition("ln1", layout);
    const query = continuousNodePosition("qkv-query", layout);
    const key = continuousNodePosition("qkv-key", layout);
    const value = continuousNodePosition("qkv-value", layout);
    expect(query.x).toBeGreaterThan(normalized.x);
    expect(query.x).toBe(key.x);
    expect(value.x).toBe(key.x);
    expect(query.y + layout.height).toBeLessThan(key.y);
    expect(key.y + layout.height).toBeLessThan(value.y);

    const first = continuousNodePosition("weighted-head-1", layout);
    const second = continuousNodePosition("weighted-head-2", layout);
    const joined = continuousNodePosition("attention-output", layout);
    expect(first.x).toBe(second.x);
    expect(first.y + layout.height).toBeLessThan(second.y);
    expect(joined.x).toBeGreaterThan(first.x);
    expect(joined.y).toBeGreaterThan(first.y);
    expect(joined.y).toBeLessThan(second.y);

    const decoded = continuousNodePosition("decode", layout);
    const appended = continuousNodePosition("return", layout);
    expect(decoded.x).toBe(appended.x);
    expect(decoded.y + layout.height).toBeLessThan(appended.y);
  }
);

it.each([false, true])(
  "mobile=%s：各入力に別の到着位置を与え、同じ経路上の末端へ実値を運ぶ",
  (mobile) => {
    const layout = continuousLayout(mobile);
    const nodeIds: ContinuousNodeId[] = [
      ...flow.operations.map(({ id }) => id),
      flow.support.id,
    ];
    for (const id of nodeIds) {
      const incoming = flow.connections.filter(
        (connection) =>
          connection.to === id &&
          connection.enabled &&
          connection.kind !== "feedback"
      );
      const offsets = incoming.map((connection) =>
        continuousInputOffset(flow, connection, layout)
      );
      expect(new Set(offsets).size).toBe(incoming.length);
      for (const connection of incoming) {
        const offset = continuousInputOffset(flow, connection, layout);
        const path = continuousConnectionPath(connection, layout, offset);
        const target = continuousNodePosition(id, layout);
        const [origin] = path;
        const endpoint = path.at(-1);
        if (!(origin && endpoint)) {
          throw new Error("搬送経路の両端がありません。");
        }
        expect(endpoint?.[1]).toBe(target.y + layout.height / 2 + offset);
        expect(endpoint?.[0]).toBeLessThan(target.x);
        expect(
          continuousPacketPoint(connection, layout, 0, offset)
        ).toStrictEqual({ x: origin[0], y: origin[1] });
        expect(
          continuousPacketPoint(connection, layout, 1, offset)
        ).toStrictEqual({ x: endpoint[0], y: endpoint[1] });
        expect(path.every((point) => point.every(Number.isFinite))).toBe(true);
      }
    }
  }
);

it.each([false, true])(
  "mobile=%s：残差は計算器の外へ迂回し、次回IDは入力表参照へ戻す",
  (mobile) => {
    const layout = continuousLayout(mobile);
    const residuals = [
      edge("embedding-add", "residual1"),
      edge("residual1", "residual2"),
    ];
    for (const connection of residuals) {
      const source = continuousNodePosition(connection.from, layout);
      const target = continuousNodePosition(connection.to, layout);
      const path = continuousConnectionPath(connection, layout);
      const rail = Math.max(...path.map((point) => point[1]));
      expect(rail).toBeGreaterThan(source.y + layout.height);
      expect(rail).toBeGreaterThan(target.y + layout.height);
    }

    const feedback = edge("return", "embedding-lookup");
    const path = continuousConnectionPath(feedback, layout);
    const top = Math.min(
      ...flow.operations.map(({ id }) => continuousNodePosition(id, layout).y)
    );
    expect(Math.min(...path.map((point) => point[1]))).toBeLessThan(top);
    expect(path.at(-1)?.[0]).toBeLessThan(
      continuousNodePosition("embedding-lookup", layout).x
    );
  }
);

it("全演算で入力到着まで待ち、72%で計算を終えて搬送中も出力を保持する", () => {
  for (const operation of flow.operations) {
    const arrival = operation.start + operation.duration * 0.12;
    const calculated = operation.start + operation.duration * 0.72;
    expect(continuousCalculationProgress(operation, operation.start)).toBe(0);
    expect(continuousCalculationProgress(operation, arrival - 0.01)).toBe(0);
    expect(continuousCalculationProgress(operation, arrival)).toBeCloseTo(
      0,
      10
    );
    expect(
      continuousCalculationProgress(operation, (arrival + calculated) / 2)
    ).toBeCloseTo(0.5, 10);
    expect(continuousCalculationProgress(operation, calculated)).toBeCloseTo(
      1,
      10
    );
    expect(continuousCalculationProgress(operation, operation.end)).toBe(1);
    expect(continuousCalculationProgress(operation, CINEMA_DURATION)).toBe(1);
  }
});

it.each([
  { mobile: false, aspect: 16 / 9 },
  { mobile: false, aspect: 4 / 3 },
  { mobile: true, aspect: 390 / 500 },
])(
  "mobile=$mobile、aspect=$aspect：演算・搬送の境界でカメラの位置も倍率も飛ばない",
  ({ mobile, aspect }) => {
    const layout = continuousLayout(mobile);
    const boundaries = new Set<number>([0, CINEMA_DURATION]);
    for (const operation of flow.operations) {
      boundaries.add(operation.start);
      boundaries.add(operation.end);
      boundaries.add(operation.start + operation.duration * 0.72);
      boundaries.add(operation.start + operation.duration * 0.12);
    }
    for (const boundary of boundaries) {
      const before = continuousCamera(flow, boundary - 0.001, layout, aspect);
      const after = continuousCamera(flow, boundary + 0.001, layout, aspect);
      for (const key of ["x", "y", "width", "height"] as const) {
        expect(Number.isFinite(before[key])).toBe(true);
        expect(Number.isFinite(after[key])).toBe(true);
        expect(Math.abs(after[key] - before[key])).toBeLessThan(0.05);
      }
      expect(before.width).toBeGreaterThan(0);
      expect(before.height).toBeGreaterThan(0);
      expect(before.width / before.height).toBeCloseTo(aspect, 12);
    }
  }
);
