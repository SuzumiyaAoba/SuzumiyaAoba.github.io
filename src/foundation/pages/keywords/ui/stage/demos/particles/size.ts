import { Color, CylinderGeometry, DoubleSide, Mesh, PointLight } from "three";
import { clamp, palette, rng, smoothstep, standard, TAU } from "../../kit";
import { particleSystem, smokePuff } from "../../particles";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const COUNT = 600;

type Preset = {
  count: number;
  life: number;
  speed: number;
  spread: number;
  size: (t: number) => number;
  alpha: (t: number) => number;
  colors: readonly string[];
  additive: boolean;
  intensity: number;
};

const presets: Record<string, Preset> = {
  fire: {
    count: 240,
    life: 1.2,
    speed: 1.6,
    spread: 0.25,
    size: (t) =>
      0.35 + Math.sin(Math.min(1, t * 1.4) * Math.PI) * 0.45 - t * 0.2,
    alpha: (t) => smoothstep(0, 0.08, t) * (1 - smoothstep(0.55, 1, t)) * 0.55,
    colors: ["#fff4c2", "#ffb347", "#ff5a1f", "#7a1d10"],
    additive: true,
    intensity: 0.55,
  },
  magic: {
    count: 420,
    life: 2.2,
    speed: 1.1,
    spread: 0.5,
    size: (t) => 0.12 + Math.sin(t * Math.PI) * 0.18,
    alpha: (t) =>
      smoothstep(0, 0.15, t) * (1 - t) * (0.6 + 0.4 * Math.sin(t * 40)),
    colors: ["#ffffff", "#8fe9ff", "#a88bfa", "#f58fc7"],
    additive: true,
    intensity: 1.4,
  },
  smoke: {
    count: 160,
    life: 4,
    speed: 0.7,
    spread: 0.3,
    size: (t) => 0.3 + t * 0.7,
    alpha: (t) => smoothstep(0, 0.15, t) * (1 - smoothstep(0.3, 1, t)) * 0.7,
    colors: ["#9aa3b0", "#6f7884", "#4b525c", "#343a42"],
    additive: false,
    intensity: 1,
  },
};

const gradient = (colors: readonly string[], t: number, out: Color) => {
  const scaled = clamp(t) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  return out
    .set(colors[index] ?? "#fff")
    .lerp(new Color(colors[index + 1] ?? "#fff"), scaled - index);
};

