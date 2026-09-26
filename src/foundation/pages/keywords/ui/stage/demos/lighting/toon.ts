import {
  AmbientLight,
  BackSide,
  DirectionalLight,
  ConeGeometry,
  DataTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  RGBAFormat,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import type { BufferGeometry, Material } from "three";
import { palette } from "../../kit";
import type { DemoModule } from "../../types";

const RAMP_SIZE = 64;

type Stop = readonly [
  position: number,
  color: readonly [number, number, number],
];

const ramps: Record<string, readonly Stop[]> = {
  two: [
    [0, [0.32, 0.32, 0.36]],
    [0.5, [1, 1, 1]],
  ],
  three: [
    [0, [0.22, 0.22, 0.28]],
    [0.42, [0.6, 0.6, 0.66]],
    [0.62, [1, 1, 1]],
  ],
  warm: [
    [0, [0.28, 0.24, 0.5]],
    [0.45, [0.72, 0.62, 0.8]],
    [0.58, [1.02, 0.97, 0.9]],
    [0.93, [1.25, 1.2, 1.1]],
  ],
};

/** 光の当たり具合（0 = 真裏 〜 1 = 正面）を色に写すランプ画像。shift で境目をずらす。 */
function rampTexture(stops: readonly Stop[], shift: number) {
  const data = new Uint8Array(RAMP_SIZE * 4);
  for (let x = 0; x < RAMP_SIZE; x++) {
    const t = x / (RAMP_SIZE - 1) - shift;
    let color = stops[0]?.[1] ?? [1, 1, 1];
    for (const [position, stopColor] of stops) {
      if (t >= position) {
        color = stopColor;
      }
    }
    // 1 を超える値も表せるよう 1/1.3 に縮めて保存し、シェーダーで戻す
    data[x * 4] = Math.min(255, (color[0] / 1.3) * 255);
    data[x * 4 + 1] = Math.min(255, (color[1] / 1.3) * 255);
    data[x * 4 + 2] = Math.min(255, (color[2] / 1.3) * 255);
    data[x * 4 + 3] = 255;
  }
  const texture = new DataTexture(data, RAMP_SIZE, 1, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

/** 輪郭線：法線方向に少し膨らませた裏面だけを暗い色で描く（背面法）。 */
function outlineMaterial(width: { value: number }) {
  return new ShaderMaterial({
    side: BackSide,
    uniforms: { uWidth: width },
    vertexShader: /* glsl */ `
      uniform float uWidth;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        // 画面上でほぼ一定の太さになるよう、距離に比例して膨らませる
        view.xyz += n * uWidth * -view.z * 0.01;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      void main() {
        gl_FragColor = vec4(0.03, 0.03, 0.06, 1.0);
      }
    `,
  });
}

export const demo: DemoModule = {
  alt: "ペンギンのキャラクターを、物理ベースの陰影と、段階的な色の帯（ランプ）に置き換えたトゥーンシェーディングで描き比べるデモ。光の当たり具合を 1 枚の横長の画像（ランプ）で色に変換するので、2 段・3 段の陰影や、影を青紫に寄せたアニメ調の配色に差し替えられる。裏面を膨らませる方法で輪郭線も描いている。",
  camera: { position: [2.2, 2, 4.6], target: [0, 1.05, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "陰影",
      value: "warm",
      options: [
        { value: "pbr", label: "PBR（比較）" },
        { value: "two", label: "2 段" },
        { value: "three", label: "3 段" },
        { value: "warm", label: "色付きランプ" },
      ],
    },
    {
      type: "range",
      key: "shift",
      label: "影の境目の位置",
      min: -0.25,
      max: 0.25,
      step: 0.01,
      value: 0,
    },
    { type: "toggle", key: "outline", label: "輪郭線", value: true },
    {
      type: "range",
      key: "width",
      label: "輪郭線の太さ",
      min: 0.2,
      max: 2,
      step: 0.05,
      value: 0.8,
    },
    { type: "toggle", key: "spin", label: "回転させる", value: true },
  ],
  legend: [{ color: palette.violet, label: "影側の色（色付きランプ）" }],
  setup(context) {
    const { scene, params } = context;
    // 段がはっきり見えるよう、なめらかな半球光やリムライトを止め、平らな環境光と 1 つの平行光源にする
    const hidden = scene.children.filter(
      (child) =>
        (child.type === "HemisphereLight" ||
          child.type === "DirectionalLight") &&
        child.visible
    );
    for (const light of hidden) {
      light.visible = false;
    }
    const key = new DirectionalLight("#fff6ea", 2.6);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    const ambient = new AmbientLight("#aab8d8", 0.35);
    scene.add(key, ambient);
    const previousEnvironment = scene.environmentIntensity;
    scene.environmentIntensity = 0.1;
    let ramp = rampTexture(ramps["warm"] ?? [], 0);
    const toonMaterials: MeshToonMaterial[] = [];
    const pbrMaterials: MeshStandardMaterial[] = [];
    const makeMaterials = (color: string) => {
      const toon = new MeshToonMaterial({ color, gradientMap: ramp });
      toon.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <gradientmap_pars_fragment>",
          /* glsl */ `
          uniform sampler2D gradientMap;
          vec3 getGradientIrradiance(vec3 normal, vec3 lightDirection) {
            float dotNL = dot(normal, lightDirection);
            vec2 coord = vec2(dotNL * 0.5 + 0.5, 0.0);
            return texture2D(gradientMap, coord).rgb * 1.3;
          }
          `
        );
      };
      toon.customProgramCacheKey = () => "toon-rgb-ramp";
      toonMaterials.push(toon);
      const pbr = new MeshStandardMaterial({ color, roughness: 0.55 });
      pbrMaterials.push(pbr);
      return { toon, pbr };
    };

    const width = { value: 0.8 };
    const outline = outlineMaterial(width);
    const penguin = new Group();
    const parts: { mesh: Mesh; toon: Material; pbr: Material; hull: Mesh }[] =
      [];
    const add = (
      geometry: BufferGeometry,
      color: string,
      position: readonly [number, number, number],
      scale: readonly [number, number, number] = [1, 1, 1],
      rotation: readonly [number, number, number] = [0, 0, 0]
    ) => {
      const { toon, pbr } = makeMaterials(color);
      const mesh = new Mesh(geometry, toon);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      const hull = new Mesh(geometry, outline);
      mesh.add(hull);
      penguin.add(mesh);
      parts.push({ mesh, toon, pbr, hull });
    };
    const sphere = new SphereGeometry(1, 64, 48);
    add(sphere, "#2c3e66", [0, 0.95, 0], [0.62, 0.8, 0.58]);
    add(sphere, "#f4efe6", [0, 0.9, 0.2], [0.46, 0.64, 0.42]);
    add(sphere, "#2c3e66", [0, 1.78, 0], [0.42, 0.4, 0.4]);
    add(sphere, "#f4efe6", [0.14, 1.8, 0.29], [0.13, 0.15, 0.08]);
    add(sphere, "#f4efe6", [-0.14, 1.8, 0.29], [0.13, 0.15, 0.08]);
    add(sphere, "#101018", [0.14, 1.79, 0.36], [0.055, 0.07, 0.04]);
    add(sphere, "#101018", [-0.14, 1.79, 0.36], [0.055, 0.07, 0.04]);
    add(
      new ConeGeometry(0.1, 0.26, 24),
      "#f59a3a",
      [0, 1.64, 0.42],
      [1, 1, 0.7],
      [Math.PI / 2, 0, 0]
    );
    add(sphere, "#2c3e66", [0.6, 1, 0], [0.12, 0.45, 0.28], [0, 0, 0.35]);
    add(sphere, "#2c3e66", [-0.6, 1, 0], [0.12, 0.45, 0.28], [0, 0, -0.35]);
    add(sphere, "#f59a3a", [0.22, 0.12, 0.15], [0.2, 0.07, 0.3]);
    add(sphere, "#f59a3a", [-0.22, 0.12, 0.15], [0.2, 0.07, 0.3]);
    scene.add(penguin);

    // HUD：現在のランプ画像
    const preview = document.createElement("figure");
    preview.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "ランプ画像（左 = 光の真裏 → 右 = 正面）";
    const canvas = document.createElement("canvas");
    canvas.width = RAMP_SIZE;
    canvas.height = 1;
    canvas.style.width = "12rem";
    canvas.style.display = "block";
    canvas.style.height = "1.5rem";
    canvas.style.imageRendering = "pixelated";
    canvas.style.borderRadius = "0.25rem";
    preview.append(caption, canvas);
    context.hud(preview);
    const paintPreview = (texture: DataTexture) => {
      const context2d = canvas.getContext("2d");
      const source = texture.image.data;
      if (!context2d || !(source instanceof Uint8Array)) {
        return;
      }
      const image = context2d.createImageData(RAMP_SIZE, 1);
      for (let index = 0; index < source.length; index++) {
        image.data[index] = Math.min(
          255,
          (source[index] ?? 0) * (index % 4 === 3 ? 1 : 1.3)
        );
      }
      context2d.putImageData(image, 0, 0);
    };

    let signature = "";
    return {
      update({ dt }) {
        const mode = String(params["mode"]);
        const shift = Number(params["shift"]);
        const nextSignature = `${mode}:${shift}`;
        if (nextSignature !== signature) {
          signature = nextSignature;
          if (mode !== "pbr") {
            ramp.dispose();
            ramp = rampTexture(ramps[mode] ?? ramps["two"] ?? [], shift);
            for (const material of toonMaterials) {
              material.gradientMap = ramp;
            }
            paintPreview(ramp);
          }
          preview.hidden = mode === "pbr";
          for (const part of parts) {
            part.mesh.material = mode === "pbr" ? part.pbr : part.toon;
          }
        }
        width.value = Number(params["width"]);
        for (const part of parts) {
          part.hull.visible = params["outline"] === true;
        }
        if (params["spin"] === true) {
          penguin.rotation.y += dt * 0.5;
        }
        context.caption(
          mode === "pbr"
            ? "物理ベースの陰影は、光の当たり具合に応じて明るさがなめらかに変わる。立体感はあるが、アニメやイラストの見た目とは違う。"
            : "法線と光の向きの内積（光の当たり具合）を横軸にしてランプ画像を読み、その色で塗る。段の数、境目の位置、影の色をすべて画像で決められる。"
        );
      },
      dispose() {
        ramp.dispose();
        for (const light of hidden) {
          light.visible = true;
        }
        scene.environmentIntensity = previousEnvironment;
      },
    };
  },
};
