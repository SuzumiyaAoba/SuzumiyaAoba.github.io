import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { marker, palette, segments } from "../../kit";
import { delaunaySteps, uniqueEdges } from "../../delaunay";
import type { Point2 } from "../../delaunay";
import type { DemoModule } from "../../types";

/** なめらかな和集合（形のつなぎ目を丸める）。 */
function smoothMin(a: number, b: number, k: number) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

function capsule(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
  );
  return Math.hypot(px - ax - dx * t, py - ay - dy * t) - r;
}

/** ジンジャーブレッドマンのような人形の形（距離場、負が内側）。 */
function figure(x: number, y: number) {
  let d = Math.hypot(x, y - 2.25) - 0.85;
  d = smoothMin(d, capsule(x, y, 0, 1.1, 0, -0.9, 1), 0.35);
  for (const side of [-1, 1]) {
    d = smoothMin(
      d,
      capsule(x, y, side * 0.8, 0.8, side * 2.6, 1.35, 0.4),
      0.3
    );
    d = smoothMin(
      d,
      capsule(x, y, side * 0.5, -1.2, side * 0.95, -3.1, 0.46),
      0.3
    );
  }
  return d;
}

/** 2 頂点の組を 1 つの数にする（辺の重みの表のキー）。 */
function weightKey(a: number, b: number) {
  return a < b ? a * 100_000 + b : b * 100_000 + a;
}

const HANDLES = [
  { name: "左手", x: -2.6, y: 1.35, fixed: false },
  { name: "右手", x: 2.6, y: 1.35, fixed: false },
  { name: "頭", x: 0, y: 2.55, fixed: false },
  { name: "左足", x: -0.95, y: -3.1, fixed: true },
  { name: "右足", x: 0.95, y: -3.1, fixed: true },
] as const;

