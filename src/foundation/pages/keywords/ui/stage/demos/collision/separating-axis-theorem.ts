import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
} from "three";
import { arrow, palette, polyline, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

type V2 = { x: number; y: number };

const SHAPE_A: readonly V2[] = [
  { x: 0, y: 1.1 },
  { x: 1.05, y: 0.35 },
  { x: 0.65, y: -0.9 },
  { x: -0.65, y: -0.9 },
  { x: -1.05, y: 0.35 },
];
const SHAPE_B: readonly V2[] = [
  { x: -1.5, y: -0.55 },
  { x: 1.5, y: -0.55 },
  { x: 1.2, y: 0.55 },
  { x: -1.2, y: 0.55 },
];
/** 軸を描く位置（図形から離した直線）。 */
const AXIS_OFFSET = 2.7;

const transform = (
  points: readonly V2[],
  x: number,
  y: number,
  angle: number
) =>
  points.map((p) => ({
    x: x + p.x * Math.cos(angle) - p.y * Math.sin(angle),
    y: y + p.x * Math.sin(angle) + p.y * Math.cos(angle),
  }));

/** 辺の外向きの法線（単位ベクトル）。 */
const edgeNormals = (points: readonly V2[]) =>
  points.map((p, i) => {
    const q = points[(i + 1) % points.length] ?? p;
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const length = Math.hypot(dx, dy);
    return { x: dy / length, y: -dx / length };
  });

const project = (points: readonly V2[], axis: V2) => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    const t = p.x * axis.x + p.y * axis.y;
    min = Math.min(min, t);
    max = Math.max(max, t);
  }
  return { min, max };
};

const toWorld = (p: V2, y = 0.03) => new Vector3(p.x, y, p.y);

function polygonMesh(color: string, opacity: number) {
  const mesh = new Mesh(
    new ShapeGeometry(new Shape()),
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: DoubleSide,
      depthWrite: false,
    })
  );
  const outline = polyline([], color, { width: 3 });
  const set = (points: readonly V2[]) => {
    const shape = new Shape(points.map((p) => new Vector2(p.x, -p.y)));
    mesh.geometry.dispose();
    mesh.geometry = new ShapeGeometry(shape);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    const closed = [...points, points[0] ?? { x: 0, y: 0 }];
    outline.setPoints(closed.map((p) => toWorld(p, 0.04)));
  };
  return { mesh, outline, set };
}

