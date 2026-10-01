import { Color, InstancedMesh, Matrix4, SphereGeometry, Vector3 } from "three";
import { marker, palette, polyline, rng, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

type Item = { center: Vector3; radius: number };
type Node = {
  min: Vector3;
  max: Vector3;
  depth: number;
  left: Node | null;
  right: Node | null;
  items: number[];
};

const COUNT = 260;
const LEAF = 2;

function bounds(items: readonly Item[], indices: readonly number[]) {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const i of indices) {
    const item = items[i];
    if (item) {
      min.min(item.center.clone().subScalar(item.radius));
      max.max(item.center.clone().addScalar(item.radius));
    }
  }
  return { min, max };
}

/** 上から分ける：いちばん長い軸で、中心の並びの真ん中（中央値）で 2 つに分ける。 */
function build(items: readonly Item[], indices: number[], depth: number): Node {
  const { min, max } = bounds(items, indices);
  if (indices.length <= LEAF) {
    return { min, max, depth, left: null, right: null, items: indices };
  }
  const size = max.clone().sub(min);
  const axis =
    size.x > size.y && size.x > size.z ? "x" : size.y > size.z ? "y" : "z";
  const sorted = indices.toSorted(
    (a, b) => (items[a]?.center[axis] ?? 0) - (items[b]?.center[axis] ?? 0)
  );
  const half = Math.floor(sorted.length / 2);
  return {
    min,
    max,
    depth,
    left: build(items, sorted.slice(0, half), depth + 1),
    right: build(items, sorted.slice(half), depth + 1),
    items: [],
  };
}

/** 光線と箱：入る時刻（当たらなければ Infinity）。 */
function rayBox(origin: Vector3, inverse: Vector3, min: Vector3, max: Vector3) {
  let enter = 0;
  let exit = Infinity;
  for (const axis of ["x", "y", "z"] as const) {
    const t0 = (min[axis] - origin[axis]) * inverse[axis];
    const t1 = (max[axis] - origin[axis]) * inverse[axis];
    enter = Math.max(enter, Math.min(t0, t1));
    exit = Math.min(exit, Math.max(t0, t1));
  }
  return enter <= exit ? enter : Infinity;
}

function raySphere(origin: Vector3, dir: Vector3, item: Item) {
  const oc = origin.clone().sub(item.center);
  const b = oc.dot(dir);
  const c = oc.lengthSq() - item.radius * item.radius;
  const discriminant = b * b - c;
  if (discriminant < 0) {
    return Infinity;
  }
  const t = -b - Math.sqrt(discriminant);
  return t > 0 ? t : Infinity;
}

const EDGE_INDEX = [
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;
const boxLines = (min: Vector3, max: Vector3, out: Vector3[]) => {
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
    (i) =>
      new Vector3(
        i & 1 ? max.x : min.x,
        i & 2 ? max.y : min.y,
        i & 4 ? max.z : min.z
      )
  );
  for (const [p, q] of EDGE_INDEX) {
    out.push(corners[p] ?? min, corners[q] ?? max);
  }
};

