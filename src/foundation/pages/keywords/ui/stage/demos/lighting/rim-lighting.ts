import {
  AmbientLight,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";

const ENEMIES = 5;

const rimColors = {
  cyan: "#56e0ff",
  amber: "#ffb45a",
  violet: "#b58cff",
} as const;
type RimColor = keyof typeof rimColors;
const isRimColor = (value: unknown): value is RimColor =>
  typeof value === "string" && Object.hasOwn(rimColors, value);

type RimUniforms = {
  uRimColor: { value: Color };
  uRimStrength: { value: number };
  uRimPower: { value: number };
  uRimMask: { value: number };
  uRimDirection: { value: Vector3 };
  uFlash: { value: number };
};

/** 視線と法線がほぼ直角になる輪郭付近だけを光らせる。 */
function rimMaterial(color: string, shared: Omit<RimUniforms, "uFlash">) {
  const flash = { value: 0 };
  const material = new MeshStandardMaterial({ color, roughness: 0.8 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, { uFlash: flash });
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uRimColor;
        uniform float uRimStrength;
        uniform float uRimPower;
        uniform float uRimMask;
        uniform vec3 uRimDirection;
        uniform float uFlash;`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        vec3 viewDir = normalize(vViewPosition);
        float facing = 1.0 - clamp(dot(normal, viewDir), 0.0, 1.0);
        float rim = pow(facing, uRimPower);
        // 光源側だけに限定すると、逆光の縁取りらしくなる
        float mask = mix(1.0, smoothstep(-0.1, 0.5, dot(normal, normalize(uRimDirection))), uRimMask);
        totalEmissiveRadiance += uRimColor * rim * mask * uRimStrength;
        // ヒットフラッシュ：縁から全体へ白く光らせる
        totalEmissiveRadiance += vec3(1.0, 0.95, 0.9) * uFlash * (0.35 + rim * 2.0);`
      );
  };
  material.customProgramCacheKey = () => "rim-lighting";
  return { material, flash };
}

export const demo: DemoModule = {
  alt: "暗いダンジョンに潜む敵を、輪郭だけを光らせるリムライトで浮かび上がらせるデモ。視線と表面がほぼ直角になる縁ほど強く光らせるので、暗い背景の中でもシルエットがはっきり読める。攻撃を当てたときに縁から白く光らせるヒットフラッシュにも同じ仕組みを使う。",
  camera: { position: [0, 1.7, 6.4], target: [0, 1, -1] },
  studio: { background: "#040509" },
  bloom: { strength: 0.9, radius: 0.5, threshold: 0.6 },
  controls: [
    {
      type: "range",
      key: "strength",
      label: "リムの強さ",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1.4,
    },
    {
      type: "range",
      key: "power",
      label: "縁の細さ（指数）",
      min: 0.5,
      max: 8,
      step: 0.1,
      value: 3,
      hint: "大きいほど縁のごく一部だけが光ります。",
    },
    {
      type: "select",
      key: "color",
      label: "リムの色",
      value: "cyan",
      options: [
        { value: "cyan", label: "青緑" },
        { value: "amber", label: "橙" },
        { value: "violet", label: "紫" },
      ],
    },
    { type: "toggle", key: "mask", label: "光源側の縁だけ", value: false },
    { type: "button", key: "hit", label: "攻撃を当てる（ヒットフラッシュ）" },
  ],
  legend: [{ color: palette.cyan, label: "リムライト" }],
  setup(context) {
    const { scene, params } = context;
    const random = rng(12);
    // ほぼ真っ暗にして、リムの効果だけが分かるようにする
    const hidden = scene.children.filter(
      (child) =>
        (child.type === "HemisphereLight" ||
          child.type === "DirectionalLight") &&
        child.visible
    );
    for (const light of hidden) {
      light.visible = false;
    }
    const previousEnvironment = scene.environmentIntensity;
    scene.environmentIntensity = 0.03;
    const ambient = new AmbientLight("#29324a", 0.4);
    const torch = new PointLight("#ff9a4a", 5, 7, 1.6);
    torch.position.set(-2.6, 2, 1.2);
    scene.add(ambient, torch);

    const shared = {
      uRimColor: { value: new Color(rimColors.cyan) },
      uRimStrength: { value: 1.4 },
      uRimPower: { value: 3 },
      uRimMask: { value: 0 },
      uRimDirection: { value: new Vector3(0.6, 0.5, -0.6) },
    };
    const body = new CapsuleGeometry(0.34, 0.6, 8, 24);
    const head = new SphereGeometry(0.28, 32, 24);
    const horn = new ConeGeometry(0.07, 0.3, 16);
    const enemies = Array.from({ length: ENEMIES }, (_, index) => {
      const { material, flash } = rimMaterial(
        index % 2 === 0 ? "#20262e" : "#2a2030",
        shared
      );
      const group = new Group();
      const torso = new Mesh(body, material);
      torso.position.y = 0.64;
      const face = new Mesh(head, material);
      face.position.y = 1.32;
      const left = new Mesh(horn, material);
      left.position.set(-0.14, 1.58, 0);
      left.rotation.z = 0.35;
      const right = new Mesh(horn, material);
      right.position.set(0.14, 1.58, 0);
      right.rotation.z = -0.35;
      for (const mesh of [torso, face, left, right]) {
        mesh.castShadow = true;
      }
      group.add(torso, face, left, right);
      const x = (index - (ENEMIES - 1) / 2) * 1.35 + (random() - 0.5) * 0.4;
      const z = -0.6 - random() * 2.4;
      group.position.set(x, 0, z);
      group.rotation.y = (random() - 0.5) * 0.8;
      group.scale.setScalar(0.85 + random() * 0.35);
      scene.add(group);
      return { group, flash, phase: random() * 6 };
    });

    let time = 0;
    return {
      action(key) {
        if (key === "hit") {
          const target = enemies[Math.floor(random() * enemies.length)];
          if (target) {
            target.flash.value = 1;
          }
        }
      },
      update({ dt }) {
        time += dt;
        const color =
          rimColors[isRimColor(params["color"]) ? params["color"] : "cyan"];
        shared.uRimColor.value.set(color);
        shared.uRimStrength.value = Number(params["strength"]);
        shared.uRimPower.value = Number(params["power"]);
        shared.uRimMask.value = params["mask"] === true ? 1 : 0;
        for (const enemy of enemies) {
          enemy.group.position.y =
            Math.abs(Math.sin(time * 2 + enemy.phase)) * 0.06;
          enemy.flash.value = Math.max(0, enemy.flash.value - dt * 3.5);
          const swell = enemy.group.scale.y * (1 + enemy.flash.value * 0.06);
          enemy.group.scale.x = swell;
          enemy.group.scale.z = swell;
        }
        torch.intensity =
          4.5 + Math.sin(time * 11) * 0.4 + Math.sin(time * 5.3) * 0.3;
        context.readout("リムの強さ", shared.uRimStrength.value.toFixed(2));
        context.caption(
          shared.uRimStrength.value < 0.05
            ? "リムライトがないと、暗い色の敵は背景の闇に溶けて、どこにいるのか分からない。"
            : "法線と視線の内積が 0 に近い（面が視線に対して横を向いている）縁ほど明るくする。形の輪郭だけが光るので、暗い場面でもシルエットが読める。"
        );
      },
      dispose() {
        for (const light of hidden) {
          light.visible = true;
        }
        scene.environmentIntensity = previousEnvironment;
      },
    };
  },
};