export const demo: DemoModule = {
  alt: "噴き上がる粒子の見た目を、粒子の年齢（生まれてからの経過割合）に応じて変えるデモ。大きさ・色・透明度のカーブを使うと、白く生まれて赤く冷え、しぼんで消える炎になる。カーブを切ると、同じ大きさと色の点が噴き出すだけになる。",
  camera: { position: [3.8, 2.4, 5.6], target: [0, 1.3, 0] },
  bloom: { strength: 0.6, radius: 0.45, threshold: 0.75 },
  studio: { background: "#06080d" },
  controls: [
    {
      type: "select",
      key: "preset",
      label: "カーブの組み合わせ",
      value: "fire",
      options: [
        { value: "fire", label: "炎" },
        { value: "magic", label: "魔法の粒" },
        { value: "smoke", label: "煙" },
      ],
    },
    { type: "toggle", key: "curves", label: "寿命カーブを使う", value: true },
  ],
  legend: [
    { color: palette.amber, label: "大きさ" },
    { color: palette.cyan, label: "不透明度" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(5);
    const brazier = new Mesh(
      new CylinderGeometry(0.45, 0.3, 0.4, 32, 1, true),
      standard("#3a3f4a", { metalness: 0.6, roughness: 0.4 })
    );
    brazier.material.side = DoubleSide;
    brazier.position.y = 0.2;
    brazier.castShadow = true;
    scene.add(brazier);
    const light = new PointLight("#ff9448", 4, 6, 1.5);
    light.position.set(0, 0.9, 0);
    scene.add(light);

    const additive = particleSystem({ capacity: COUNT, additive: true });
    const alphaBlend = particleSystem({
      capacity: COUNT,
      texture: smokePuff(),
      additive: false,
    });
    scene.add(alphaBlend, additive);

    const ages = Float32Array.from({ length: COUNT }, () => random());
    const seeds = Float32Array.from({ length: COUNT }, () => random());
    const origins = new Float32Array(COUNT * 2);
    const color = new Color();

    const graph = hudGraph(context, {
      title: "年齢 t（0 = 誕生、1 = 消滅）に対する値",
      min: 0,
      max: 1,
      xLabel: "t",
    });
    const swatch = document.createElement("div");
    swatch.className = "keyword-stage-graph";
    context.hud(swatch);
    let lastPreset = "";

    return {
      update({ dt, time }) {
        const key = String(params["preset"]);
        const preset = presets[key] ?? presets["fire"];
        if (!preset) {
          return;
        }
        const useCurves = params["curves"] === true;
        if (key !== lastPreset) {
          lastPreset = key;
          graph.setSeries([
            { fn: preset.size, color: palette.amber, label: "大きさ" },
            { fn: preset.alpha, color: palette.cyan, label: "不透明度" },
          ]);
          swatch.textContent = "色のグラデーション";
          swatch.style.setProperty(
            "background-image",
            `linear-gradient(90deg, ${preset.colors.join(", ")})`
          );
          swatch.style.setProperty("color", "#0b0f16");
          swatch.style.setProperty("width", "13.5rem");
          swatch.style.setProperty("font-weight", "600");
        }
        const system = preset.additive ? additive : alphaBlend;
        additive.visible = preset.additive;
        alphaBlend.visible = !preset.additive;
        for (let index = 0; index < COUNT; index++) {
          if (index >= preset.count) {
            system.sizes[index] = 0;
            continue;
          }
          const seed = seeds[index] ?? 0;
          const life = preset.life * (0.7 + seed * 0.6);
          let age = (ages[index] ?? 0) + dt / life;
          if (age >= 1) {
            age -= 1;
            const angle = random() * TAU;
            const radius = Math.sqrt(random()) * preset.spread;
            origins[index * 2] = Math.cos(angle) * radius;
            origins[index * 2 + 1] = Math.sin(angle) * radius;
          }
          ages[index] = age;
          const t = age;
          const height = 0.35 + t * life * preset.speed;
          const sway = Math.sin(time * 1.3 + seed * 20) * 0.25 * t;
          system.positions.set(
            [
              (origins[index * 2] ?? 0) * (1 - t * 0.6) + sway,
              height,
              (origins[index * 2 + 1] ?? 0) * (1 - t * 0.6),
            ],
            index * 3
          );
          system.rotations[index] = seed * TAU + t * 2;
          if (useCurves) {
            system.sizes[index] = preset.size(t) * (0.8 + seed * 0.4);
            gradient(preset.colors, t, color).multiplyScalar(
              preset.additive ? preset.intensity : 1
            );
            system.colors.set(
              [color.r, color.g, color.b, preset.alpha(t)],
              index * 4
            );
          } else {
            system.sizes[index] = preset.size(0.35);
            gradient(preset.colors, 0.3, color);
            system.colors.set(
              [color.r, color.g, color.b, preset.additive ? 0.5 : 0.35],
              index * 4
            );
          }
        }
        system.setCount(COUNT);
        system.commit();
        light.intensity =
          key === "fire"
            ? 4 + Math.sin(time * 11) * 0.8
            : key === "magic"
              ? 1.5
              : 0.2;
        light.color.set(key === "magic" ? "#9d7bff" : "#ff9448");
        graph.setMarker((time * 0.4) % 1);
        context.readout("粒子", `${preset.count} 個`);
        context.caption(
          useCurves
            ? "粒子ごとの年齢 t（0〜1）でカーブを引き、大きさ・色・不透明度を決める。1 つの放出設定から、炎の誕生から消滅までの変化が生まれる。"
            : "カーブなし：大きさも色も一定のまま。噴き出した瞬間に現れ、突然消える、平板な噴水になる。"
        );
      },
    };
  },
};
