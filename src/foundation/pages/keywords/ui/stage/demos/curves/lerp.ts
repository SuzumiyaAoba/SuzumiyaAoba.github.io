import {
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Mesh,
  PointLight,
  RingGeometry,
  SphereGeometry,
} from "three";
import { clamp, palette, standard } from "../../kit";
import { handle, hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inverseLerp = (a: number, b: number, value: number) =>
  (value - a) / (b - a);

export const demo: DemoModule = {
  alt: "プレイヤーが街灯に近づくほど明かりが強く暖かい色になるデモ。距離を Inverse Lerp で 0〜1 の比率に変換し、その比率を Lerp で明るさと色に写す。床の 2 つの輪が近い距離と遠い距離を示す。",
  camera: { position: [5.5, 6, 7.5], target: [0, 0.8, 0] },
  bloom: { strength: 0.8, radius: 0.5, threshold: 0.8 },
  studio: { background: "#070a10" },
  controls: [
    {
      type: "range",
      key: "near",
      label: "近い距離 a（明るさ最大）",
      min: 0.5,
      max: 3,
      step: 0.1,
      value: 1.5,
      format: (value) => `${value.toFixed(1)} m`,
    },
    {
      type: "range",
      key: "far",
      label: "遠い距離 b（消灯）",
      min: 3.5,
      max: 7,
      step: 0.1,
      value: 5.5,
      format: (value) => `${value.toFixed(1)} m`,
    },
    {
      type: "toggle",
      key: "clamp",
      label: "比率を 0〜1 にクランプ",
      value: true,
      hint: "オフにすると範囲外で値が外挿され、遠くで逆に色が振り切れます。",
    },
    {
      type: "toggle",
      key: "walk",
      label: "プレイヤーを自動で歩かせる",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "近い距離 a" },
    { color: palette.sky, label: "遠い距離 b" },
  ],
  hint: "プレイヤー（緑の人形）をドラッグして街灯に近づけてみてください。",
  setup(context) {
    const { scene, params } = context;
    const pole = new Mesh(
      new CylinderGeometry(0.06, 0.09, 2.6, 16),
      standard("#2a3140", { metalness: 0.6, roughness: 0.4 })
    );
    pole.position.y = 1.3;
    pole.castShadow = true;
    const bulbMaterial = standard("#ffd28a", { emissive: 2 });
    const bulb = new Mesh(new SphereGeometry(0.22, 32, 24), bulbMaterial);
    bulb.position.y = 2.7;
    const light = new PointLight("#ffcf8a", 0, 12, 1.6);
    light.position.copy(bulb.position);
    light.castShadow = true;
    const ground = new Mesh(
      new CircleGeometry(8, 96),
      standard("#1b2332", { roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.002;
    ground.receiveShadow = true;
    scene.add(ground, pole, bulb, light);

    const nearRing = new Mesh(
      new RingGeometry(0.98, 1, 96),
      standard(palette.amber, { emissive: 0.8 })
    );
    const farRing = new Mesh(
      new RingGeometry(0.985, 1, 96),
      standard(palette.sky, { emissive: 0.8 })
    );
    for (const ring of [nearRing, farRing]) {
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      scene.add(ring);
    }
    const nearLabel = context.label("a", { color: palette.amber });
    const farLabel = context.label("b", { color: palette.sky });
    scene.add(nearLabel, farLabel);

    const player = handle(palette.lime, 0.01);
    const body = new Mesh(
      new CapsuleGeometry(0.22, 0.6, 8, 16),
      standard(palette.lime, { roughness: 0.5 })
    );
    body.position.y = 0.52;
    body.castShadow = true;
    const hit = new Mesh(new SphereGeometry(0.55, 12, 8), standard("#000"));
    hit.material.visible = false;
    hit.position.y = 0.5;
    player.add(body, hit);
    player.position.set(4, 0, 1);
    scene.add(player);
    let dragging = false;
    context.draggable(player, {
      clamp: (position) => {
        position.y = 0;
        const length = Math.hypot(position.x, position.z);
        if (length > 7) {
          position.multiplyScalar(7 / length);
        }
      },
      onDrag: () => {
        dragging = true;
        context.setParam("walk", false);
      },
    });
    const playerLabel = context.label("", { color: palette.lime });
    playerLabel.position.set(0, 1.35, 0);
    player.add(playerLabel);

    const graph = hudGraph(context, {
      title: "距離 → 比率 t（Inverse Lerp）",
      min: -0.4,
      max: 1.4,
      xMax: 8,
      xLabel: "距離 m",
    });
    const warm = new Color("#ffcf8a");
    const cool = new Color("#5a7bd6");
    const color = new Color();
    let angle = 0;
    let lastKey = "";

    return {
      update({ dt }) {
        const near = Number(params["near"]);
        const far = Number(params["far"]);
        const clamped = params["clamp"] === true;
        nearRing.scale.setScalar(near);
        farRing.scale.setScalar(far);
        nearLabel.position.set(near, 0.2, 0);
        farLabel.position.set(far, 0.2, 0);
        const key = `${near}:${far}:${clamped}`;
        if (key !== lastKey) {
          lastKey = key;
          graph.setSeries([
            {
              fn: (d) => {
                const t = 1 - inverseLerp(near, far, d);
                return clamped ? clamp(t) : t;
              },
              color: palette.amber,
              label: "明るさの比率",
            },
          ]);
        }
        if (params["walk"] === true && !dragging) {
          angle += dt * 0.35;
          const radius = 3.6 + Math.sin(angle * 1.7) * 2.6;
          player.position.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          );
        }
        dragging = false;

        const distance = Math.hypot(player.position.x, player.position.z);
        let t = 1 - inverseLerp(near, far, distance);
        if (clamped) {
          t = clamp(t);
        }
        const intensity = lerp(0, 18, t);
        light.intensity = Math.max(0, intensity);
        color.copy(cool).lerp(warm, t);
        light.color.copy(color);
        bulbMaterial.color.copy(color);
        bulbMaterial.emissive.copy(color);
        bulbMaterial.emissiveIntensity = Math.max(0.05, lerp(0.1, 2.5, t));
        body.position.y = 0.52 + Math.abs(Math.sin(angle * 8)) * 0.05;
        playerLabel.setText(`${distance.toFixed(2)} m`);
        graph.setMarker(distance);

        context.readout("距離 d", `${distance.toFixed(2)} m`);
        context.readout("t = 1 − invLerp(a, b, d)", t.toFixed(2));
        context.readout("明るさ = lerp(0, 18, t)", intensity.toFixed(1));
        context.caption(
          "Inverse Lerp で『距離が a と b のどこにあるか』を比率 t に直し、Lerp でその比率を明るさや色に写す。2 つを続けたものが Remap。"
        );
      },
    };
  },
};
