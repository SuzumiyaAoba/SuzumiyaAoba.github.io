import { diagramPanel, svg } from "../../arena";
import { palette, pointCloud, rng } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const SHOWN = 30_000;
const HALF = 3;

/** 配列の構造体（AoS）：粒子 1 個の全部の値を 1 つのオブジェクトにまとめる。 */
type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  life: number;
  size: number;
  id: number;
};

const FIELDS = [
  "x",
  "y",
  "z",
  "vx",
  "vy",
  "vz",
  "r",
  "g",
  "b",
  "life",
  "size",
  "id",
] as const;
const TOUCHED = new Set(["x", "y", "z", "vx", "vy", "vz"]);

export const demo: DemoModule = {
  alt: "同じ種類のデータを 1 本の配列にまとめる構造体の配列（SoA）と、粒子ごとにすべての値をまとめる配列の構造体（AoS）とで、大量の粒子の位置の更新にかかる時間を実際に測るデモ。位置の更新では、12 個ある値のうち位置と速度の 6 個しか使わない。SoA なら、使う値だけがメモリに隙間なく並ぶので、CPU のキャッシュに読み込んだデータがむだにならず、ループも単純になる。AoS（ここでは JavaScript のオブジェクトの配列）では、使わない値も一緒に読み込み、オブジェクトごとにメモリの別の場所を参照するので遅くなる。",
  camera: { position: [0, 3, 9], target: [0, 0, 0], fov: 45, autoRotate: 8 },
  studio: { floor: false, background: "#0a0f17" },
  controls: [
    {
      type: "select",
      key: "layout",
      label: "データの並べ方",
      value: "soa",
      options: [
        { value: "aos", label: "AoS：粒子ごとのオブジェクト" },
        { value: "soa", label: "SoA：値の種類ごとの配列" },
      ],
    },
    {
      type: "select",
      key: "count",
      label: "粒子の数",
      value: "500000",
      options: [
        { value: "100000", label: "10 万" },
        { value: "500000", label: "50 万" },
        { value: "1000000", label: "100 万" },
      ],
    },
  ],
  legend: [
    { color: palette.lime, label: "更新で使う値（位置・速度）" },
    { color: "#3a4352", label: "使わない値（色・寿命など）" },
    { color: palette.amber, label: "キャッシュライン（64 バイト）の区切り" },
  ],
  setup(context) {
    const { scene, params } = context;
    const dots = pointCloud(SHOWN, { size: 3, color: palette.sky });
    scene.add(dots);
    const graph = historyGraph(context, {
      title: "1 フレームの更新時間（ミリ秒、実測）",
      min: 0,
      max: 12,
      series: [{ color: palette.amber }],
    });

    // メモリの並びの図
    const { root } = diagramPanel(context, {
      title: "メモリの並び（1 マス = 4 バイト）",
      width: 330,
      height: 120,
      rem: 18,
    });
    const drawLayout = (layout: string) => {
      root.replaceChildren();
      const cell = 10;
      const rows =
        layout === "soa"
          ? ["x", "y", "z", "vx", "r", "life"]
          : ["粒子 0", "粒子 1", "粒子 2", "粒子 3"];
      for (const [row, name] of rows.entries()) {
        const y = 6 + row * 18;
        root.append(
          svg("text", { x: 0, y: y + 9, fill: "#8f9eb3", "font-size": 9 }, name)
        );
        for (let k = 0; k < 24; k++) {
          const field =
            layout === "soa" ? name : (FIELDS[k % FIELDS.length] ?? "x");
          const used = TOUCHED.has(field);
          root.append(
            svg("rect", {
              x: 40 + k * (cell + 1),
              y,
              width: cell,
              height: 12,
              fill: used ? palette.lime : "#3a4352",
              "fill-opacity": used ? 0.85 : 1,
            })
          );
        }
        // 64 バイト = 16 マスごとの区切り
        root.append(
          svg("line", {
            x1: 40 + 16 * (cell + 1) - 1,
            y1: y - 2,
            x2: 40 + 16 * (cell + 1) - 1,
            y2: y + 14,
            stroke: palette.amber,
            "stroke-width": 1.5,
          })
        );
      }
    };

    let count = 0;
    let layout = "";
    let objects: Particle[] = [];
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let pz = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let vz = new Float32Array(0);
    // 使わない値も SoA 側に持っておく（同じデータ量で比べる）
    let extra = new Float32Array(0);
    let smoothed = 0;

    const build = () => {
      const random = rng(4);
      px = new Float32Array(count);
      py = new Float32Array(count);
      pz = new Float32Array(count);
      vx = new Float32Array(count);
      vy = new Float32Array(count);
      vz = new Float32Array(count);
      extra = new Float32Array(count * 6);
      objects = [];
      for (let i = 0; i < count; i++) {
        const p = {
          x: (random() * 2 - 1) * HALF,
          y: (random() * 2 - 1) * HALF,
          z: (random() * 2 - 1) * HALF,
          vx: (random() * 2 - 1) * 1.5,
          vy: (random() * 2 - 1) * 1.5,
          vz: (random() * 2 - 1) * 1.5,
          r: random(),
          g: random(),
          b: random(),
          life: random(),
          size: random(),
          id: i,
        };
        objects.push(p);
        px[i] = p.x;
        py[i] = p.y;
        pz[i] = p.z;
        vx[i] = p.vx;
        vy[i] = p.vy;
        vz[i] = p.vz;
        extra.set([p.r, p.g, p.b, p.life, p.size, p.id], i * 6);
      }
    };

    return {
      update({ dt }) {
        const nextCount = Number(params["count"]);
        const nextLayout = String(params["layout"]);
        if (nextCount !== count) {
          count = nextCount;
          build();
        }
        if (nextLayout !== layout) {
          layout = nextLayout;
          drawLayout(layout);
        }
        const step = Math.min(dt, 1 / 30);
        const start = performance.now();
        if (layout === "soa") {
          for (let i = 0; i < count; i++) {
            let x = (px[i] ?? 0) + (vx[i] ?? 0) * step;
            let y = (py[i] ?? 0) + (vy[i] ?? 0) * step;
            let z = (pz[i] ?? 0) + (vz[i] ?? 0) * step;
            if (x > HALF || x < -HALF) {
              vx[i] = -(vx[i] ?? 0);
              x = Math.max(-HALF, Math.min(HALF, x));
            }
            if (y > HALF || y < -HALF) {
              vy[i] = -(vy[i] ?? 0);
              y = Math.max(-HALF, Math.min(HALF, y));
            }
            if (z > HALF || z < -HALF) {
              vz[i] = -(vz[i] ?? 0);
              z = Math.max(-HALF, Math.min(HALF, z));
            }
            px[i] = x;
            py[i] = y;
            pz[i] = z;
          }
        } else {
          for (const p of objects) {
            p.x += p.vx * step;
            p.y += p.vy * step;
            p.z += p.vz * step;
            if (p.x > HALF || p.x < -HALF) {
              p.vx = -p.vx;
              p.x = Math.max(-HALF, Math.min(HALF, p.x));
            }
            if (p.y > HALF || p.y < -HALF) {
              p.vy = -p.vy;
              p.y = Math.max(-HALF, Math.min(HALF, p.y));
            }
            if (p.z > HALF || p.z < -HALF) {
              p.vz = -p.vz;
              p.z = Math.max(-HALF, Math.min(HALF, p.z));
            }
          }
        }
        const elapsed = performance.now() - start;
        smoothed += (elapsed - smoothed) * 0.1;
        graph.push([smoothed]);
        // 表示は先頭の 3 万個だけ
        const shown = Math.min(SHOWN, count);
        for (let i = 0; i < shown; i++) {
          const p = objects[i];
          if (layout === "soa") {
            dots.positions.set([px[i] ?? 0, py[i] ?? 0, pz[i] ?? 0], i * 3);
          } else if (p) {
            dots.positions.set([p.x, p.y, p.z], i * 3);
          }
        }
        dots.geometry.setDrawRange(0, shown);
        dots.commit();
        context.readout("粒子の数", count.toLocaleString());
        context.readout(
          "更新にかかった時間（実測）",
          `${smoothed.toFixed(2)} ms`
        );
        context.readout(
          "使わない値の量",
          `${((extra.length * 4) / 1_000_000).toFixed(1)} MB（SoA では読まない）`
        );
        context.caption(
          layout === "soa"
            ? "SoA では、x だけ、vx だけ…と同じ種類の値が隙間なく並ぶ。位置の更新は使う 6 本の配列を先頭から順に読むだけなので、キャッシュに読み込んだデータを全部使え、CPU の先読みも効く。SIMD（1 命令で 4〜8 個を同時に計算）にも向く。"
            : "AoS（オブジェクトの配列）では、粒子ごとに 12 個の値がまとまっている。位置の更新に使うのは半分だけなのに、キャッシュには使わない値（色や寿命）も一緒に読み込まれる。JavaScript のオブジェクトはメモリのあちこちに置かれるので、参照をたどる手間も加わる。"
        );
      },
    };
  },
};
