import {
  CircleGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { TAU, palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const MAX = 700;
const WIDTH = 12;
const DEPTH = 6.4;

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  circle: boolean;
  /** 円なら半径、箱なら半分の幅と高さ。 */
  a: number;
  b: number;
  /** AABB の半分の大きさ（毎フレーム更新）。 */
  ex: number;
  ey: number;
};

/** 箱の 4 つの角。 */
const corners = (body: Body) => {
  const c = Math.cos(body.angle);
  const s = Math.sin(body.angle);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx = 0, sy = 0]) => ({
    x: body.x + sx * body.a * c - sy * body.b * s,
    y: body.y + sx * body.a * s + sy * body.b * c,
  }));
};

/** 詳細判定：円と円、円と箱、箱と箱（分離軸）。 */
function narrow(p: Body, q: Body) {
  if (p.circle && q.circle) {
    return Math.hypot(p.x - q.x, p.y - q.y) < p.a + q.a;
  }
  if (p.circle !== q.circle) {
    const circle = p.circle ? p : q;
    const box = p.circle ? q : p;
    // 円の中心を箱の座標へ回し、箱の中の最も近い点との距離を比べる
    const dx = circle.x - box.x;
    const dy = circle.y - box.y;
    const c = Math.cos(-box.angle);
    const s = Math.sin(-box.angle);
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    const cx = Math.max(-box.a, Math.min(box.a, lx));
    const cy = Math.max(-box.b, Math.min(box.b, ly));
    return Math.hypot(lx - cx, ly - cy) < circle.a;
  }
  const pa = corners(p);
  const pb = corners(q);
  for (const body of [p, q]) {
    for (const axis of [
      { x: Math.cos(body.angle), y: Math.sin(body.angle) },
      { x: -Math.sin(body.angle), y: Math.cos(body.angle) },
    ]) {
      const project = (points: { x: number; y: number }[]) =>
        points.map((point) => point.x * axis.x + point.y * axis.y);
      const ra = project(pa);
      const rb = project(pb);
      if (
        Math.max(...ra) < Math.min(...rb) ||
        Math.max(...rb) < Math.min(...ra)
      ) {
        return false;
      }
    }
  }
  return true;
}

const overlapAabb = (p: Body, q: Body) =>
  Math.abs(p.x - q.x) < p.ex + q.ex && Math.abs(p.y - q.y) < p.ey + q.ey;

type Method = "none" | "grid" | "sap";