export const demo: DemoModule = {
  alt: "三角形でできた人形の手や頭をつかんで動かすと、各部分の形をなるべく崩さないように全体が曲がるARAP変形のデモ。三角形の網の各頂点について、周りの辺の向きに最もよく合う回転を求める（局所の一歩）と、その回転を使って全体の頂点の位置を解き直す（全体の一歩）を交互にくり返す。回転を考えない単純な方法では、腕を大きく回すと細長く伸びたりつぶれたりするが、ARAP では腕が太さを保ったまま曲がる。色は三角形の伸び縮みの大きさ。",
  camera: {
    position: [0, -0.2, 13],
    target: [0, -0.2, 0],
    orbit: false,
    fov: 40,
  },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "method",
      label: "変形の方法",
      value: "arap",
      options: [
        { value: "arap", label: "ARAP（なるべく回転だけで）" },
        { value: "laplacian", label: "回転を考えない（ラプラシアン）" },
      ],
    },
    { type: "toggle", key: "auto", label: "手を自動で動かす", value: true },
    {
      type: "range",
      key: "iterations",
      label: "1 フレームのくり返し",
      min: 1,
      max: 20,
      step: 1,
      value: 10,
    },
    { type: "toggle", key: "strain", label: "伸び縮みを色で表示", value: true },
    { type: "toggle", key: "wire", label: "三角形の辺を表示", value: true },
    { type: "button", key: "reset", label: "元の形に戻す" },
  ],
  legend: [
    { color: palette.amber, label: "つかめる点（手・頭）" },
    { color: palette.muted, label: "固定した点（足）" },
    { color: palette.coral, label: "伸び縮みが大きい三角形" },
  ],
  hint: "黄色い点をドラッグすると、手や頭を動かせます。",
  setup(context) {
    const { scene, params } = context;
    // 形の内側に点を並べ、ドロネー分割して、内側の三角形だけを使う
    const rest: Point2[] = [];
    const spacing = 0.3;
    for (let y = -3.8; y <= 3.4; y += spacing) {
      for (let x = -3.4; x <= 3.4; x += spacing) {
        const jx = x + ((Math.round(y / spacing) % 2) * spacing) / 2;
        if (figure(jx, y) < -0.08) {
          rest.push({ x: jx, y });
        }
      }
    }
    // 輪郭の点（距離場の 0 を角度方向に探す代わりに、輪郭の近くの点を押し戻して置く）
    for (let y = -3.8; y <= 3.4; y += spacing / 2) {
      for (let x = -3.4; x <= 3.4; x += spacing / 2) {
        const d = figure(x, y);
        if (Math.abs(d) < spacing * 0.3) {
          const e = 1e-3;
          const gx = (figure(x + e, y) - figure(x - e, y)) / (2 * e);
          const gy = (figure(x, y + e) - figure(x, y - e)) / (2 * e);
          const p = { x: x - gx * d, y: y - gy * d };
          if (
            rest.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > spacing * 0.6)
          ) {
            rest.push(p);
          }
        }
      }
    }
    const { triangles: all } = delaunaySteps(rest);
    const triangles = all.filter(([a, b, c]) => {
      const pa = rest[a];
      const pb = rest[b];
      const pc = rest[c];
      return (
        pa &&
        pb &&
        pc &&
        figure((pa.x + pb.x + pc.x) / 3, (pa.y + pb.y + pc.y) / 3) < 0
      );
    });
    const edges = uniqueEdges(triangles);
    const count = rest.length;
    const neighbors = Array.from({ length: count }, () => [] as number[]);
    for (const [a, b] of edges) {
      neighbors[a]?.push(b);
      neighbors[b]?.push(a);
    }
    // 余接（コタンジェント）重み：辺の向かいの角が大きいほど小さくなる。三角形の形の違いを正しく扱える
    const weights = new Map<string, number>();
    const addCot = (o: number, a: number, b: number) => {
      const po = rest[o];
      const pa = rest[a];
      const pb = rest[b];
      if (!po || !pa || !pb) {
        return;
      }
      const ux = pa.x - po.x;
      const uy = pa.y - po.y;
      const vx = pb.x - po.x;
      const vy = pb.y - po.y;
      const cot =
        (ux * vx + uy * vy) / Math.max(1e-9, Math.abs(ux * vy - uy * vx));
      const key = String(weightKey(a, b));
      weights.set(key, (weights.get(key) ?? 0) + cot / 2);
    };
    for (const [a, b, c] of triangles) {
      addCot(c, a, b);
      addCot(a, b, c);
      addCot(b, c, a);
    }
    const weight = (a: number, b: number) =>
      Math.max(0.05, weights.get(String(weightKey(a, b))) ?? 0.05);
    const current = rest.map((p) => ({ ...p }));
    const rotation = new Float64Array(count * 2); // cos, sin

    // つかむ点：近くの頂点をまとめて、つかんだ点と一緒に平行移動させる
    const handleVertices = HANDLES.map((handle) =>
      rest.flatMap((p, index) =>
        Math.hypot(p.x - handle.x, p.y - handle.y) < 0.32 ? [index] : []
      )
    );
    const constrained = new Int32Array(count).fill(-1);
    for (const [h, list] of handleVertices.entries()) {
      for (const index of list) {
        constrained[index] = h;
      }
    }
    const handleMarkers = HANDLES.map((handle) => {
      const ball = marker(handle.fixed ? palette.muted : palette.amber, 0.2);
      ball.position.set(handle.x, handle.y, 0.3);
      scene.add(ball);
      if (!handle.fixed) {
        context.draggable(ball, {
          normal: [0, 0, 1],
          clamp: (position) => {
            position.z = 0.3;
          },
          onDrag: () => {
            context.setParam("auto", false);
          },
        });
      }
      return ball;
    });

    const geometry = new BufferGeometry();
    const fill = new Mesh(
      geometry,
      new MeshBasicMaterial({ vertexColors: true })
    );
    scene.add(fill);
    const wire = segments([], "#2a1a10", { width: 1, opacity: 0.55 });
    wire.position.z = 0.01;
    scene.add(wire);
    const outline = segments([], palette.ink, {
      width: 1.2,
      opacity: 0.15,
      dashed: true,
    });
    outline.position.z = -0.01;
    scene.add(outline);
    const outlinePoints: Vector3[] = [];
    for (const [a, b] of edges) {
      const pa = rest[a];
      const pb = rest[b];
      if (pa && pb) {
        outlinePoints.push(
          new Vector3(pa.x, pa.y, 0),
          new Vector3(pb.x, pb.y, 0)
        );
      }
    }
    outline.setPoints(outlinePoints);

    /** 自由な頂点について、Lx = b を共役勾配法で解く（x 座標と y 座標は別々に）。 */
    const solveAxis = (axis: "x" | "y", rhs: Float64Array) => {
      const x = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        x[i] = current[i]?.[axis] ?? 0;
      }
      const apply = (v: Float64Array, out: Float64Array) => {
        for (let i = 0; i < count; i++) {
          if ((constrained[i] ?? -1) >= 0) {
            out[i] = 0;
            continue;
          }
          let sum = 0;
          for (const j of neighbors[i] ?? []) {
            const w = weight(i, j);
            sum += w * (v[i] ?? 0);
            if ((constrained[j] ?? -1) < 0) {
              sum -= w * (v[j] ?? 0);
            }
          }
          out[i] = sum;
        }
      };
      // 固定された隣の頂点の値は右辺へ移す
      const b = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        if ((constrained[i] ?? -1) >= 0) {
          continue;
        }
        let value = rhs[i] ?? 0;
        for (const j of neighbors[i] ?? []) {
          if ((constrained[j] ?? -1) >= 0) {
            value += weight(i, j) * (current[j]?.[axis] ?? 0);
          }
        }
        b[i] = value;
      }
      const r = new Float64Array(count);
      const Ap = new Float64Array(count);
      apply(x, Ap);
      for (let i = 0; i < count; i++) {
        r[i] = (constrained[i] ?? -1) >= 0 ? 0 : (b[i] ?? 0) - (Ap[i] ?? 0);
      }
      const p = Float64Array.from(r);
      let rr = r.reduce((sum, value) => sum + value * value, 0);
      for (let iteration = 0; iteration < 60 && rr > 1e-10; iteration++) {
        apply(p, Ap);
        let pAp = 0;
        for (let i = 0; i < count; i++) {
          pAp += (p[i] ?? 0) * (Ap[i] ?? 0);
        }
        const alpha = rr / (pAp || 1e-12);
        let next = 0;
        for (let i = 0; i < count; i++) {
          x[i] = (x[i] ?? 0) + alpha * (p[i] ?? 0);
          r[i] = (r[i] ?? 0) - alpha * (Ap[i] ?? 0);
          next += (r[i] ?? 0) * (r[i] ?? 0);
        }
        const beta = next / rr;
        rr = next;
        for (let i = 0; i < count; i++) {
          p[i] = (r[i] ?? 0) + beta * (p[i] ?? 0);
        }
      }
      for (let i = 0; i < count; i++) {
        const point = current[i];
        if (point && (constrained[i] ?? -1) < 0) {
          point[axis] = x[i] ?? 0;
        }
      }
    };

    const iterate = (useRotation: boolean) => {
      // 局所の一歩：各頂点で、元の辺を今の辺へ最もよく重ねる回転を求める
      for (let i = 0; i < count; i++) {
        let s00 = 0;
        let s01 = 0;
        let s10 = 0;
        let s11 = 0;
        const p = rest[i];
        const q = current[i];
        if (!p || !q) {
          continue;
        }
        for (const j of neighbors[i] ?? []) {
          const pj = rest[j];
          const qj = current[j];
          if (!pj || !qj) {
            continue;
          }
          const ex = p.x - pj.x;
          const ey = p.y - pj.y;
          const fx = q.x - qj.x;
          const fy = q.y - qj.y;
          const w = weight(i, j);
          s00 += w * ex * fx;
          s01 += w * ex * fy;
          s10 += w * ey * fx;
          s11 += w * ey * fy;
        }
        const angle = useRotation ? Math.atan2(s01 - s10, s00 + s11) : 0;
        rotation[i * 2] = Math.cos(angle);
        rotation[i * 2 + 1] = Math.sin(angle);
      }
      // 全体の一歩：両端の回転の平均で回した元の辺に、今の辺ができるだけ合うよう位置を解く
      const bx = new Float64Array(count);
      const by = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        const p = rest[i];
        if (!p) {
          continue;
        }
        for (const j of neighbors[i] ?? []) {
          const pj = rest[j];
          if (!pj) {
            continue;
          }
          const ex = p.x - pj.x;
          const ey = p.y - pj.y;
          const c = ((rotation[i * 2] ?? 1) + (rotation[j * 2] ?? 1)) / 2;
          const s =
            ((rotation[i * 2 + 1] ?? 0) + (rotation[j * 2 + 1] ?? 0)) / 2;
          const w = weight(i, j);
          bx[i] = (bx[i] ?? 0) + w * (c * ex - s * ey);
          by[i] = (by[i] ?? 0) + w * (s * ex + c * ey);
        }
      }
      solveAxis("x", bx);
      solveAxis("y", by);
    };

    const reset = () => {
      for (const [index, p] of rest.entries()) {
        const q = current[index];
        if (q) {
          q.x = p.x;
          q.y = p.y;
        }
      }
      for (const [h, handle] of HANDLES.entries()) {
        handleMarkers[h]?.position.set(handle.x, handle.y, 0.3);
      }
    };

    const colors = new Float32Array(triangles.length * 9);
    const positions = new Float32Array(triangles.length * 9);
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const dough = new Color("#c58a4f");
    const stretched = new Color(palette.coral);
    const squashed = new Color(palette.sky);
    const color = new Color();
    let clock = 0;
    return {
      action(key) {
        if (key === "reset") {
          reset();
        }
      },
      update({ dt }) {
        clock += dt;
        if (params["auto"] === true) {
          // 両手を肩の周りに大きく回し、頭を首の周りに少し傾ける（長さは変えない）
          const wave = clock * 1.3;
          const swing = (
            index: number,
            pivotX: number,
            pivotY: number,
            angle: number
          ) => {
            const handle = HANDLES[index];
            if (!handle) {
              return;
            }
            const dx = handle.x - pivotX;
            const dy = handle.y - pivotY;
            handleMarkers[index]?.position.set(
              pivotX + dx * Math.cos(angle) - dy * Math.sin(angle),
              pivotY + dx * Math.sin(angle) + dy * Math.cos(angle),
              0.3
            );
          };
          swing(0, -0.8, 0.9, Math.sin(wave) * 0.8 + 0.1);
          swing(1, 0.8, 0.9, -0.35 + Math.sin(wave * 0.8 + 1) * 0.75);
          swing(2, 0, 1.3, Math.sin(wave * 0.6) * 0.45);
        }
        // つかんだ点の周りの頂点を、つかんだ点と同じだけ平行移動させる
        for (const [h, list] of handleVertices.entries()) {
          const handle = HANDLES[h];
          const position = handleMarkers[h]?.position;
          if (!handle || !position) {
            continue;
          }
          for (const index of list) {
            const p = rest[index];
            const q = current[index];
            if (p && q) {
              q.x = p.x + position.x - handle.x;
              q.y = p.y + position.y - handle.y;
            }
          }
        }
        const useRotation = params["method"] === "arap";
        for (let n = 0; n < Number(params["iterations"]); n++) {
          iterate(useRotation);
        }
        // 描画：三角形ごとの伸び縮み（変形の特異値）で色を付ける
        const showStrain = params["strain"] === true;
        let worst = 0;
        const lines: Vector3[] = [];
        for (const [t, [a, b, c]] of triangles.entries()) {
          const pa = rest[a];
          const pb = rest[b];
          const pc = rest[c];
          const qa = current[a];
          const qb = current[b];
          const qc = current[c];
          if (!pa || !pb || !pc || !qa || !qb || !qc) {
            continue;
          }
          // 変形の行列 F = Q P⁻¹（辺ベクトルどうしの対応）
          const p00 = pb.x - pa.x;
          const p01 = pc.x - pa.x;
          const p10 = pb.y - pa.y;
          const p11 = pc.y - pa.y;
          const q00 = qb.x - qa.x;
          const q01 = qc.x - qa.x;
          const q10 = qb.y - qa.y;
          const q11 = qc.y - qa.y;
          const det = p00 * p11 - p01 * p10 || 1e-9;
          const f00 = (q00 * p11 - q01 * p10) / det;
          const f01 = (-q00 * p01 + q01 * p00) / det;
          const f10 = (q10 * p11 - q11 * p10) / det;
          const f11 = (-q10 * p01 + q11 * p00) / det;
          // 2×2 行列の特異値
          const e = (f00 + f11) / 2;
          const f = (f00 - f11) / 2;
          const g = (f10 + f01) / 2;
          const h = (f10 - f01) / 2;
          const qv = Math.hypot(e, h);
          const rv = Math.hypot(f, g);
          const s1 = qv + rv;
          const s2 = Math.abs(qv - rv);
          const strain = Math.max(s1 - 1, 1 - s2);
          worst = Math.max(worst, strain);
          color.copy(dough);
          if (showStrain) {
            color.lerp(
              s1 - 1 > 1 - s2 ? stretched : squashed,
              Math.min(1, Math.max(0, strain - 0.12) * 2)
            );
          }
          for (const [k, q] of [qa, qb, qc].entries()) {
            positions.set([q.x, q.y, 0], t * 9 + k * 3);
            colors.set([color.r, color.g, color.b], t * 9 + k * 3);
          }
        }
        if (params["wire"] === true) {
          for (const [a, b] of edges) {
            const qa = current[a];
            const qb = current[b];
            if (qa && qb) {
              lines.push(
                new Vector3(qa.x, qa.y, 0),
                new Vector3(qb.x, qb.y, 0)
              );
            }
          }
        }
        wire.visible = params["wire"] === true;
        wire.setPoints(lines);
        geometry.getAttribute("position").needsUpdate = true;
        geometry.getAttribute("color").needsUpdate = true;
        geometry.computeBoundingSphere();
        context.readout("頂点 / 三角形", `${count} / ${triangles.length}`);
        context.readout(
          "いちばん大きい伸び縮み",
          `${Math.round(worst * 100)}%`
        );
        context.caption(
          useRotation
            ? "各頂点の周りを「回転してから少し動かしただけ」に近づけるよう解いている。腕を大きく回しても、腕の太さや三角形の形がほとんど変わらず、関節のない柔らかい人形が自然に曲がる。色が付くのは、どうしても伸び縮みが必要な所だけ。"
            : "回転を考えず、元の辺の向きのまま合わせようとすると、腕を回したときに腕全体が引き伸ばされたりつぶれたりする（赤は伸び、青は縮み）。ARAP は、この「向きのずれ」を回転として許すことで形を保つ。"
        );
      },
    };
  },
};
