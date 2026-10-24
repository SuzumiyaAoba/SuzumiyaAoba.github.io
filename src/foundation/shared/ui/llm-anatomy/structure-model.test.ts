import { expect, it } from "vite-plus/test";
import { prismFaces, projectPoint, STRUCTURE_SCENES } from "./structure-model";
import type { StructureNode, StructureView } from "./structure-model";

it("全体図の接続が入力から確率分布まで途切れず、一方向につながる", () => {
  const { nodes, edges } = STRUCTURE_SCENES.overview;
  expect(nodes.map(({ id }) => id)).toStrictEqual([
    "tokens",
    "embedding",
    "block-1",
    "blocks-2-95",
    "block-96",
    "final-ln",
    "last-position",
    "lm-head",
    "softmax",
  ]);
  expect(edges).toHaveLength(nodes.length - 1);
  for (const [index, edge] of edges.entries()) {
    expect(edge.from).toBe(nodes[index]?.id);
    expect(edge.to).toBe(nodes[index + 1]?.id);
  }
});

it("中央の省略を展開すると重複のない 96 個のブロックになる", () => {
  const layers = STRUCTURE_SCENES.overview.nodes.flatMap(({ layerRange }) => {
    if (!layerRange) {
      return [];
    }
    return Array.from(
      { length: layerRange[1] - layerRange[0] + 1 },
      (_, offset) => layerRange[0] + offset
    );
  });
  expect(layers).toStrictEqual(
    Array.from({ length: 96 }, (_, index) => index + 1)
  );
  expect(STRUCTURE_SCENES.overview.nodes[3]?.layerRange).toStrictEqual([2, 95]);
});

it("Pre-LN の 2 つの残差経路は正規化と変換を飛び越えて加算に入る", () => {
  const { edges } = STRUCTURE_SCENES.block;
  const residuals = edges.filter(({ residual }) => residual);
  expect(residuals.map(({ from, to }) => [from, to])).toStrictEqual([
    ["hidden", "add-1"],
    ["add-1", "add-2"],
  ]);
  expect(
    edges.filter(({ to }) => to === "add-1").map(({ from }) => from)
  ).toStrictEqual(["attention", "hidden"]);
  expect(
    edges.filter(({ to }) => to === "add-2").map(({ from }) => from)
  ).toStrictEqual(["mlp", "add-1"]);
  expect(edges.find(({ to }) => to === "ln-1")?.from).toBe("hidden");
  expect(edges.find(({ to }) => to === "ln-2")?.from).toBe("add-1");
});

it("すべての接続が実在するノードを参照し、次の位置や次の層から逆流しない", () => {
  for (const view of ["overview", "block"] satisfies StructureView[]) {
    const { nodes, edges } = STRUCTURE_SCENES[view];
    for (const edge of edges) {
      const source = nodes.find(({ id }) => id === edge.from);
      const target = nodes.find(({ id }) => id === edge.to);
      expect(source).toBeDefined();
      expect(target).toBeDefined();
      expect(source?.center[1]).toBeLessThan(target?.center[1] ?? -Infinity);
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
    }
  }
});

it("最後の位置の選択は系列軸を縮め、語彙への射影は成分軸を変更する", () => {
  const { nodes } = STRUCTURE_SCENES.overview;
  const normalized = nodes.find(({ id }) => id === "final-ln");
  const lastPosition = nodes.find(({ id }) => id === "last-position");
  const logits = nodes.find(({ id }) => id === "lm-head");
  expect(normalized?.shape).toBe("n × d");
  expect(lastPosition?.shape).toBe("d");
  expect(logits?.shape).toBe("|V|");
  expect(lastPosition?.size[0]).toBeLessThan(normalized?.size[0] ?? 0);
  expect(lastPosition?.size[2]).toBe(normalized?.size[2]);
});

it("視点の範囲内で投影が有限で、3 次元での回転が左右の奥行き順を変える", () => {
  for (const yaw of [-35, 0, 35]) {
    for (const pitch of [8, 28]) {
      for (const { center } of STRUCTURE_SCENES.overview.nodes) {
        const point = projectPoint(center, yaw, pitch);
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(Number.isFinite(point.depth)).toBe(true);
        expect(point.y).toBeGreaterThan(0);
        expect(point.y).toBeLessThan(850);
      }
    }
  }
  expect(projectPoint([-100, 0, 0], 35, 18).depth).toBeGreaterThan(
    projectPoint([100, 0, 0], 35, 18).depth
  );
  expect(projectPoint([-100, 0, 0], -35, 18).depth).toBeLessThan(
    projectPoint([100, 0, 0], -35, 18).depth
  );
});

it("回転に応じた可視面だけを奥から並べ、SVG の座標だけを 4 桁に丸める", () => {
  const node: StructureNode = {
    id: "test-tensor",
    label: "tensor",
    shape: "n × d",
    description: "projection test",
    part: "B",
    center: [0, 0, 0],
    size: [220, 12, 80],
    kind: "tensor",
  };
  const left = prismFaces(node, 35, 18);
  const right = prismFaces(node, -35, 18);
  expect(left.map(({ key }) => key).toSorted()).toStrictEqual([
    "front",
    "left",
    "top",
  ]);
  expect(right.map(({ key }) => key).toSorted()).toStrictEqual([
    "front",
    "right",
    "top",
  ]);
  expect(
    prismFaces(node, 0, 18)
      .map(({ key }) => key)
      .toSorted()
  ).toStrictEqual(["front", "top"]);
  for (const [index, face] of left.entries()) {
    expect(face.depth).toBeGreaterThanOrEqual(
      left[index - 1]?.depth ?? -Infinity
    );
    expect(face.points.split(" ")).toHaveLength(4);
    for (const coordinate of face.points.split(/[ ,]/u)) {
      expect(coordinate).toMatch(/^-?\d+\.\d{4}$/u);
    }
  }
  const projected = projectPoint([1, 1, 1], 35, 18);
  expect(projected.x).not.toBe(Number(projected.x.toFixed(4)));
});
