import {
  CircleGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { TAU, marker, palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const BOARD = 3.3;
const MAX = 500;
const BINS = 28;
const RANGE = 3.5;
/** 2 次元の正規分布で、半径 kσ の円の内側に入る割合 1 - e^{-k²/2}。 */
const INSIDE = [1, 2, 3].map((k) => 1 - Math.exp((-k * k) / 2));

type Method = "gaussian" | "irwin" | "square" | "disk";
const isMethod = (value: unknown): value is Method =>
  value === "gaussian" ||
  value === "irwin" ||
  value === "square" ||
  value === "disk";

/** 平均 0、分散 1 になる 2 つの値を作る（方法ごと）。 */
function offset(method: Method, random: () => number): [number, number] {
  switch (method) {
    case "gaussian": {
      // ボックス＝ミュラー法：半径 √(-2 ln u1)、角度 2π u2
      const u1 = Math.max(1e-12, random());
      const radius = Math.sqrt(-2 * Math.log(u1));
      const angle = TAU * random();
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    }
    case "irwin": {
      // 一様乱数 3 個の和（中心極限定理でつりがね形に近づく）。分散 3/12 を 1 にそろえる
      const sum = () => (random() + random() + random() - 1.5) * 2;
      return [sum(), sum()];
    }
    case "square": {
      // 分散 1 の一様分布は ±√3
      const s = Math.sqrt(3);
      return [(random() * 2 - 1) * s, (random() * 2 - 1) * s];
    }
    case "disk": {
      // 半径 2 の円盤に一様（各軸の分散が 1）
      const r = 2 * Math.sqrt(random());
      const angle = TAU * random();
      return [r * Math.cos(angle), r * Math.sin(angle)];
    }
    default: {
      return [0, 0];
    }
  }
}

const normal = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(TAU);

const CAPTIONS: Record<Method, string> = {
  gaussian:
    "ボックス＝ミュラー法で作った正規分布。弾の多くは中心の近くに集まり、外れるほどまれになる。1σ の円に約 39%、2σ に約 86%、3σ に約 99% が入る（2 次元の場合）。下のヒストグラムは横方向のずれで、つりがね形になる。",
  irwin:
    "一様乱数を 3 個足しただけでも、中心極限定理により、つりがね形にかなり近づく。計算が軽いので、見た目のばらつきには十分なことが多い。ただし、±3σ より外には決して出ない。",
  square:
    "同じ分散の一様分布。四角い範囲にまんべんなく散らばり、中心に集まらないので、狙いの感じがしない。範囲の端にも中心と同じ確率で当たる。",
  disk: "同じ分散の、円盤に一様な分布。形は丸いが、中心への集まりがなく、ふちにくっきりとした境目ができて不自然に見える。",
};

export const demo: DemoModule = {
  alt: "的に向けて撃った弾のばらつきを、正規分布（ガウス分布）で作るデモ。ボックス＝ミュラー法で作ったずれは、中心に多く集まり、外へ行くほどまれになる。一様乱数を 3 個足す方法でも、つりがね形に近くなる。同じ大きさのばらつき（分散）でも、一様分布では四角い範囲にまんべんなく散らばり、円盤に一様な分布では、ふちに境目ができる。1σ・2σ・3σ の円に入った弾の割合と、横方向のずれのヒストグラムで比べられる。",
  camera: { position: [0, 0.6, 10.5], target: [0, 0, 0], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "method",
      label: "ばらつきの作り方",
      value: "gaussian",
      options: [
        { value: "gaussian", label: "正規分布（ボックス＝ミュラー）" },
        { value: "irwin", label: "一様乱数 3 個の和" },
        { value: "square", label: "一様（四角）" },
        { value: "disk", label: "一様（円盤）" },
      ],
    },
    {
      type: "range",
      key: "sigma",
      label: "ばらつきの大きさ σ",
      min: 0.2,
      max: 1,
      step: 0.05,
      value: 0.7,
    },
    {
      type: "range",
      key: "rate",
      label: "1 秒に撃つ弾の数",
      min: 2,
      max: 120,
      step: 2,
      value: 30,
    },
    { type: "button", key: "clear", label: "的をきれいにする" },
  ],
  legend: [
    { color: palette.coral, label: "最新の弾" },
    { color: palette.amber, label: "1σ・2σ・3σ の円" },
    { color: palette.sky, label: "横方向のずれのヒストグラム" },
  ],
  setup(context) {
    const { scene, params } = context;
    const board = new Mesh(
      new CircleGeometry(BOARD, 96),
      new MeshStandardMaterial({ color: "#d9d2c3", roughness: 0.9 })
    );
    board.receiveShadow = true;
    scene.add(board);
    const back = new Mesh(
      new CircleGeometry(BOARD + 0.12, 96),
      new MeshStandardMaterial({ color: "#5b4a3a", roughness: 0.8 })
    );
    back.position.z = -0.02;
    scene.add(back);
    const bullseye = new Mesh(
      new CircleGeometry(0.12, 32),
      new MeshBasicMaterial({ color: palette.coral })
    );
    bullseye.position.z = 0.005;
    scene.add(bullseye);
    const cross = segments(
      [
        new Vector3(-BOARD, 0, 0.004),
        new Vector3(BOARD, 0, 0.004),
        new Vector3(0, -BOARD, 0.004),
        new Vector3(0, BOARD, 0.004),
      ],
      "#8f8676",
      { width: 1 }
    );
    scene.add(cross);
    const ringLines = segments([], palette.amber, { width: 2.2 });
    scene.add(ringLines);
    const ringLabels = [1, 2, 3].map((k) => {
      const label = context.label(`${k}σ`, { color: palette.amber });
      scene.add(label);
      return label;
    });

    const holes = new InstancedMesh(
      new CircleGeometry(0.04, 12),
      new MeshBasicMaterial({ color: "#1d232c" }),
      MAX
    );
    holes.count = 0;
    holes.frustumCulled = false;
    holes.position.z = 0.01;
    scene.add(holes);
    const latest = marker(palette.coral, 0.08);
    latest.visible = false;
    scene.add(latest);
    const graph = hudGraph(context, {
      title: "横方向のずれ（点線が正規分布）",
      min: 0,
      max: 0.6,
      xLabel: "-3.5σ 〜 +3.5σ",
      samples: BINS * 6,
    });

    const random = rng(8);
    const shots: [number, number][] = [];
    let cursor = 0;
    let budget = 0;
    let method: Method = "gaussian";
    let sigma = 0;
    const matrix = new Matrix4();

    const clear = () => {
      shots.length = 0;
      cursor = 0;
      holes.count = 0;
      latest.visible = false;
    };

    return {
      update({ dt }) {
        const next = params["method"];
        if (isMethod(next) && next !== method) {
          method = next;
          clear();
        }
        const nextSigma = Number(params["sigma"]);
        if (nextSigma !== sigma) {
          sigma = nextSigma;
          clear();
          const points: Vector3[] = [];
          for (const k of [1, 2, 3]) {
            const r = k * sigma;
            for (let s = 0; s < 96; s++) {
              const a0 = (s / 96) * TAU;
              const a1 = ((s + 1) / 96) * TAU;
              points.push(
                new Vector3(Math.cos(a0) * r, Math.sin(a0) * r, 0.006),
                new Vector3(Math.cos(a1) * r, Math.sin(a1) * r, 0.006)
              );
            }
          }
          ringLines.setPoints(points);
          for (const [index, label] of ringLabels.entries()) {
            const r = (index + 1) * sigma;
            label.position.set(r * 0.72, r * 0.72, 0.05);
            label.visible = r < BOARD;
          }
        }
        budget += dt * Number(params["rate"]);
        while (budget >= 1) {
          budget -= 1;
          const [x, y] = offset(method, random);
          const shot: [number, number] = [x, y];
          if (shots.length < MAX) {
            shots.push(shot);
          } else {
            shots[cursor] = shot;
          }
          const slot = shots.length < MAX ? shots.length - 1 : cursor;
          cursor = (cursor + 1) % MAX;
          matrix.makeTranslation(x * sigma, y * sigma, 0);
          holes.setMatrixAt(slot, matrix);
          holes.count = shots.length;
          holes.instanceMatrix.needsUpdate = true;
          latest.position.set(x * sigma, y * sigma, 0.05);
          latest.visible = Math.hypot(x * sigma, y * sigma) < BOARD;
        }

        const inside = [0, 0, 0];
        const histogram = new Float64Array(BINS);
        for (const [x, y] of shots) {
          const r = Math.hypot(x, y);
          for (let k = 0; k < 3; k++) {
            if (r <= k + 1) {
              inside[k] = (inside[k] ?? 0) + 1;
            }
          }
          const bin = Math.floor(((x + RANGE) / (2 * RANGE)) * BINS);
          if (bin >= 0 && bin < BINS) {
            histogram[bin] = (histogram[bin] ?? 0) + 1;
          }
        }
        const count = Math.max(1, shots.length);
        const binWidth = (2 * RANGE) / BINS;
        graph.setSeries([
          {
            color: palette.sky,
            fn: (t) =>
              shots.length === 0
                ? 0
                : (histogram[Math.min(BINS - 1, Math.floor(t * BINS))] ?? 0) /
                  count /
                  binWidth,
          },
          {
            color: palette.ink,
            dashed: true,
            fn: (t) => normal(-RANGE + t * 2 * RANGE),
          },
        ]);
        graph.setMarker(0.5);
        context.readout("弾の数", `${shots.length}`);
        context.readout(
          "円の内側に入った割合（1σ / 2σ / 3σ）",
          shots.length === 0
            ? "—"
            : inside
                .map((value) => `${((value / count) * 100).toFixed(0)}%`)
                .join(" / ")
        );
        context.readout(
          "正規分布なら",
          INSIDE.map((value) => `${(value * 100).toFixed(0)}%`).join(" / ")
        );
        context.caption(CAPTIONS[method]);
      },
      action(key) {
        if (key === "clear") {
          clear();
        }
      },
      dispose() {
        holes.dispose();
      },
    };
  },
};
