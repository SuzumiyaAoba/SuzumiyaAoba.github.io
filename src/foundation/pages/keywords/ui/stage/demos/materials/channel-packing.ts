import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RGBAFormat,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, fract, hash2, palette, perlin2 } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 256;

/** パネル模様の ORM + 発光マスク（R = AO, G = 粗さ, B = 金属, A = 発光）と色を作る。 */
function buildTextures() {
  const packed = new Uint8Array(SIZE * SIZE * 4);
  const albedo = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      const cellX = Math.floor(u * 4);
      const cellY = Math.floor(v * 4);
      const fx = fract(u * 4);
      const fy = fract(v * 4);
      const edge = Math.min(fx, 1 - fx, fy, 1 - fy);
      const groove = clamp(edge / 0.07);
      const seed = hash2(cellX + 0.5, cellY + 0.5);
      const painted = seed > 0.45;
      const stripe = painted && seed > 0.8 && fract((u + v) * 12) < 0.5;
      const scratch = clamp(perlin2(u * 60, v * 8) * 3 - 0.9);
      const light =
        !painted && Math.abs(fy - 0.5) < 0.05 && fx > 0.2 && fx < 0.8 ? 1 : 0;
      const ao = 0.35 + 0.65 * groove;
      const roughness = painted
        ? 0.7 - scratch * 0.4
        : 0.25 + perlin2(u * 30, v * 30) * 0.15;
      const metal = painted ? scratch : 1;
      const index = (y * SIZE + x) * 4;
      packed[index] = ao * 255;
      packed[index + 1] = clamp(roughness) * 255;
      packed[index + 2] = clamp(metal) * 255;
      packed[index + 3] = light * 255;
      const base = stripe
        ? [230, 180, 40]
        : painted
          ? [60 + seed * 60, 90 + seed * 40, 110 + seed * 30]
          : [170, 175, 185];
      const worn = painted ? scratch : 0;
      const [red = 0, green = 0, blue = 0] = base;
      albedo[index] = red * (1 - worn) + 175 * worn;
      albedo[index + 1] = green * (1 - worn) + 178 * worn;
      albedo[index + 2] = blue * (1 - worn) + 185 * worn;
      albedo[index + 3] = 255;
    }
  }
  const make = (data: Uint8Array) => {
    const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  };
  const albedoTexture = make(albedo);
  albedoTexture.colorSpace = SRGBColorSpace;
  return { packed: make(packed), albedo: albedoTexture };
}

const channelNames = [
  "R：AO（隙間の暗さ）",
  "G：粗さ",
  "B：金属度",
  "A：発光",
] as const;

export const demo: DemoModule = {
  alt: "SF 風の金属パネルのデモ。1 枚のテクスチャの R・G・B・A の 4 チャンネルに、隙間の暗さ・表面の粗さ・金属かどうか・発光する場所という別々のマスクを詰め込み、1 回の読み込みで材質全体を制御する。右のパネルは各チャンネルを白黒で表示したもの。",
  camera: { position: [0.6, 1.8, 5.6], target: [0.6, 1.4, 0] },
  bloom: { strength: 0.7, radius: 0.4, threshold: 0.85 },
  controls: [
    { type: "toggle", key: "ao", label: "R を AO に使う", value: true },
    { type: "toggle", key: "roughness", label: "G を粗さに使う", value: true },
    {
      type: "toggle",
      key: "metalness",
      label: "B を金属度に使う",
      value: true,
    },
    { type: "toggle", key: "emissive", label: "A を発光に使う", value: true },
  ],
  legend: [{ color: palette.cyan, label: "発光マスク（A）の部分" }],
  hint: "視点を回して、金属部分だけが周囲を映り込ませ、塗装部分はつや消しになっていることを確かめてください。",
  setup(context) {
    const { scene, params } = context;
    const { packed, albedo } = buildTextures();
    context.track(packed);
    context.track(albedo);
    const uniforms = { uEmissive: { value: 1 } };
    const material = new MeshStandardMaterial({
      map: albedo,
      aoMap: packed,
      aoMapIntensity: 1,
      roughnessMap: packed,
      metalnessMap: packed,
      roughness: 1,
      metalness: 1,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms, { uPacked: { value: packed } });
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform sampler2D uPacked;\nuniform float uEmissive;"
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(0.2, 1.4, 1.3) * texture2D(uPacked, vMapUv).a * uEmissive;`
        );
    };
    material.customProgramCacheKey = () => "channel-packing";
    const panel = new Mesh(
      new RoundedBoxGeometry(2.2, 2.2, 0.35, 4, 0.08),
      material
    );
    panel.position.set(-0.8, 1.4, 0);
    panel.castShadow = true;
    scene.add(panel);

    const previews = channelNames.map((name, channel) => {
      const preview = new Mesh(
        new PlaneGeometry(0.85, 0.85),
        new ShaderMaterial({
          uniforms: { uMap: { value: packed }, uChannel: { value: channel } },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: /* glsl */ `
            uniform sampler2D uMap;
            uniform float uChannel;
            varying vec2 vUv;
            void main() {
              vec4 t = texture2D(uMap, vUv);
              float v = uChannel < 0.5 ? t.r : uChannel < 1.5 ? t.g : uChannel < 2.5 ? t.b : t.a;
              gl_FragColor = vec4(vec3(v * 0.72), 1.0);
            }
          `,
        })
      );
      const column = channel % 2;
      const row = Math.floor(channel / 2);
      preview.position.set(1.35 + column * 1.05, 2.05 - row * 1.25, 0);
      const label = context.label(name, { tone: "muted", size: "sm" });
      label.position.copy(preview.position).add(new Vector3(0, -0.56, 0));
      scene.add(preview, label);
      return preview;
    });

    const apply = () => {
      material.aoMap = params["ao"] === true ? packed : null;
      material.roughnessMap = params["roughness"] === true ? packed : null;
      material.metalnessMap = params["metalness"] === true ? packed : null;
      material.roughness = params["roughness"] === true ? 1 : 0.5;
      material.metalness = params["metalness"] === true ? 1 : 0;
      material.needsUpdate = true;
      uniforms.uEmissive.value = params["emissive"] === true ? 1 : 0;
      for (const [index, preview] of previews.entries()) {
        const key = ["ao", "roughness", "metalness", "emissive"][index] ?? "ao";
        preview.scale.setScalar(params[key] === true ? 1 : 0.8);
      }
    };
    apply();

    return {
      change() {
        apply();
      },
      update({ time }) {
        panel.rotation.y = Math.sin(time * 0.3) * 0.6;
        context.readout("テクスチャ", `1 枚（${SIZE}×${SIZE}、4 チャンネル）`);
        context.readout("サンプリング", "1 回で 4 つのマスク");
        context.caption(
          "白黒のマスクは 1 チャンネルで足りる。RGBA の 4 チャンネルに別々のマスクを詰めれば、テクスチャの枚数・メモリ・読み込み回数をまとめて減らせる。"
        );
      },
    };
  },
};
