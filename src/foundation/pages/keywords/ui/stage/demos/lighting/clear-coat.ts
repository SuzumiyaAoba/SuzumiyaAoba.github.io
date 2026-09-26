import {
  CylinderGeometry,
  DataTexture,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PointLight,
  RepeatWrapping,
  RGBAFormat,
  SphereGeometry,
  Vector2,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { marker, palette, perlin2, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 256;

/** メタリック塗装の粒子（ランダムな向きの小さな鏡）を表す法線マップ。 */
function flakeNormals() {
  const random = rng(8);
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let index = 0; index < SIZE * SIZE; index++) {
    const x = (random() - 0.5) * 1.2;
    const y = (random() - 0.5) * 1.2;
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    data[index * 4] = (x * 0.5 + 0.5) * 255;
    data[index * 4 + 1] = (y * 0.5 + 0.5) * 255;
    data[index * 4 + 2] = (z * 0.5 + 0.5) * 255;
    data[index * 4 + 3] = 255;
  }
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}

/** 塗膜表面のゆるやかなうねり（ゆず肌）。 */
function orangePeel() {
  const data = new Uint8Array(SIZE * SIZE * 4);
  const height = (x: number, y: number) =>
    perlin2((x / SIZE) * 24, (y / SIZE) * 24) +
    perlin2((x / SIZE) * 48, (y / SIZE) * 48) * 0.5;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (height(x + 1, y) - height(x - 1, y)) * 3;
      const dy = (height(x, y + 1) - height(x, y - 1)) * 3;
      const length = Math.hypot(dx, dy, 1);
      const index = (y * SIZE + x) * 4;
      data[index] = ((-dx / length) * 0.5 + 0.5) * 255;
      data[index + 1] = ((-dy / length) * 0.5 + 0.5) * 255;
      data[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[index + 3] = 255;
    }
  }
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

const colors = {
  red: "#b3131b",
  blue: "#0f3d8c",
  green: "#1c5e3a",
  black: "#141518",
} as const;
type ColorKey = keyof typeof colors;
const isColor = (value: unknown): value is ColorKey =>
  typeof value === "string" && Object.hasOwn(colors, value);

export const demo: DemoModule = {
  alt: "車の塗装を題材にしたクリアコートのデモ。下地のメタリック塗装は粗く、細かな粒子がきらめく広いハイライトを作る。その上に透明で滑らかな塗膜を 1 層重ねると、鏡のようにくっきりしたハイライトと映り込みが加わり、深い艶が出る。手前の 3 つの球で、塗装のみ・クリアコート・ゆず肌（塗膜のうねり）を比べられる。",
  camera: { position: [3.6, 2.4, 5.6], target: [0, 0.7, 0.3] },
  controls: [
    {
      type: "range",
      key: "clearcoat",
      label: "クリアコートの強さ",
      min: 0,
      max: 1,
      step: 0.01,
      value: 1,
    },
    {
      type: "range",
      key: "coatRoughness",
      label: "塗膜の粗さ",
      min: 0,
      max: 0.6,
      step: 0.01,
      value: 0.04,
    },
    {
      type: "select",
      key: "color",
      label: "塗装の色",
      value: "red",
      options: [
        { value: "red", label: "赤" },
        { value: "blue", label: "青" },
        { value: "green", label: "緑" },
        { value: "black", label: "黒" },
      ],
    },
    { type: "toggle", key: "flakes", label: "メタリックの粒子", value: true },
    { type: "toggle", key: "orbit", label: "光を動かす", value: true },
  ],
  legend: [{ color: palette.amber, label: "点光源" }],
  setup(context) {
    const { scene, params } = context;
    scene.environmentIntensity = 0.6;
    const flakes = context.track(flakeNormals());
    const peel = context.track(orangePeel());
    const paint = () =>
      new MeshPhysicalMaterial({
        color: colors.red,
        metalness: 0.55,
        roughness: 0.45,
        normalMap: flakes,
        normalScale: new Vector2(0.25, 0.25),
        clearcoat: 1,
        clearcoatRoughness: 0.04,
      });
    const carPaint = paint();

    const car = new Group();
    const body = new Mesh(
      new RoundedBoxGeometry(3, 0.55, 1.35, 8, 0.24),
      carPaint
    );
    body.position.y = 0.55;
    const cabin = new Mesh(
      new RoundedBoxGeometry(1.5, 0.5, 1.15, 8, 0.22),
      carPaint
    );
    cabin.position.set(-0.2, 0.98, 0);
    const glass = new Mesh(
      new RoundedBoxGeometry(1.35, 0.36, 1.18, 6, 0.16),
      new MeshPhysicalMaterial({
        color: "#0b0f16",
        metalness: 0,
        roughness: 0.05,
        clearcoat: 1,
      })
    );
    glass.position.set(-0.2, 1.02, 0);
    const tire = standard("#141414", { roughness: 0.9 });
    const hub = standard("#9aa3ad", { metalness: 0.9, roughness: 0.3 });
    const wheels = [
      [-0.95, 0.66],
      [0.95, 0.66],
      [-0.95, -0.66],
      [0.95, -0.66],
    ].map(([x = 0, z = 0]) => {
      const wheel = new Group();
      const rubber = new Mesh(new CylinderGeometry(0.3, 0.3, 0.22, 32), tire);
      const cap = new Mesh(new CylinderGeometry(0.17, 0.17, 0.24, 24), hub);
      wheel.add(rubber, cap);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      return wheel;
    });
    car.add(body, cabin, glass, ...wheels);
    car.traverse((object) => {
      object.castShadow = true;
    });
    car.position.set(0, 0, -0.5);
    scene.add(car);

    // 比較用の球
    const baseOnly = paint();
    baseOnly.clearcoat = 0;
    const coated = paint();
    const peeled = paint();
    peeled.clearcoatNormalMap = peel;
    peeled.clearcoatNormalScale = new Vector2(0.22, 0.22);
    const swatches = [
      { material: baseOnly, label: "塗装のみ" },
      { material: coated, label: "クリアコート" },
      { material: peeled, label: "ゆず肌の塗膜" },
    ];
    const sphere = new SphereGeometry(0.34, 96, 64);
    for (const [index, swatch] of swatches.entries()) {
      const mesh = new Mesh(sphere, swatch.material);
      mesh.position.set(-1.2 + index * 1.2, 0.34, 1.55);
      mesh.castShadow = true;
      const label = context.label(swatch.label, { tone: "muted" });
      label.position.set(-1.2 + index * 1.2, 0.95, 1.55);
      scene.add(mesh, label);
    }

    const light = new PointLight("#fff4e0", 9, 10, 1.5);
    const bulb = marker(palette.amber, 0.06);
    scene.add(light, bulb);
    let angle = 0.4;

    return {
      update({ dt }) {
        if (params["orbit"] === true) {
          angle += dt * 0.5;
        }
        light.position.set(
          Math.cos(angle) * 3,
          2.3,
          Math.sin(angle) * 2.4 + 0.4
        );
        bulb.position.copy(light.position);
        const color =
          colors[isColor(params["color"]) ? params["color"] : "red"];
        const coat = Number(params["clearcoat"]);
        const coatRoughness = Number(params["coatRoughness"]);
        const flakeScale = params["flakes"] === true ? 0.14 : 0;
        for (const material of [carPaint, baseOnly, coated, peeled]) {
          material.color.set(color);
          material.normalScale.setScalar(flakeScale);
          material.clearcoatRoughness = coatRoughness;
        }
        carPaint.clearcoat = coat;
        context.readout("クリアコート", coat.toFixed(2));
        context.readout("塗膜の粗さ", coatRoughness.toFixed(2));
        context.caption(
          coat < 0.05
            ? "塗装だけだと、メタリックの下地は粗いので、ハイライトは広くぼんやりして艶がない。"
            : "透明な塗膜で一度反射し（くっきりしたハイライトと映り込み）、塗膜を通り抜けた光が下地で反射する（色の付いた広いハイライト）。2 層の反射を足し合わせて深い艶を出す。"
        );
      },
    };
  },
};