export const demo: DemoModule = {
  alt: "たくさんの物体を、包囲体（箱）の木に入れて、光線の当たり判定を速くする BVH（包囲体階層）のデモ。260 個の球を、いちばん長い軸で半分ずつに分けることをくり返して、箱の入れ子の木を作る。光線は根の箱から調べ、箱に当たらなければ、その中の物体はまとめて調べずに済む。調べた箱（黄色）と調べた球（水色）だけを表示すると、全部の球を調べる場合に比べて、判定の回数がずっと少ないことがわかる。「表示する深さ」で、木の各段の箱を見られる。",
  camera: { position: [0, 7, 11], target: [0, 1.5, 0], fov: 42, autoRotate: 5 },
  controls: [
    {
      type: "range",
      key: "depth",
      label: "表示する深さ（−1 で非表示）",
      min: -1,
      max: 8,
      step: 1,
      value: 3,
    },
    {
      type: "toggle",
      key: "visited",
      label: "光線が調べた箱を表示",
      value: true,
    },
    {
      type: "toggle",
      key: "sweep",
      label: "光線を自動で振る",
      value: true,
    },
  ],
  legend: [
    { color: palette.coral, label: "光線と、いちばん近い当たり" },
    { color: palette.amber, label: "光線が調べた箱" },
    { color: palette.sky, label: "光線が調べた球" },
    { color: palette.violet, label: "指定した深さの箱" },
  ],
  hint: "「光線を自動で振る」を切ると、カーソルの方向へ光線を飛ばします",
  setup(context) {
    const { scene, params } = context;
    const random = rng(21);
    const clusters = Array.from(
      { length: 7 },
      () =>
        new Vector3(
          (random() * 2 - 1) * 4.5,
          0.6 + random() * 2.6,
          (random() * 2 - 1) * 3
        )
    );
    const items: Item[] = Array.from({ length: COUNT }, (_, i) => {
      const cluster = clusters[i % clusters.length] ?? new Vector3();
      return {
        center: cluster
          .clone()
          .add(
            new Vector3(
              random() * 2 - 1,
              random() * 2 - 1,
              random() * 2 - 1
            ).multiplyScalar(1.1)
          ),
        radius: 0.07 + random() * 0.12,
      };
    });
    const spheres = new InstancedMesh(
      new SphereGeometry(1, 16, 12),
      standard("#ffffff", { roughness: 0.5 }),
      COUNT
    );
    const matrix = new Matrix4();
    for (const [i, item] of items.entries()) {
      matrix
        .makeScale(item.radius, item.radius, item.radius)
        .setPosition(item.center);
      spheres.setMatrixAt(i, matrix);
    }
    spheres.castShadow = true;
    scene.add(spheres);
    const root = build(
      items,
      items.map((_, i) => i),
      0
    );
    let maxDepth = 0;
    const all: Node[] = [];
    const walk = (node: Node) => {
      all.push(node);
      maxDepth = Math.max(maxDepth, node.depth);
      if (node.left) {
        walk(node.left);
      }
      if (node.right) {
        walk(node.right);
      }
    };
    walk(root);

    const levelLines = segments([], palette.violet, {
      width: 1.3,
      opacity: 0.6,
    });
    const visitedLines = segments([], palette.amber, {
      width: 1.8,
      opacity: 0.85,
    });
    const beam = polyline([], palette.coral, { width: 3 });
    const emitter = marker(palette.coral, 0.12);
    const origin = new Vector3(-6.5, 1.8, 4.5);
    emitter.position.copy(origin);
    const hitMarker = marker(palette.coral, 0.1);
    scene.add(levelLines, visitedLines, beam, emitter, hitMarker);

    const base = new Color("#8a97ab");
    const tested = new Color(palette.sky);
    const hitColor = new Color(palette.coral);
    let shownDepth = -2;

    return {
      update({ time }) {
        const depth = Number(params["depth"]);
        if (depth !== shownDepth) {
          shownDepth = depth;
          const lines: Vector3[] = [];
          for (const node of all) {
            if (node.depth === depth) {
              boxLines(node.min, node.max, lines);
            }
          }
          levelLines.setPoints(lines);
          levelLines.visible = lines.length > 0;
        }
        // 光線の向き
        const pointer =
          params["sweep"] === true
            ? null
            : context.pointerOnPlane({
                normal: [0, 1, 0],
                origin: [0, 1.5, 0],
              });
        const target =
          pointer ??
          new Vector3(
            Math.sin(time * 0.35) * 4.5,
            1.5 + Math.sin(time * 0.8) * 1.2,
            Math.cos(time * 0.27) * 2.5 - 1
          );
        const dir = target.clone().sub(origin).normalize();
        const inverse = new Vector3(1 / dir.x, 1 / dir.y, 1 / dir.z);

        // いちばん近い当たりを探す走査：近い方の子から調べ、今の当たりより遠い箱は飛ばす
        let best = Infinity;
        let bestItem = -1;
        let boxTests = 0;
        let sphereTests = 0;
        const visited: Node[] = [];
        const testedItems = new Set<number>();
        const stack: Node[] = [root];
        while (stack.length > 0) {
          const node = stack.pop();
          if (!node) {
            continue;
          }
          boxTests++;
          const enter = rayBox(origin, inverse, node.min, node.max);
          if (enter >= best) {
            continue;
          }
          visited.push(node);
          if (node.left && node.right) {
            const tl = rayBox(origin, inverse, node.left.min, node.left.max);
            const tr = rayBox(origin, inverse, node.right.min, node.right.max);
            // 遠い方を先に積み、近い方を先に取り出す
            if (tl < tr) {
              stack.push(node.right, node.left);
            } else {
              stack.push(node.left, node.right);
            }
            continue;
          }
          for (const index of node.items) {
            const item = items[index];
            if (!item) {
              continue;
            }
            sphereTests++;
            testedItems.add(index);
            const t = raySphere(origin, dir, item);
            if (t < best) {
              best = t;
              bestItem = index;
            }
          }
        }
        const end = Number.isFinite(best)
          ? origin.clone().addScaledVector(dir, best)
          : origin.clone().addScaledVector(dir, 16);
        beam.setPoints([origin, end]);
        hitMarker.visible = Number.isFinite(best);
        hitMarker.position.copy(end);
        for (let i = 0; i < COUNT; i++) {
          spheres.setColorAt(
            i,
            i === bestItem ? hitColor : testedItems.has(i) ? tested : base
          );
        }
        if (spheres.instanceColor) {
          spheres.instanceColor.needsUpdate = true;
        }
        const lines: Vector3[] = [];
        for (const node of visited) {
          boxLines(node.min, node.max, lines);
        }
        visitedLines.setPoints(lines);
        visitedLines.visible = params["visited"] === true && lines.length > 0;

        context.readout("木の深さ / 箱の数", `${maxDepth} / ${all.length}`);
        context.readout("箱の判定（BVH）", `${boxTests} 回`);
        context.readout(
          "球の判定（BVH / 総当たり）",
          `${sphereTests} / ${COUNT} 回`
        );
        context.caption(
          "光線は根の箱から調べる。箱に当たらなければ、その中の球は 1 つも調べずに済む。当たった箱は、近い方の子から調べ、すでに見つかった当たりより遠い箱は飛ばす。こうして 260 個の球のうち、調べるのはほんの数個になる。"
        );
      },
      dispose() {
        spheres.dispose();
      },
    };
  },
};
