import { expect, it } from "vite-plus/test";
import {
  ROUTE_EDGES,
  ROUTE_NODES,
  pointOnRouteEdge,
  routeFrame,
  routeNodeById,
} from "./generation-route";
import { STORY_PHASES } from "./generation-story-timeline";
import { svgNumber } from "./svg-number";

it("常に同じ12演算を、11本の主辺で入力からID追加まで結ぶ", () => {
  expect(ROUTE_NODES).toHaveLength(12);
  expect(ROUTE_EDGES).toHaveLength(14);
  const edges = ROUTE_EDGES.filter((edge) => edge.kind === "main");
  expect(edges).toHaveLength(11);
  for (const [index, edge] of edges.entries()) {
    expect(edge.from).toBe(ROUTE_NODES[index]?.id);
    expect(edge.to).toBe(ROUTE_NODES[index + 1]?.id);
    expect(edge.waypoints[0]).toStrictEqual(routeNodeById(edge.from).center);
    expect(edge.waypoints.at(-1)).toStrictEqual(routeNodeById(edge.to).center);
  }
});

it("残差はLayerNormより前の表現を、それぞれ対応する加算へ運ぶ", () => {
  expect(
    ROUTE_EDGES.filter((edge) => edge.kind === "residual").map((edge) => [
      edge.from,
      edge.to,
    ])
  ).toStrictEqual([
    ["embedding", "attention-add"],
    ["attention-add", "mlp-add"],
  ]);
});

it("SVGの線とpacket座標を同じwaypointsから求め、折れ線でも等速で進む", () => {
  for (const edge of ROUTE_EDGES) {
    const expectedPath = edge.waypoints
      .map(
        ([x, y], index) =>
          `${index === 0 ? "M" : "L"}${svgNumber(x)} ${svgNumber(y)}`
      )
      .join(" ");
    expect(edge.path).toBe(expectedPath);
    const [startX, startY] = routeNodeById(edge.from).center;
    const [endX, endY] = routeNodeById(edge.to).center;
    expect(pointOnRouteEdge(edge, 0)).toStrictEqual({ x: startX, y: startY });
    expect(pointOnRouteEdge(edge, 1)).toStrictEqual({ x: endX, y: endY });
  }
  const loop = ROUTE_EDGES.find((edge) => edge.kind === "loop");
  if (!loop) {
    throw new Error("入力に戻る辺がありません。");
  }
  // 横110 + 縦420 + 横110 = 640。半分進むと左端の中点に達する。
  expect(pointOnRouteEdge(loop, 0.5)).toStrictEqual({ x: 10, y: 280 });
});

it("すべてのphase境界でpacketの終点と次の始点が一致する", () => {
  for (const [index, phase] of STORY_PHASES.entries()) {
    const next = STORY_PHASES[(index + 1) % STORY_PHASES.length];
    if (!next) {
      throw new Error("次のphaseがありません。");
    }
    expect(routeFrame(phase.stage, 1).packet).toStrictEqual(
      routeFrame(next.stage, 0).packet
    );
  }
});

it("語彙スコアへ写す前に最終LayerNormを通り、途中の切替にも飛びがない", () => {
  expect(routeFrame("output", 0).activeNodeId).toBe("final-norm");
  expect(routeFrame("output", 0.35).activeEdgeId).toBe("final-norm-to-output");
  expect(routeFrame("output", 0.6).activeNodeId).toBe("output");
  expect(routeFrame("output", 0.8).activeEdgeId).toBe(
    "output-to-probabilities"
  );
  for (const boundary of [0.25, 0.5, 0.7]) {
    const before = routeFrame("output", boundary - 1e-9).packet;
    const after = routeFrame("output", boundary).packet;
    expect(before.x).toBeCloseTo(after.x, 5);
    expect(before.y).toBeCloseTo(after.y, 5);
  }
});

it("ノードで演算してから次の辺を進み、演算済みの接続元を保持する", () => {
  const computing = routeFrame("attention-add", 0.3);
  expect(computing.activeNodeId).toBe("attention-add");
  expect(computing.activeEdgeId).toBeNull();
  expect(computing.settledIds).toStrictEqual([
    "input",
    "embedding",
    "attention",
  ]);
  const moving = routeFrame("attention-add", 0.8);
  expect(moving.activeEdgeId).toBe("attention-add-to-mlp");
  expect(moving.settledIds).toStrictEqual([
    "input",
    "embedding",
    "attention",
    "attention-add",
  ]);
});
