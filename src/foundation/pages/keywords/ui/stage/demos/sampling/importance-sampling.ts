import { Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from "three";
import { palette, pointCloud, polyline, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const WIDTH = 8;
const X0 = -WIDTH / 2;
const TOP_BASE = 0.3;
const TOP_HEIGHT = 2.5;
const BOTTOM_BASE = -3;
const BOTTOM_HEIGHT = 2.6;
const BINS = 128;
const HIST = 32;
const TICKS = 240;
const PATHS = 5;
const BATCH = 16;

/** 地平線に沿った空の明るさ：なだらかな空と、明るく細い太陽。 */
const sky = (x: number) =>
  0.12 +
  0.25 * Math.exp(-(((x - 0.45) / 0.25) ** 2)) +
  Math.exp(-(((x - 0.72) / 0.025) ** 2));
const decoy = (x: number) => 0.12 + Math.exp(-(((x - 0.28) / 0.06) ** 2));

type Proposal = "uniform" | "matched" | "mismatched";

/** 区分定数の分布表（環境マップの重要度サンプリングと同じ作り）。 */
function table(weight: (x: number) => number) {
  const pdf = new Float64Array(BINS);
  const cdf = new Float64Array(BINS + 1);
  let total = 0;
  for (let i = 0; i < BINS; i++) {
    pdf[i] = weight((i + 0.5) / BINS);
    total += pdf[i] ?? 0;
  }
  for (let i = 0; i < BINS; i++) {
    const w = (pdf[i] ?? 0) / total;
    cdf[i + 1] = (cdf[i] ?? 0) + w;
    // 確率密度（区間の幅 1/BINS で割る）
    pdf[i] = w * BINS;
  }
  cdf[BINS] = 1;
  /** 逆 CDF：u が入る区間を二分探索し、区間の中は直線で補間する。 */
  const sample = (u: number) => {
    let low = 0;
    let high = BINS;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if ((cdf[middle] ?? 0) <= u) {
        low = middle;
      } else {
        high = middle;
      }
    }
    const start = cdf[low] ?? 0;
    const width = (cdf[low + 1] ?? 1) - start;
    const x = (low + (width > 0 ? (u - start) / width : 0.5)) / BINS;
    return Math.min(1 - 1e-6, Math.max(0, x));
  };
  const density = (x: number) =>
    pdf[Math.min(BINS - 1, Math.floor(x * BINS))] ?? 0;
  const cumulative = (x: number) => {
    const position = x * BINS;
    const index = Math.min(BINS - 1, Math.floor(position));
    const start = cdf[index] ?? 0;
    return start + ((cdf[index + 1] ?? 1) - start) * (position - index);
  };
  return { sample, density, cumulative };
}

const TABLES: Record<Proposal, ReturnType<typeof table>> = {
  uniform: table(() => 1),
  matched: table(sky),
  mismatched: table(decoy),
};

const truth = (() => {
  let sum = 0;
  const steps = 20_000;
  for (let i = 0; i < steps; i++) {
    sum += sky((i + 0.5) / steps);
  }
  return sum / steps;
})();

const sx = (x: number) => X0 + x * WIDTH;

const CAPTIONS: Record<Proposal, string> = {
  uniform:
    "一様に選ぶと、CDF は斜めの直線になり、u がそのまま x になる。明るい太陽に当たるのはごくまれで、当たった回だけ見積もりが跳ね上がるので、ノイズが大きい。",
  matched:
    "明るさと同じ形の分布を選ぶと、CDF は太陽の所で急に立ち上がる。縦軸の u を一様に選んで横へ読むと、太陽の付近に多くの x が集まる。寄与を確率密度で割る（f/p）ので、どの標本もほぼ同じ値になり、ばらつきが小さい。",
  mismatched:
    "明るさと違う形の分布（的外れな所を重視）を選ぶと、太陽に当たる確率がかえって下がる。まれに当たると f/p が非常に大きくなり、一様より悪くなる。重要度サンプリングは、分布の選び方しだいで効果が逆転する。",
};

export const demo: DemoModule = {
  alt: "地平線に沿った空の明るさ（細く明るい太陽を含む）の合計を、少ない標本で見積もるデモ。上のグラフが明るさ f と、標本を選ぶ確率密度 p（黄緑の点線）と、実際に選ばれた標本のヒストグラム。下のグラフが累積分布関数（CDF）で、縦軸の一様な乱数 u を横に読んで x を得る（逆 CDF 法）。明るさと同じ形の分布で選ぶと、太陽の付近に標本が集まり、見積もりのばらつきが小さくなる。形が合わない分布を選ぶと、かえって悪くなる。",
  camera: {
    position: [0, -0.2, 11.5],
    target: [0, -0.2, 0],
    orbit: false,
    fov: 42,
  },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "proposal",
      label: "標本を選ぶ分布 p",
      value: "matched",
      options: [
        { value: "uniform", label: "一様" },
        { value: "matched", label: "明るさと同じ形（重要度）" },
        { value: "mismatched", label: "形が合わない分布" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "1 秒に選ぶ標本の数",
      min: 1,
      max: 60,
      step: 1,
      value: 20,
    },
    { type: "button", key: "clear", label: "ヒストグラムを消す" },
  ],
  legend: [
    { color: palette.amber, label: "明るさ f（太陽は右の細い山）" },
    { color: palette.lime, label: "確率密度 p（高さは f とそろえて表示）" },
    { color: palette.sky, label: "選ばれた標本のヒストグラム" },
    { color: palette.violet, label: "CDF と、u → x の読み取り" },
  ],
  setup(context) {
    const { scene, params } = context;
    const axes = segments(
      [
        new Vector3(X0, TOP_BASE, 0),
        new Vector3(X0 + WIDTH, TOP_BASE, 0),
        new Vector3(X0, BOTTOM_BASE, 0),
        new Vector3(X0 + WIDTH, BOTTOM_BASE, 0),
        new Vector3(X0, BOTTOM_BASE, 0),
        new Vector3(X0, BOTTOM_BASE + BOTTOM_HEIGHT, 0),
        new Vector3(X0 - 0.08, BOTTOM_BASE + BOTTOM_HEIGHT, 0),
        new Vector3(X0 + WIDTH, BOTTOM_BASE + BOTTOM_HEIGHT, 0),
      ],
      palette.muted,
      { width: 1.2, opacity: 0.8 }
    );
    scene.add(axes);
    const labels: [string, number, number][] = [
      ["明るさ f と確率密度 p", X0 + 1.3, TOP_BASE + TOP_HEIGHT + 0.35],
      ["累積分布 CDF（縦軸 u = 0〜1）", 0, BOTTOM_BASE + BOTTOM_HEIGHT + 0.3],
      ["u", X0 - 0.35, BOTTOM_BASE + BOTTOM_HEIGHT / 2],
      ["x", X0 + WIDTH + 0.3, BOTTOM_BASE],
    ];
    for (const [text, x, y] of labels) {
      const label = context.label(text, { tone: "muted" });
      label.position.set(x, y, 0);
      scene.add(label);
    }

    let fMax = 0;
    for (let i = 0; i <= 400; i++) {
      fMax = Math.max(fMax, sky(i / 400));
    }
    const curve = (fn: (x: number) => number, base: number, scale: number) =>
      Array.from(
        { length: 401 },
        (_, i) => new Vector3(sx(i / 400), base + fn(i / 400) * scale, 0.02)
      );
    scene.add(
      polyline(curve(sky, TOP_BASE, TOP_HEIGHT / fMax), palette.amber, {
        width: 3,
      })
    );
    const pdfLine = polyline([], palette.lime, {
      width: 2,
      dashed: true,
      dashSize: 0.1,
      gapSize: 0.07,
    });
    const cdfLine = polyline([], palette.violet, { width: 3 });
    scene.add(pdfLine, cdfLine);

    const barGeometry = new PlaneGeometry(1, 1);
    barGeometry.translate(0, 0.5, 0);
    const barMaterial = new MeshBasicMaterial({
      color: palette.sky,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const bars = Array.from({ length: HIST }, (_, i) => {
      const bar = new Mesh(barGeometry, barMaterial);
      bar.position.set(sx((i + 0.5) / HIST), TOP_BASE, 0.01);
      bar.scale.set((WIDTH / HIST) * 0.9, 1e-3, 1);
      scene.add(bar);
      return bar;
    });
    const ticks = pointCloud(TICKS, { size: 7, color: palette.sky });
    ticks.position.z = 0.04;
    scene.add(ticks);
    const reads = Array.from({ length: PATHS }, (_, index) => {
      const line = polyline([], palette.violet, {
        width: 1.6,
        opacity: 1 - index * 0.17,
        dashed: true,
        dashSize: 0.08,
        gapSize: 0.06,
      });
      scene.add(line);
      return line;
    });
    const graph = historyGraph(context, {
      title: `${BATCH} 標本での見積もり（点線が正解）`,
      min: 0,
      max: truth * 2.5,
      length: 90,
      series: [
        { color: palette.coral, label: "一様" },
        { color: palette.lime, label: "選んだ分布" },
        { color: palette.ink, dashed: true },
      ],
    });

    const random = rng(21);
    const histogram = new Float64Array(HIST);
    const recent: number[] = [];
    const paths: { u: number; x: number }[] = [];
    const estimates: Record<"uniform" | "chosen", number[]> = {
      uniform: [],
      chosen: [],
    };
    let proposal: Proposal | null = null;
    let sampled = 0;
    let budget = 0;
    let timer = 0;

    const resetHistogram = () => {
      histogram.fill(0);
      sampled = 0;
      recent.length = 0;
      paths.length = 0;
    };
    const estimate = (chosen: Proposal) => {
      const { sample, density } = TABLES[chosen];
      let sum = 0;
      for (let k = 0; k < BATCH; k++) {
        const x = sample(random());
        sum += sky(x) / density(x);
      }
      return sum / BATCH;
    };
    const spread = (values: readonly number[]) => {
      if (values.length < 2) {
        return 0;
      }
      let mean = 0;
      for (const value of values) {
        mean += value / values.length;
      }
      let squares = 0;
      for (const value of values) {
        squares += (value - mean) ** 2;
      }
      return Math.sqrt(squares / (values.length - 1)) / truth;
    };

    return {
      update({ dt }) {
        const next = params["proposal"];
        const chosen: Proposal =
          next === "uniform" || next === "mismatched" ? next : "matched";
        const { sample, density, cumulative } = TABLES[chosen];
        let pMax = 0;
        for (let i = 0; i < BINS; i++) {
          pMax = Math.max(pMax, density((i + 0.5) / BINS));
        }
        const pScale = TOP_HEIGHT / Math.max(pMax, 1.2);
        if (chosen !== proposal) {
          proposal = chosen;
          resetHistogram();
          estimates.uniform.length = 0;
          estimates.chosen.length = 0;
          pdfLine.setPoints(curve(density, TOP_BASE, pScale));
          cdfLine.setPoints(curve(cumulative, BOTTOM_BASE, BOTTOM_HEIGHT));
        }

        budget += dt * Number(params["speed"]);
        while (budget >= 1) {
          budget -= 1;
          const u = random();
          const x = sample(u);
          histogram[Math.min(HIST - 1, Math.floor(x * HIST))] =
            (histogram[Math.min(HIST - 1, Math.floor(x * HIST))] ?? 0) + 1;
          sampled++;
          recent.push(x);
          if (recent.length > TICKS) {
            recent.shift();
          }
          paths.unshift({ u, x });
          if (paths.length > PATHS) {
            paths.pop();
          }
        }
        for (const [i, bar] of bars.entries()) {
          // ヒストグラムを確率密度の単位にそろえる
          const value =
            sampled > 0 ? ((histogram[i] ?? 0) / sampled) * HIST : 0;
          bar.scale.y = Math.min(
            TOP_HEIGHT * 1.1,
            Math.max(1e-3, value * pScale)
          );
        }
        for (const [i, x] of recent.entries()) {
          ticks.positions.set([sx(x), TOP_BASE - 0.12, 0], i * 3);
        }
        ticks.geometry.setDrawRange(0, recent.length);
        ticks.commit();
        for (const [i, line] of reads.entries()) {
          const path = paths[i];
          line.visible = path !== undefined;
          if (path) {
            const y = BOTTOM_BASE + path.u * BOTTOM_HEIGHT;
            line.setPoints([
              new Vector3(X0, y, 0.03),
              new Vector3(sx(path.x), y, 0.03),
              new Vector3(sx(path.x), BOTTOM_BASE, 0.03),
              new Vector3(sx(path.x), TOP_BASE - 0.12, 0.03),
            ]);
          }
        }

        timer -= dt;
        if (timer <= 0) {
          timer = 0.12;
          estimates.uniform.push(estimate("uniform"));
          estimates.chosen.push(estimate(chosen));
          for (const list of [estimates.uniform, estimates.chosen]) {
            if (list.length > 90) {
              list.shift();
            }
          }
          graph.push([
            estimates.uniform.at(-1) ?? 0,
            estimates.chosen.at(-1) ?? 0,
            truth,
          ]);
        }
        context.readout("選んだ標本の数", `${sampled}`);
        context.readout(
          "ばらつき（正解に対する割合：一様 / 選んだ分布）",
          `${(spread(estimates.uniform) * 100).toFixed(0)}% / ${(spread(estimates.chosen) * 100).toFixed(0)}%`
        );
        context.caption(CAPTIONS[chosen]);
      },
      action(key) {
        if (key === "clear") {
          resetHistogram();
        }
      },
      dispose() {
        barGeometry.dispose();
        barMaterial.dispose();
      },
    };
  },
};
