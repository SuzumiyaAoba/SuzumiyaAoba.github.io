import { Vector3 } from "three";
import { arrow, marker, palette, polyline, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

type V2 = { x: number; y: number };
type Vertex = { w: V2; a: V2; b: V2 };
type Step = { simplex: Vertex[]; closest: V2; direction: V2; added: V2 | null };

const SHAPE_A: readonly V2[] = [
  { x: 0, y: 0.95 },
  { x: 0.9, y: 0.3 },
  { x: 0.55, y: -0.8 },
  { x: -0.55, y: -0.8 },
  { x: -0.9, y: 0.3 },
];
const SHAPE_B: readonly V2[] = [
  { x: -0.8, y: -0.6 },
  { x: 1, y: -0.35 },
  { x: 0.6, y: 0.8 },
  { x: -0.7, y: 0.55 },
];
const LEFT = -3.2;
const RIGHT = 3.3;
const SCALE = 0.75;
const EPS = 1e-6;

const dot = (a: V2, b: V2) => a.x * b.x + a.y * b.y;
const sub = (a: V2, b: V2) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: V2, b: V2) => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: V2, s: number) => ({ x: a.x * s, y: a.y * s });
/** 3 点の向き（正なら反時計回り）。 */
const cross = (o: V2, a: V2, b: V2) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const lerp = (a: V2, b: V2, t: number) => add(a, scale(sub(b, a), t));

const support = (points: readonly V2[], d: V2) => {
  let best = points[0] ?? { x: 0, y: 0 };
  for (const p of points) {
    if (dot(p, d) > dot(best, d)) {
      best = p;
    }
  }
  return best;
};

/** 線分 ab 上の、原点に最も近い点の割合 t。 */
const segmentT = (a: V2, b: V2) => {
  const ab = sub(b, a);
  const length = dot(ab, ab);
  return length < EPS ? 0 : Math.min(1, Math.max(0, -dot(a, ab) / length));
};

/** 単体（点・線分・三角形）の中で原点に最も近い点を求め、それに必要な頂点だけ残す。 */
function reduce(simplex: Vertex[]): {
  simplex: Vertex[];
  closest: V2;
  inside: boolean;
} {
  if (simplex.length === 1) {
    const [p] = simplex;
    return { simplex, closest: p?.w ?? { x: 0, y: 0 }, inside: false };
  }
  if (simplex.length === 2) {
    const [p, q] = simplex;
    if (!p || !q) {
      return { simplex, closest: { x: 0, y: 0 }, inside: false };
    }
    const t = segmentT(p.w, q.w);
    const kept = t <= 0 ? [p] : t >= 1 ? [q] : [p, q];
    return { simplex: kept, closest: lerp(p.w, q.w, t), inside: false };
  }
  const [p, q, r] = simplex;
  if (!p || !q || !r) {
    return { simplex, closest: { x: 0, y: 0 }, inside: false };
  }
  // 原点が三角形の中なら重なっている
  const origin = { x: 0, y: 0 };
  const s1 = cross(p.w, q.w, origin);
  const s2 = cross(q.w, r.w, origin);
  const s3 = cross(r.w, p.w, origin);
  if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) {
    return { simplex, closest: origin, inside: true };
  }
  let best: { simplex: Vertex[]; closest: V2; inside: boolean } | null = null;
  for (const pair of [
    [p, q],
    [q, r],
    [r, p],
  ] as const) {
    const candidate = reduce([...pair]);
    if (
      !best ||
      dot(candidate.closest, candidate.closest) <
        dot(best.closest, best.closest)
    ) {
      best = candidate;
    }
  }
  return best ?? { simplex, closest: origin, inside: false };
}

/** GJK：ミンコフスキー差 A − B の上で、原点に最も近い点を単体を育てながら探す。 */
function gjk(polyA: readonly V2[], polyB: readonly V2[], start: V2) {
  const supportOf = (d: V2): Vertex => {
    const a = support(polyA, d);
    const b = support(polyB, scale(d, -1));
    return { w: sub(a, b), a, b };
  };
  let simplex: Vertex[] = [supportOf(start)];
  const steps: Step[] = [];
  let closest = simplex[0]?.w ?? { x: 0, y: 0 };
  let inside = false;
  for (let iteration = 0; iteration < 20; iteration++) {
    const reduced = reduce(simplex);
    ({ simplex, closest, inside } = reduced);
    const direction = scale(closest, -1);
    if (inside || dot(closest, closest) < EPS) {
      steps.push({ simplex, closest, direction, added: null });
      inside = true;
      break;
    }
    const w = supportOf(direction);
    // 新しい点が今の最近点より原点側に進まなければ、それ以上近づけない
    const progress = dot(w.w, direction) - dot(closest, direction);
    steps.push({
      simplex,
      closest,
      direction,
      added: progress < EPS ? null : w.w,
    });
    if (progress < 1e-5) {
      break;
    }
    simplex = [...simplex, w];
  }
  // 最近点を、単体の頂点の元になった A と B の点の重みで表して、各形の上の最近点を得る
  let pointA = simplex[0]?.a ?? { x: 0, y: 0 };
  let pointB = simplex[0]?.b ?? { x: 0, y: 0 };
  if (simplex.length === 2) {
    const [p, q] = simplex;
    if (p && q) {
      const t = segmentT(p.w, q.w);
      pointA = lerp(p.a, q.a, t);
      pointB = lerp(p.b, q.b, t);
    }
  }
  return {
    steps,
    inside,
    distance: Math.sqrt(dot(closest, closest)),
    pointA,
    pointB,
  };
}

