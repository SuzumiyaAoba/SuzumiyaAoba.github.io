import {
  Color,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { TAU, palette, pointCloud, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const RADIUS = 2.2;
const MAX = 4000;
const BANDS = 12;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const BURST_SECONDS = 2.2;

type Method = "latlong" | "cube" | "archimedes" | "fibonacci";
const isMethod = (value: unknown): value is Method =>
  value === "latlong" ||
  value === "cube" ||
  value === "archimedes" ||
  value === "fibonacci";

/** index 番目の方向（単位ベクトル、y を極の向きとする）。 */
function direction(
  method: Method,
  index: number,
  count: number,
  random: () => number,
  out: Vector3
) {
  switch (method) {
    case "latlong": {
      // 緯度と経度をそれぞれ一様に選ぶ（極に集まる）
      const theta = random() * Math.PI;
      const phi = random() * TAU;
      return out.set(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
      );
    }
    case "cube": {
      // 立方体の中の点を正規化する（角の方向に集まる）
      out.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1);
      return out.lengthSq() < 1e-8 ? out.set(0, 1, 0) : out.normalize();
    }
    case "archimedes": {
      // 高さ y を一様に選ぶと、球面の面積に対して一様になる（アルキメデスの帽子箱の定理）
      const y = 1 - 2 * random();
      const phi = random() * TAU;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      return out.set(ring * Math.cos(phi), y, ring * Math.sin(phi));
    }
    case "fibonacci": {
      // 高さを等間隔に、経度を黄金角ずつ回す（決定的でむらがない）
      const y = 1 - (2 * index + 1) / count;
      const phi = index * GOLDEN_ANGLE;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      return out.set(ring * Math.cos(phi), y, ring * Math.sin(phi));
    }
    default: {
      return out.set(0, 1, 0);
    }
  }
}

const bandOf = (y: number) =>
  Math.min(BANDS - 1, Math.max(0, Math.floor(((y + 1) / 2) * BANDS)));

const CAPTIONS: Record<Method, string> = {
  latlong:
    "緯度と経度を一様に選ぶと、どの緯度にも同じ数の点が行く。ところが極の近くの緯線は短いので、北極と南極に点が密集する。右下のグラフの両端が高く盛り上がる。",
  cube: "立方体の中の点を長さ 1 に縮めると、立方体の角の方向（体積が多い方向）に点が集まる。よく見ると、8 つの角の方向がやや濃い。",
  archimedes:
    "高さ y を -1〜1 で一様に、経度を一様に選ぶ。球を同じ厚さの帯に切ると、どの帯も面積が等しい（アルキメデスの定理）ので、点は球面全体に均等に散らばる。",
  fibonacci:
    "高さを等間隔にずらしながら、経度を黄金角（約 137.5°）ずつ回す。乱数を使わないので、すき間も固まりもない、きれいな分布になる。点の数を決めて、一度に全部作る。",
};

export const demo: DemoModule = {
  alt: "球面の上に方向をランダムに選ぶ方法を比べるデモ。緯度と経度を一様に選ぶと北極と南極に点が集まり、立方体の中の点を正規化すると角の方向に偏る。高さを一様に選ぶ方法（アルキメデスの定理）やフィボナッチ格子では、球面全体に均等に散らばる。球を面積の等しい帯に分け、帯ごとの点の数を右下のグラフに示す。爆発の破片として飛ばすと、偏りが筋として見える。",
  camera: {
    position: [0, 2.4, 7.6],
    target: [0, 0, 0],
    fov: 42,
    autoRotate: 10,
  },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "method",
      label: "方向の選び方",
      value: "latlong",
      options: [
        { value: "latlong", label: "緯度と経度を一様に（誤り）" },
        { value: "cube", label: "立方体の点を正規化（誤り）" },
        { value: "archimedes", label: "高さを一様に（正しい）" },
        { value: "fibonacci", label: "フィボナッチ格子（むらなし）" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "点の数",
      min: 200,
      max: MAX,
      step: 100,
      value: 2000,
    },
    {
      type: "toggle",
      key: "bands",
      label: "面積の等しい帯で色分け",
      value: true,
    },
    {
      type: "toggle",
      key: "burst",
      label: "爆発の破片として飛ばす",
      value: false,
    },
    { type: "button", key: "restart", label: "作り直す" },
  ],
  legend: [
    { color: palette.amber, label: "偶数番目の帯の点" },
    { color: palette.cyan, label: "奇数番目の帯の点" },
    { color: palette.muted, label: "帯の境目（どの帯も面積が等しい）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const globe = new Mesh(
      new SphereGeometry(RADIUS * 0.985, 64, 48),
      new MeshStandardMaterial({
        color: "#1d2a3d",
        roughness: 0.9,
        transparent: true,
        opacity: 0.85,
      })
    );
    scene.add(globe);
    const rings: Vector3[] = [];
    for (let k = 1; k < BANDS; k++) {
      const y = -1 + (2 * k) / BANDS;
      const r = Math.sqrt(1 - y * y) * RADIUS * 1.003;
      for (let s = 0; s < 72; s++) {
        const a0 = (s / 72) * TAU;
        const a1 = ((s + 1) / 72) * TAU;
        rings.push(
          new Vector3(Math.cos(a0) * r, y * RADIUS, Math.sin(a0) * r),
          new Vector3(Math.cos(a1) * r, y * RADIUS, Math.sin(a1) * r)
        );
      }
    }
    const ringLines = segments(rings, palette.muted, {
      width: 1.2,
      opacity: 0.55,
    });
    scene.add(ringLines);
    const north = context.label("北極", { tone: "muted" });
    north.position.set(0, RADIUS + 0.35, 0);
    const south = context.label("南極", { tone: "muted" });
    south.position.set(0, -RADIUS - 0.35, 0);
    scene.add(north, south);

    const dots = pointCloud(MAX, { size: 7 });
    scene.add(dots);
    const directions = new Float32Array(MAX * 3);
    const graph = hudGraph(context, {
      title: "帯ごとの点の数（均等なら 1）",
      min: 0,
      max: 3,
      xLabel: "南極 → 北極",
      samples: BANDS * 8,
    });

    const even = new Color(palette.amber);
    const odd = new Color(palette.cyan);
    const plain = new Color(palette.ink);
    const counts = new Float32Array(BANDS);
    const scratch = new Vector3();
    let random = rng(3);
    let seed = 3;
    let made = 0;
    let target = 0;
    let method: Method = "latlong";
    let graphTimer = 0;

    const restart = () => {
      seed++;
      random = rng(seed);
      made = 0;
      counts.fill(0);
    };
    const add = (index: number) => {
      direction(method, index, target, random, scratch);
      directions.set([scratch.x, scratch.y, scratch.z], index * 3);
      counts[bandOf(scratch.y)] = (counts[bandOf(scratch.y)] ?? 0) + 1;
    };
    const drawGraph = () => {
      const expected = Math.max(1, made) / BANDS;
      graph.setSeries([
        {
          color: palette.amber,
          fn: (t) =>
            made === 0 ? 0 : (counts[bandOf(t * 2 - 1)] ?? 0) / expected,
        },
      ]);
      graph.setMarker(0.5);
    };

    return {
      update({ dt, time }) {
        const next = params["method"];
        const count = Number(params["count"]);
        if ((isMethod(next) && next !== method) || count !== target) {
          if (isMethod(next)) {
            method = next;
          }
          target = count;
          restart();
        }
        // フィボナッチ格子は点の数で全体が決まるので一度に作る。乱数はパラパラと増やす
        const perFrame =
          method === "fibonacci" ? target : Math.ceil(target * dt * 0.6);
        for (let k = 0; k < perFrame && made < target; k++) {
          add(made);
          made++;
        }
        const burst = params["burst"] === true;
        const phase = (time % BURST_SECONDS) / BURST_SECONDS;
        const eased = 1 - (1 - Math.min(1, phase * 1.4)) ** 3;
        const radius = burst ? RADIUS * (0.08 + eased * 1.5) : RADIUS;
        const banded = params["bands"] === true;
        for (let i = 0; i < made; i++) {
          const x = directions[i * 3] ?? 0;
          const y = directions[i * 3 + 1] ?? 0;
          const z = directions[i * 3 + 2] ?? 0;
          dots.positions.set([x * radius, y * radius, z * radius], i * 3);
          const color = banded ? (bandOf(y) % 2 === 0 ? even : odd) : plain;
          dots.colors.set([color.r, color.g, color.b], i * 3);
        }
        dots.geometry.setDrawRange(0, made);
        dots.commit();
        globe.visible = !burst;
        ringLines.visible = banded && !burst;
        graphTimer -= dt;
        if (graphTimer <= 0) {
          graphTimer = 0.15;
          drawGraph();
        }
        const expected = Math.max(1, made) / BANDS;
        const ratios = [...counts].map((value) => value / expected);
        context.readout("点の数", `${made}`);
        context.readout(
          "帯の点の数（最少〜最多）",
          made === 0
            ? "—"
            : `${Math.min(...ratios).toFixed(2)} 〜 ${Math.max(...ratios).toFixed(2)} 倍`
        );
        context.caption(
          burst
            ? `${CAPTIONS[method]}（破片として飛ばすと、偏った方向に破片が固まって飛ぶ）`
            : CAPTIONS[method]
        );
      },
      action(key) {
        if (key === "restart") {
          restart();
        }
      },
    };
  },
};
