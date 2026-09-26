import {
  BufferAttribute,
  Color,
  ConeGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { fbm2, rng, smoothstep } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 9;
const N = 150;
const SEA = 0.34;
const HEIGHT = 2.2;
const MAX_TREES = 2600;

type Biome = {
  name: string;
  color: string;
  trees: number;
  kind: "none" | "round" | "cone";
};

const BIOMES: Record<string, Biome> = {
  ocean: { name: "海", color: "#2a6f9e", trees: 0, kind: "none" },
  beach: { name: "砂浜", color: "#e3d29a", trees: 0, kind: "none" },
  snow: { name: "雪原", color: "#eef2f6", trees: 0, kind: "none" },
  tundra: { name: "ツンドラ", color: "#a3a48a", trees: 0.01, kind: "cone" },
  taiga: { name: "針葉樹林", color: "#4d7a5c", trees: 0.35, kind: "cone" },
  grassland: { name: "草原", color: "#a9c46a", trees: 0.01, kind: "round" },
  forest: { name: "落葉樹林", color: "#6aa04f", trees: 0.28, kind: "round" },
  swamp: { name: "湿地", color: "#56815c", trees: 0.12, kind: "round" },
  desert: { name: "砂漠", color: "#e2c47e", trees: 0, kind: "none" },
  savanna: { name: "サバンナ", color: "#c8b560", trees: 0.03, kind: "round" },
  rainforest: { name: "熱帯雨林", color: "#2f7d3c", trees: 0.5, kind: "round" },
};

/** 気温と湿度（どちらも 0〜1）から生物群系を引く表（ホイッタカー図を簡単にしたもの）。 */
const FALLBACK: Biome = {
  name: "海",
  color: "#2a6f9e",
  trees: 0,
  kind: "none",
};

function biomeOf(key: string) {
  return BIOMES[key] ?? FALLBACK;
}

function lookup(temperature: number, moisture: number): Biome {
  if (temperature < 0.16) {
    return biomeOf("snow");
  }
  if (temperature < 0.36) {
    return biomeOf(moisture < 0.35 ? "tundra" : "taiga");
  }
  if (temperature < 0.64) {
    return biomeOf(
      moisture < 0.3 ? "grassland" : moisture < 0.68 ? "forest" : "swamp"
    );
  }
  return biomeOf(
    moisture < 0.25 ? "desert" : moisture < 0.55 ? "savanna" : "rainforest"
  );
}

export const demo: DemoModule = {
  alt: "標高・気温・湿度という複数のノイズの値を組み合わせ、表を引いて、森林・砂漠・雪原などの生物群系（バイオーム）を塗り分けるデモ。気温は、南北の位置と標高から決め（高い所ほど寒い）、湿度は別のノイズで決める。右下の図が気温と湿度からバイオームを引く表で、白い点がポインターの下の場所。標高だけで色を決めると、同じ高さはどこでも同じになるが、気温と湿度を組み合わせると、同じ高さでも北は針葉樹林、南は砂漠や熱帯雨林になる。",
  camera: { position: [0, 7.6, 7.8], target: [0, -0.1, 0.2], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "色の決め方",
      value: "biome",
      options: [
        { value: "biome", label: "気温 × 湿度の表（バイオーム）" },
        { value: "height", label: "標高だけ（比較用）" },
        { value: "temperature", label: "気温の地図" },
        { value: "moisture", label: "湿度の地図" },
      ],
    },
    {
      type: "range",
      key: "warm",
      label: "全体の気温をずらす",
      min: -0.4,
      max: 0.4,
      step: 0.02,
      value: 0,
    },
    {
      type: "range",
      key: "wet",
      label: "全体の湿度をずらす",
      min: -0.4,
      max: 0.4,
      step: 0.02,
      value: 0,
    },
    {
      type: "range",
      key: "lapse",
      label: "標高で下がる気温",
      min: 0,
      max: 1.2,
      step: 0.05,
      value: 0.6,
    },
    {
      type: "range",
      key: "seed",
      label: "ノイズの種",
      min: 0,
      max: 20,
      step: 1,
      value: 2,
    },
    { type: "toggle", key: "trees", label: "木を生やす", value: true },
  ],
  legend: [
    { color: "#4d7a5c", label: "針葉樹林" },
    { color: "#6aa04f", label: "落葉樹林" },
    { color: "#2f7d3c", label: "熱帯雨林" },
    { color: "#e2c47e", label: "砂漠" },
    { color: "#eef2f6", label: "雪原" },
  ],
  hint: "地形の上にポインターを置くと、その場所の気温・湿度とバイオームが右下の表に出ます。",
  setup(context) {
    const { scene, params } = context;
    const geometry = new PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
    geometry.rotateX(-Math.PI / 2);
    const colors = new Float32Array(N * N * 3);
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const terrain = new Mesh(
      geometry,
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.92 })
    );
    terrain.receiveShadow = true;
    scene.add(terrain);
    const water = new Mesh(
      new PlaneGeometry(SIZE * 1.6, SIZE * 1.6),
      new MeshStandardMaterial({
        color: "#2a6f9e",
        transparent: true,
        opacity: 0.75,
        roughness: 0.15,
      })
    );
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    const cones = new InstancedMesh(
      new ConeGeometry(0.07, 0.3, 6),
      new MeshStandardMaterial({ color: "#2f5a3c", roughness: 0.8 }),
      MAX_TREES
    );
    const rounds = new InstancedMesh(
      new IcosahedronGeometry(0.085, 0),
      new MeshStandardMaterial({ roughness: 0.8, flatShading: true }),
      MAX_TREES
    );
    for (const trees of [cones, rounds]) {
      trees.castShadow = true;
      trees.frustumCulled = false;
      scene.add(trees);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 220;
    canvas.style.width = "150px";
    canvas.style.height = "110px";
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "気温（縦）× 湿度（横）の表";
    figure.append(caption, canvas);
    context.hud(figure);

    const elevation = new Float32Array(N * N);
    const temperature = new Float32Array(N * N);
    const moisture = new Float32Array(N * N);
    let signature = "";
    const color = new Color();
    const hot = new Color("#e8643c");
    const cold = new Color("#4a7fd0");
    const dry = new Color("#d9b56a");
    const wet = new Color("#2d6fb8");

    const build = () => {
      const seed = Number(params["seed"]);
      const warm = Number(params["warm"]);
      const wetShift = Number(params["wet"]);
      const lapse = Number(params["lapse"]);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const u = (i / (N - 1)) * 2 - 1;
          const v = (j / (N - 1)) * 2 - 1;
          const index = j * N + i;
          // 標高：ノイズ × 島のマスク
          const mask = 1 - smoothstep(0.45, 1, Math.hypot(u, v * 1.1));
          const h =
            (fbm2(u * 2 + seed * 11.3, v * 2 - seed * 3.1, 6) * 0.9 + 0.5) *
              (0.35 + 0.75 * mask) -
            (1 - mask) * 0.25;
          elevation[index] = h;
          // 気温：奥（北、v が小さい）ほど寒く、標高が高いほど寒い
          const latitude = (v + 1) / 2;
          temperature[index] =
            latitude * 0.85 +
            0.12 +
            warm -
            Math.max(0, h - SEA) * lapse * 1.4 +
            fbm2(u * 3 + 50, v * 3, 3) * 0.12;
          // 湿度：別のノイズ（海に近いほど少し湿る）
          moisture[index] =
            fbm2(u * 1.6 - 40 + seed, v * 1.6 + 9, 5) * 1.1 +
            0.5 +
            wetShift +
            (1 - mask) * 0.1;
        }
      }
      const positions = geometry.getAttribute("position");
      const mode = String(params["mode"]);
      const random = rng(seed + 100);
      let coneCount = 0;
      let roundCount = 0;
      const matrix = new Matrix4();
      const quaternion = new Quaternion();
      for (let index = 0; index < N * N; index++) {
        const h = elevation[index] ?? 0;
        const y = (h - SEA) * HEIGHT * (h < SEA ? 0.4 : 1);
        positions.setY(index, y);
        const t = temperature[index] ?? 0;
        const m = moisture[index] ?? 0;
        let biome = lookup(t, m);
        if (h < SEA) {
          biome = biomeOf("ocean");
        } else if (h < SEA + 0.025) {
          biome = biomeOf("beach");
        }
        if (mode === "height") {
          // 比較用：標高だけで色を決める
          const level = (h - SEA) / 0.5;
          color.set(
            h < SEA
              ? "#2a6f9e"
              : level < 0.05
                ? "#e3d29a"
                : level < 0.4
                  ? "#6aa04f"
                  : level < 0.7
                    ? "#7c7266"
                    : "#eef2f6"
          );
        } else if (mode === "temperature") {
          color.copy(cold).lerp(hot, Math.max(0, Math.min(1, t)));
        } else if (mode === "moisture") {
          color.copy(dry).lerp(wet, Math.max(0, Math.min(1, m)));
        } else {
          color.set(biome.color);
        }
        colors.set([color.r, color.g, color.b], index * 3);
        // 木：バイオームごとの密度で生やす
        if (
          params["trees"] === true &&
          h >= SEA + 0.03 &&
          random() < biome.trees * 0.35
        ) {
          const x = positions.getX(index) + (random() - 0.5) * 0.05;
          const z = positions.getZ(index) + (random() - 0.5) * 0.05;
          const s = 0.7 + random() * 0.6;
          if (biome.kind === "cone" && coneCount < MAX_TREES) {
            matrix.compose(
              new Vector3(x, y + 0.14 * s, z),
              quaternion,
              new Vector3(s, s, s)
            );
            cones.setMatrixAt(coneCount, matrix);
            coneCount++;
          } else if (biome.kind === "round" && roundCount < MAX_TREES) {
            matrix.compose(
              new Vector3(x, y + 0.09 * s, z),
              quaternion,
              new Vector3(s, s * 1.1, s)
            );
            rounds.setMatrixAt(roundCount, matrix);
            rounds.setColorAt(
              roundCount,
              color.set(
                biome === BIOMES["rainforest"]
                  ? "#1f6a2c"
                  : biome === BIOMES["savanna"]
                    ? "#7c8f3a"
                    : "#3f7d34"
              )
            );
            roundCount++;
          }
        }
      }
      cones.count = coneCount;
      rounds.count = roundCount;
      cones.instanceMatrix.needsUpdate = true;
      rounds.instanceMatrix.needsUpdate = true;
      if (rounds.instanceColor) {
        rounds.instanceColor.needsUpdate = true;
      }
      positions.needsUpdate = true;
      geometry.getAttribute("color").needsUpdate = true;
      geometry.computeVertexNormals();
      context.readout("木の本数", `${coneCount + roundCount}`);
    };

    const drawTable = (marker: { t: number; m: number } | null) => {
      const context2d = canvas.getContext("2d");
      if (!context2d) {
        return;
      }
      const step = 10;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const t = 1 - (y + step / 2) / canvas.height;
          const m = (x + step / 2) / canvas.width;
          context2d.fillStyle = lookup(t, m).color;
          context2d.fillRect(x, y, step, step);
        }
      }
      if (marker) {
        const x = Math.max(0, Math.min(1, marker.m)) * canvas.width;
        const y = (1 - Math.max(0, Math.min(1, marker.t))) * canvas.height;
        context2d.strokeStyle = "#10161f";
        context2d.lineWidth = 5;
        context2d.beginPath();
        context2d.arc(x, y, 10, 0, Math.PI * 2);
        context2d.stroke();
        context2d.fillStyle = "#ffffff";
        context2d.beginPath();
        context2d.arc(x, y, 7, 0, Math.PI * 2);
        context2d.fill();
      }
    };

    const hover = new Vector3();
    return {
      update() {
        const key = ["mode", "warm", "wet", "lapse", "seed", "trees"]
          .map((name) => String(params[name]))
          .join("|");
        if (key !== signature) {
          signature = key;
          build();
        }
        const hit = context.pointerOnPlane(
          { normal: [0, 1, 0], origin: [0, 0, 0] },
          hover
        );
        let marker: { t: number; m: number } | null = null;
        if (hit && Math.abs(hit.x) < SIZE / 2 && Math.abs(hit.z) < SIZE / 2) {
          const i = Math.round((hit.x / SIZE + 0.5) * (N - 1));
          const j = Math.round((hit.z / SIZE + 0.5) * (N - 1));
          const index = j * N + i;
          const t = temperature[index] ?? 0;
          const m = moisture[index] ?? 0;
          const h = elevation[index] ?? 0;
          marker = { t, m };
          context.readout(
            "ポインターの下",
            `${h < SEA ? "海" : lookup(t, m).name}（気温 ${t.toFixed(2)}・湿度 ${m.toFixed(2)}）`
          );
        } else {
          context.readout("ポインターの下", "—");
        }
        drawTable(marker);
        const mode = String(params["mode"]);
        context.caption(
          mode === "height"
            ? "標高だけで色を決めると、同じ高さの所はどこでも同じ景色になり、北も南も区別がつかない。"
            : mode === "temperature"
              ? "気温は、奥（北）ほど低く、標高が高いほど低い。山の頂上は、南でも寒くなる。"
              : mode === "moisture"
                ? "湿度は、標高とは別のノイズで決める。標高と独立なので、同じ高さでも乾いた所と湿った所ができる。"
                : "各地点の気温と湿度で表（右下）を引いてバイオームを決める。北の湿った所は針葉樹林、南の乾いた所は砂漠、南の湿った所は熱帯雨林になり、高い山には雪が積もる。"
        );
      },
    };
  },
};