export const demo: DemoModule = {
  alt: "衝突判定を、候補を大まかに絞る広域判定（ブロードフェーズ）と、候補だけを正確に調べる詳細判定（ナローフェーズ）の 2 段階に分けるデモ。広域判定なしでは、物体の数を N として N(N−1)/2 組すべてを正確に判定するので、物体が増えると時間が急に増える。格子やスイープ・アンド・プルーンで、AABB が重なりそうな組（青い線）だけに絞ってから、円や回転した箱の正確な判定をかけ、本当に接触した組（赤）を求める。右下のグラフは 1 フレームの判定にかかった時間。",
  camera: {
    position: [0, 10.5, 5],
    target: [0, 0, 0.2],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "select",
      key: "method",
      label: "広域判定",
      value: "grid",
      options: [
        { value: "none", label: "なし（全部の組を詳細判定）" },
        { value: "grid", label: "一様な格子" },
        { value: "sap", label: "スイープ・アンド・プルーン" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "物体の数",
      min: 50,
      max: MAX,
      step: 50,
      value: 300,
    },
    { type: "toggle", key: "lines", label: "候補の組を線で表示", value: true },
  ],
  legend: [
    { color: palette.sky, label: "広域判定で残った候補の組" },
    { color: palette.coral, label: "詳細判定で接触していた物体" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(17);
    const bodies: Body[] = Array.from({ length: MAX }, () => {
      const angle = random() * TAU;
      const circle = random() < 0.5;
      return {
        x: (random() - 0.5) * WIDTH,
        y: (random() - 0.5) * DEPTH,
        vx: Math.cos(angle) * 0.6,
        vy: Math.sin(angle) * 0.6,
        angle: random() * TAU,
        spin: (random() - 0.5) * 2,
        circle,
        a: circle ? 0.05 + random() * 0.08 : 0.05 + random() * 0.1,
        b: 0.04 + random() * 0.06,
        ex: 0,
        ey: 0,
      };
    });
    const circles = new InstancedMesh(
      new CircleGeometry(1, 20).rotateX(-Math.PI / 2),
      new MeshBasicMaterial(),
      MAX
    );
    const boxes = new InstancedMesh(
      new PlaneGeometry(2, 2).rotateX(-Math.PI / 2),
      new MeshBasicMaterial(),
      MAX
    );
    circles.frustumCulled = false;
    boxes.frustumCulled = false;
    scene.add(circles, boxes);
    const candidateLines = segments([], palette.sky, {
      width: 1,
      opacity: 0.6,
    });
    scene.add(candidateLines);
    const graph = historyGraph(context, {
      title: "1 フレームの判定時間（ミリ秒）",
      min: 0,
      max: 4,
      series: [{ color: palette.amber }],
    });
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const base = new Color("#8a97ab");
    const hit = new Color(palette.coral);
    let smoothed = 0;

    return {
      update({ dt }) {
        const count = Number(params["count"]);
        const { method: raw } = params;
        const method: Method = raw === "none" || raw === "sap" ? raw : "grid";
        for (let i = 0; i < count; i++) {
          const body = bodies[i];
          if (!body) {
            continue;
          }
          body.x += body.vx * dt;
          body.y += body.vy * dt;
          body.angle += body.spin * dt;
          if (Math.abs(body.x) > WIDTH / 2) {
            body.vx *= -1;
            body.x = Math.sign(body.x) * (WIDTH / 2);
          }
          if (Math.abs(body.y) > DEPTH / 2) {
            body.vy *= -1;
            body.y = Math.sign(body.y) * (DEPTH / 2);
          }
          if (body.circle) {
            body.ex = body.a;
            body.ey = body.a;
          } else {
            const c = Math.abs(Math.cos(body.angle));
            const s = Math.abs(Math.sin(body.angle));
            body.ex = body.a * c + body.b * s;
            body.ey = body.a * s + body.b * c;
          }
        }
        const start = performance.now();
        // 広域判定：候補の組を作る
        const candidates: [number, number][] = [];
        if (method === "none") {
          for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
              candidates.push([i, j]);
            }
          }
        } else if (method === "grid") {
          const cell = 0.4;
          const cells = new Map<number, number[]>();
          for (let i = 0; i < count; i++) {
            const body = bodies[i];
            if (!body) {
              continue;
            }
            // AABB がまたぐすべてのセルに登録する
            for (
              let gx = Math.floor((body.x - body.ex) / cell);
              gx <= Math.floor((body.x + body.ex) / cell);
              gx++
            ) {
              for (
                let gy = Math.floor((body.y - body.ey) / cell);
                gy <= Math.floor((body.y + body.ey) / cell);
                gy++
              ) {
                const key = (gx + 1000) * 4096 + (gy + 1000);
                const list = cells.get(key);
                if (list) {
                  list.push(i);
                } else {
                  cells.set(key, [i]);
                }
              }
            }
          }
          const seen = new Set<number>();
          for (const list of cells.values()) {
            for (let a = 0; a < list.length; a++) {
              for (let b = a + 1; b < list.length; b++) {
                const i = Math.min(list[a] ?? 0, list[b] ?? 0);
                const j = Math.max(list[a] ?? 0, list[b] ?? 0);
                const key = i * MAX + j;
                const p = bodies[i];
                const q = bodies[j];
                if (!seen.has(key) && p && q && overlapAabb(p, q)) {
                  seen.add(key);
                  candidates.push([i, j]);
                }
              }
            }
          }
        } else {
          const order = Array.from({ length: count }, (_, i) => i).toSorted(
            (i, j) =>
              (bodies[i]?.x ?? 0) -
              (bodies[i]?.ex ?? 0) -
              ((bodies[j]?.x ?? 0) - (bodies[j]?.ex ?? 0))
          );
          for (let a = 0; a < order.length; a++) {
            const p = bodies[order[a] ?? 0];
            if (!p) {
              continue;
            }
            for (let b = a + 1; b < order.length; b++) {
              const q = bodies[order[b] ?? 0];
              if (!q || q.x - q.ex > p.x + p.ex) {
                break;
              }
              if (Math.abs(p.y - q.y) < p.ey + q.ey) {
                candidates.push([order[a] ?? 0, order[b] ?? 0]);
              }
            }
          }
        }
        // 詳細判定：候補だけを正確に調べる
        const touching = new Set<number>();
        let contacts = 0;
        for (const [i, j] of candidates) {
          const p = bodies[i];
          const q = bodies[j];
          if (p && q && narrow(p, q)) {
            contacts++;
            touching.add(i);
            touching.add(j);
          }
        }
        const elapsed = performance.now() - start;
        smoothed += (elapsed - smoothed) * 0.1;
        graph.push([smoothed]);

        let circleCount = 0;
        let boxCount = 0;
        for (let i = 0; i < count; i++) {
          const body = bodies[i];
          if (!body) {
            continue;
          }
          const color = touching.has(i) ? hit : base;
          if (body.circle) {
            matrix
              .makeScale(body.a, 1, body.a)
              .setPosition(body.x, 0.02, body.y);
            circles.setMatrixAt(circleCount, matrix);
            circles.setColorAt(circleCount++, color);
          } else {
            rotation.setFromAxisAngle(up, -body.angle);
            matrix.compose(
              new Vector3(body.x, 0.02, body.y),
              rotation,
              new Vector3(body.a, 1, body.b)
            );
            boxes.setMatrixAt(boxCount, matrix);
            boxes.setColorAt(boxCount++, color);
          }
        }
        circles.count = circleCount;
        boxes.count = boxCount;
        for (const mesh of [circles, boxes]) {
          mesh.instanceMatrix.needsUpdate = true;
          if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
          }
        }
        const showLines = params["lines"] === true && candidates.length < 1500;
        candidateLines.visible = showLines && candidates.length > 0;
        if (showLines) {
          const points: Vector3[] = [];
          for (const [i, j] of candidates) {
            const p = bodies[i];
            const q = bodies[j];
            if (p && q) {
              points.push(
                new Vector3(p.x, 0.04, p.y),
                new Vector3(q.x, 0.04, q.y)
              );
            }
          }
          candidateLines.setPoints(points);
        }
        context.readout("全部の組", `${(count * (count - 1)) / 2}`);
        context.readout("詳細判定にかけた組", `${candidates.length}`);
        context.readout("接触していた組", `${contacts}`);
        context.readout("判定の時間", `${smoothed.toFixed(2)} ms`);
        context.caption(
          method === "none"
            ? "広域判定なしでは、すべての組に正確な判定をかける。組の数は物体の数の 2 乗に比例して増えるので、物体を増やすと時間が急に増える。接触しているのはほんの一部なのに、ほとんどの判定がむだになる。"
            : "広域判定で、AABB が重なりそうな組（青い線）だけに絞ってから、円や回転した箱の正確な判定をかける。候補の数は接触の数に近く、物体を増やしても時間はゆるやかにしか増えない。"
        );
      },
      dispose() {
        circles.dispose();
        boxes.dispose();
      },
    };
  },
};