export const demo: DemoModule = {
  alt: "2 つの凸多角形が重なっているかを、分離軸定理で調べるデモ。両方の多角形の辺の法線を 1 本ずつ軸として取り、多角形の頂点をその軸に投影して、区間（影）を比べる。どれか 1 本の軸で 2 つの区間の間に隙間があれば、その軸が分離軸で、多角形は重なっていない。すべての軸で区間が重なっていれば、多角形は重なっており、重なりがいちばん小さい軸の方向へ、その量だけ押し出せば離れる（最小移動ベクトル）。緑の多角形はドラッグで動かせる。",
  camera: {
    position: [0, 11, 5.5],
    target: [0, 0, 0.8],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "range",
      key: "angle",
      label: "緑の多角形の向き",
      min: -180,
      max: 180,
      step: 1,
      value: 20,
      format: (value) => `${value}°`,
    },
    {
      type: "toggle",
      key: "cycle",
      label: "軸を 1 本ずつ順に見せる",
      value: true,
    },
    {
      type: "toggle",
      key: "resolve",
      label: "重なったら押し出す",
      value: false,
    },
    { type: "toggle", key: "auto", label: "自動で動かす", value: true },
  ],
  legend: [
    { color: palette.lime, label: "多角形 A（ドラッグで動かせる）とその影" },
    { color: palette.sky, label: "多角形 B とその影" },
    { color: palette.amber, label: "今見ている軸" },
    { color: palette.coral, label: "最小移動ベクトル（重なっているとき）" },
  ],
  hint: "緑の多角形の中心の球をドラッグすると動かせます",
  setup(context) {
    const { scene, params } = context;
    const a = polygonMesh(palette.lime, 0.28);
    const b = polygonMesh(palette.sky, 0.28);
    scene.add(a.mesh, a.outline, b.mesh, b.outline);
    const grip = handle(palette.lime, 0.12);
    grip.position.set(-2.2, 0.1, 0.2);
    scene.add(grip);
    let dragging = 0;
    context.draggable(grip, {
      normal: [0, 1, 0],
      onDrag: () => {
        dragging = 3;
      },
    });
    const axisLine = segments([], palette.amber, {
      width: 1.5,
      opacity: 0.7,
      dashed: true,
    });
    const shadowA = segments([], palette.lime, { width: 7 });
    const shadowB = segments([], palette.sky, { width: 7 });
    const gap = segments([], palette.ink, { width: 3 });
    const guides = segments([], palette.muted, {
      width: 1,
      opacity: 0.6,
      dashed: true,
      dashSize: 0.08,
      gapSize: 0.08,
    });
    const mtv = arrow(palette.coral, { radius: 0.03, overlay: true });
    scene.add(axisLine, shadowA, shadowB, gap, guides, mtv);
    const axisLabel = context.label("", { color: palette.amber });
    scene.add(axisLabel);

    let cycleTime = 0;
    let bAngle = 0;

    return {
      update({ dt, time }) {
        dragging = Math.max(0, dragging - dt);
        if (params["auto"] === true && dragging === 0) {
          grip.position.set(
            Math.sin(time * 0.45) * 2.4,
            0.1,
            Math.cos(time * 0.3) * 0.9
          );
        }
        bAngle += dt * 0.15;
        const angleA = (Number(params["angle"]) * Math.PI) / 180;
        let polyA = transform(
          SHAPE_A,
          grip.position.x,
          grip.position.z,
          angleA
        );
        const polyB = transform(SHAPE_B, 0.4, 0.1, bAngle);
        const axes = [
          ...edgeNormals(polyA).map((n) => ({ n, owner: "A" })),
          ...edgeNormals(polyB).map((n) => ({ n, owner: "B" })),
        ];
        // すべての軸で投影を比べ、隙間（分離軸）と最小の重なりを探す
        let separating = -1;
        let smallest = Number.POSITIVE_INFINITY;
        let smallestAxis = 0;
        const results = axes.map(({ n }, i) => {
          const pa = project(polyA, n);
          const pb = project(polyB, n);
          const overlap = Math.min(pa.max, pb.max) - Math.max(pa.min, pb.min);
          if (overlap < 0 && separating < 0) {
            separating = i;
          }
          if (overlap < smallest) {
            smallest = overlap;
            smallestAxis = i;
          }
          return { pa, pb, overlap };
        });
        const colliding = separating < 0;
        let pushed = false;
        if (colliding && params["resolve"] === true) {
          const axis = axes[smallestAxis]?.n ?? { x: 1, y: 0 };
          const centerA = { x: grip.position.x, y: grip.position.z };
          const centerB = { x: 0.4, y: 0.1 };
          const sign =
            (centerA.x - centerB.x) * axis.x +
              (centerA.y - centerB.y) * axis.y <
            0
              ? -1
              : 1;
          grip.position.x += axis.x * smallest * sign;
          grip.position.z += axis.y * smallest * sign;
          polyA = transform(SHAPE_A, grip.position.x, grip.position.z, angleA);
          pushed = true;
        }
        a.set(polyA);
        b.set(polyB);

        cycleTime += dt;
        const shown =
          params["cycle"] === true
            ? Math.floor(cycleTime / 1.1) % axes.length
            : colliding
              ? smallestAxis
              : Math.max(0, separating);
        const current = axes[shown];
        const result = results[shown];
        if (current && result) {
          const { n } = current;
          const perp = { x: -n.y, y: n.x };
          // 軸は図形から AXIS_OFFSET だけ離した直線として描く
          const base = { x: perp.x * AXIS_OFFSET, y: perp.y * AXIS_OFFSET };
          const onAxis = (t: number) =>
            toWorld({ x: base.x + n.x * t, y: base.y + n.y * t }, 0.05);
          axisLine.setPoints([onAxis(-6), onAxis(6)]);
          shadowA.setPoints([onAxis(result.pa.min), onAxis(result.pa.max)]);
          shadowB.setPoints([onAxis(result.pb.min), onAxis(result.pb.max)]);
          const hasGap = result.overlap < 0;
          gap.visible = hasGap;
          if (hasGap) {
            const from = Math.min(result.pa.max, result.pb.max);
            const to = Math.max(result.pa.min, result.pb.min);
            gap.setPoints([onAxis(from).setY(0.08), onAxis(to).setY(0.08)]);
          }
          // 頂点から軸へ下ろした補助線（影の両端だけ）
          const extremes: Vector3[] = [];
          for (const poly of [polyA, polyB]) {
            const values = poly.map((p) => p.x * n.x + p.y * n.y);
            for (const value of [Math.min(...values), Math.max(...values)]) {
              const p = poly[values.indexOf(value)];
              if (p) {
                extremes.push(toWorld(p, 0.05), onAxis(value));
              }
            }
          }
          guides.setPoints(extremes);
          axisLabel.setText(
            `軸 ${shown + 1} / ${axes.length}（${current.owner} の辺の法線）：${hasGap ? "隙間あり → 分離軸" : `重なり ${result.overlap.toFixed(2)}`}`
          );
          axisLabel.position.copy(onAxis(-2.6)).setY(0.3);
        }
        mtv.visible = colliding && !pushed;
        if (colliding && !pushed) {
          const axis = axes[smallestAxis]?.n ?? { x: 1, y: 0 };
          const sign =
            (grip.position.x - 0.4) * axis.x +
              (grip.position.z - 0.1) * axis.y <
            0
              ? -1
              : 1;
          mtv.set(
            new Vector3(grip.position.x, 0.12, grip.position.z),
            new Vector3(
              axis.x * smallest * sign,
              0,
              axis.y * smallest * sign
            ).multiplyScalar(1.001)
          );
        }
        context.readout("判定", colliding ? "重なっている" : "離れている");
        context.readout(
          "分離軸",
          colliding
            ? "なし（全部の軸で重なる）"
            : `軸 ${separating + 1}（最初に見つかった隙間）`
        );
        context.readout(
          "最小の重なり",
          colliding ? `${smallest.toFixed(3)}（軸 ${smallestAxis + 1}）` : "—"
        );
        context.caption(
          colliding
            ? "両方の多角形の辺の法線（合わせて 9 本）のどれに投影しても、影が重なっている。凸多角形では、これが「重なっている」ことの証明になる。重なりがいちばん小さい軸の方向へ、その量だけ押し出せば離れる（赤い矢印、最小移動ベクトル）。"
            : "ある軸に投影したとき、2 つの影の間に隙間があれば（白い線）、その軸に垂直な直線で 2 つの多角形を分けられる。1 本見つかった時点で「重なっていない」と決まり、残りの軸は調べなくてよい。"
        );
      },
    };
  },
};