/** 凸包（ミンコフスキー差の表示用）。 */
function hull(points: V2[]) {
  const sorted = points.toSorted((a, b) => a.x - b.x || a.y - b.y);
  const lower: V2[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower.at(-2) ?? p, lower.at(-1) ?? p, p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: V2[] = [];
  for (const p of sorted.toReversed()) {
    while (
      upper.length >= 2 &&
      cross(upper.at(-2) ?? p, upper.at(-1) ?? p, p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const world = (p: V2, y = 0.04) => new Vector3(p.x, y, p.y);
const panel = (p: V2, y = 0.05) =>
  new Vector3(RIGHT + p.x * SCALE, y, p.y * SCALE);
const closed = (points: readonly V2[]) => [
  ...points,
  points[0] ?? { x: 0, y: 0 },
];

export const demo: DemoModule = {
  alt: "2 つの凸形状の距離や重なりを求める GJK 法のデモ。左が 2 つの形、右がそのミンコフスキー差（A のすべての点から B のすべての点を引いた形）。2 つの形が重なっているのは、ミンコフスキー差が原点を含むときで、離れているときの距離は、ミンコフスキー差から原点までの距離に等しい。GJK は、ミンコフスキー差を全部作らずに、「ある方向にいちばん遠い点（サポート点）」だけを使って、原点を囲む三角形か、原点に最も近い点を、単体（点・線分・三角形）を育てながら探す。",
  camera: {
    position: [0.1, 11, 4.5],
    target: [0.1, 0, 0.5],
    fov: 40,
    orbit: false,
  },
  controls: [
    {
      type: "range",
      key: "interval",
      label: "1 手順の時間（秒）",
      min: 0.2,
      max: 2,
      step: 0.1,
      value: 0.9,
    },
    { type: "toggle", key: "auto", label: "自動で動かす", value: true },
  ],
  legend: [
    { color: palette.lime, label: "形 A（ドラッグで動かせる）" },
    { color: palette.sky, label: "形 B" },
    { color: palette.violet, label: "ミンコフスキー差 A − B" },
    { color: palette.amber, label: "単体と、次に探す方向" },
    { color: palette.coral, label: "最近点と距離" },
  ],
  hint: "緑の形の中心の球をドラッグすると動かせます",
  setup(context) {
    const { scene, params } = context;
    const outlineA = polyline([], palette.lime, { width: 3 });
    const outlineB = polyline([], palette.sky, { width: 3 });
    const diff = polyline([], palette.violet, { width: 3 });
    const diffPoints = segments([], palette.violet, {
      width: 1,
      opacity: 0.25,
    });
    const simplexLine = polyline([], palette.amber, { width: 4 });
    const closestLine = segments([], palette.coral, {
      width: 3,
      dashed: true,
      dashSize: 0.08,
      gapSize: 0.06,
    });
    const between = segments([], palette.coral, { width: 3 });
    const direction = arrow(palette.amber, { radius: 0.025, overlay: true });
    const origin = marker(palette.ink, 0.07);
    origin.position.copy(panel({ x: 0, y: 0 }));
    const added = marker(palette.amber, 0.08);
    const closestMarker = marker(palette.coral, 0.07);
    scene.add(
      outlineA,
      outlineB,
      diff,
      diffPoints,
      simplexLine,
      closestLine,
      between,
      direction,
      origin,
      added,
      closestMarker
    );
    const originLabel = context.label("原点", { tone: "muted" });
    originLabel.position.copy(panel({ x: 0, y: 0 })).setZ(0.35);
    const leftLabel = context.label("2 つの形", { tone: "strong" });
    leftLabel.position.set(LEFT, 0, -2.6);
    const rightLabel = context.label("ミンコフスキー差 A − B", {
      tone: "strong",
    });
    rightLabel.position.set(RIGHT, 0, -2.6);
    scene.add(originLabel, leftLabel, rightLabel);
    const grip = handle(palette.lime, 0.11);
    grip.position.set(LEFT - 1.2, 0.1, 0.3);
    scene.add(grip);
    let dragging = 0;
    context.draggable(grip, {
      normal: [0, 1, 0],
      onDrag: () => {
        dragging = 3;
      },
    });

    let stepIndex = 0;
    let timer = 0;
    let signature = "";
    let result = gjk(SHAPE_A, SHAPE_B, { x: 1, y: 0 });
    // 自動のとき：次の位置へ動く → 止まって手順を見せる → 少し待つ、をくり返す
    const poses = [
      { x: LEFT - 2.3, z: 0.4 },
      { x: LEFT - 0.4, z: 0.2 },
      { x: LEFT + 2.7, z: -0.7 },
      { x: LEFT + 0.7, z: 0.5 },
      { x: LEFT + 0.3, z: -2.1 },
    ];
    let pose = 0;
    let moveTime = 0;
    let moving = true;
    let hold = 0;
    const from = { x: grip.position.x, z: grip.position.z };

    return {
      update({ dt }) {
        dragging = Math.max(0, dragging - dt);
        const auto = params["auto"] === true && dragging === 0;
        if (auto && moving) {
          moveTime += dt;
          const target = poses[pose] ?? { x: LEFT, z: 0 };
          const t = Math.min(1, moveTime / 1.2);
          const eased = t * t * (3 - 2 * t);
          grip.position.set(
            from.x + (target.x - from.x) * eased,
            0.1,
            from.z + (target.z - from.z) * eased
          );
          if (t >= 1) {
            moving = false;
            hold = 0;
            stepIndex = 0;
            timer = 0;
          }
        }
        const polyA = SHAPE_A.map((p) => ({
          x: p.x + grip.position.x,
          y: p.y + grip.position.z,
        }));
        const polyB = SHAPE_B.map((p) => ({ x: p.x + LEFT + 0.2, y: p.y }));
        outlineA.setPoints(closed(polyA).map((p) => world(p)));
        outlineB.setPoints(closed(polyB).map((p) => world(p)));
        const all: V2[] = [];
        for (const a of polyA) {
          for (const b of polyB) {
            all.push(sub(a, b));
          }
        }
        diff.setPoints(closed(hull(all)).map((p) => panel(p)));

        // 形が大きく動いたら最初から探し直す
        const key = `${grip.position.x.toFixed(1)},${grip.position.z.toFixed(1)}`;
        if (key !== signature) {
          signature = key;
          result = gjk(
            polyA,
            polyB,
            sub(polyB[0] ?? { x: 0, y: 0 }, polyA[0] ?? { x: 0, y: 0 })
          );
          stepIndex = 0;
          timer = 0;
        }
        if (auto && moving) {
          // 動いている間は結果だけ見せる
          stepIndex = result.steps.length - 1;
        }
        const done = stepIndex >= result.steps.length - 1;
        if (auto && !moving && done) {
          hold += dt;
          if (hold > 2.2) {
            from.x = grip.position.x;
            from.z = grip.position.z;
            pose = (pose + 1) % poses.length;
            moveTime = 0;
            moving = true;
          }
        }
        timer += dt;
        if (
          timer > Number(params["interval"]) &&
          stepIndex < result.steps.length - 1
        ) {
          timer = 0;
          stepIndex++;
        }
        const step = result.steps[Math.min(stepIndex, result.steps.length - 1)];
        const finished = stepIndex >= result.steps.length - 1;
        if (step) {
          const points = step.simplex.map((v) => panel(v.w, 0.07));
          simplexLine.setPoints(
            step.simplex.length === 3
              ? [...points, points[0] ?? new Vector3()]
              : points.length === 1
                ? [
                    points[0] ?? new Vector3(),
                    (points[0] ?? new Vector3())
                      .clone()
                      .add(new Vector3(0.001, 0, 0)),
                  ]
                : points
          );
          closestMarker.position.copy(panel(step.closest, 0.09));
          closestLine.setPoints([
            panel({ x: 0, y: 0 }, 0.08),
            panel(step.closest, 0.08),
          ]);
          closestLine.visible = !result.inside || !finished;
          const d = step.direction;
          const length = Math.hypot(d.x, d.y);
          direction.visible = !finished && length > EPS;
          if (length > EPS) {
            direction.set(
              panel(step.closest, 0.1),
              new Vector3(d.x / length, 0, d.y / length).multiplyScalar(0.7)
            );
          }
          added.visible = step.added !== null && !finished;
          if (step.added) {
            added.position.copy(panel(step.added, 0.1));
          }
        }
        between.visible = finished && !result.inside;
        between.setPoints([
          world(result.pointA, 0.08),
          world(result.pointB, 0.08),
        ]);
        context.readout(
          "手順",
          `${Math.min(stepIndex + 1, result.steps.length)} / ${result.steps.length}`
        );
        context.readout(
          "結果",
          finished
            ? result.inside
              ? "重なっている"
              : `離れている（距離 ${result.distance.toFixed(3)}）`
            : "探索中"
        );
        context.readout("単体の頂点の数", `${step?.simplex.length ?? 0}`);
        context.caption(
          finished
            ? result.inside
              ? "単体（黄色の三角形）が原点を囲んだので、ミンコフスキー差は原点を含む。つまり A と B は重なっている。"
              : "もうどの方向にも原点へ近づけないので終わり。ミンコフスキー差の上の最近点（赤）までの距離が、2 つの形の最短距離で、左の赤い線がそれを結ぶ 2 点。"
            : "今の単体の中で原点に最も近い点（赤）から、原点の方向（黄色の矢印）にいちばん遠いミンコフスキー差の点（サポート点）を 1 つ足し、原点に近づくのに要らない頂点を捨てる。サポート点は「A でその方向にいちばん遠い点 − B で逆向きにいちばん遠い点」なので、差の形を全部作らなくても求まる。"
        );
      },
    };
  },
};
