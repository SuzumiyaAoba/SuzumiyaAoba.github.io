import {
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  RGBADepthPacking,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { glslSimplex } from "../../glsl";
import { palette, standard } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const HEIGHT = 2.6;

function statueGeometry() {
  const parts = [
    new CapsuleGeometry(0.42, 0.9, 8, 24).translate(0, 1.35, 0),
    new SphereGeometry(0.3, 32, 24).translate(0, 2.25, 0),
    new CapsuleGeometry(0.12, 0.8, 6, 12).rotateZ(0.6).translate(-0.72, 1.4, 0),
    new CapsuleGeometry(0.12, 0.8, 6, 12).rotateZ(-0.6).translate(0.72, 1.4, 0),
    new CapsuleGeometry(0.15, 0.7, 6, 12).translate(-0.2, 0.5, 0),
    new CapsuleGeometry(0.15, 0.7, 6, 12).translate(0.2, 0.5, 0),
  ];
  return mergeGeometries(parts.map((part) => part.toNonIndexed()));
}

const ping = (t: number) => {
  const phase = t % 1;
  return phase < 0.45
    ? phase / 0.45
    : phase < 0.55
      ? 1
      : phase < 0.95
        ? 1 - (phase - 0.55) / 0.4
        : 0;
};

export const demo: DemoModule = {
  alt: "石像がノイズ状に燃え落ちて消えていくディゾルブのデモ。表面の各点にノイズの値を持たせ、しきい値より小さい部分を描かずに切り抜く。しきい値のすぐ上の細い帯を光らせると、燃えて消える縁になる。高さを混ぜると下から上へ消える演出にもなる。",
  camera: { position: [2.8, 2, 4.4], target: [0, 1.3, 0] },
  bloom: { strength: 1, radius: 0.5, threshold: 0.6 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "消え方",
      value: "noise",
      options: [
        { value: "noise", label: "ノイズのみ" },
        { value: "rise", label: "下から上へ" },
      ],
    },
    { type: "toggle", key: "auto", label: "自動で進める", value: true },
    {
      type: "range",
      key: "progress",
      label: "しきい値（手動）",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.45,
    },
    {
      type: "range",
      key: "edge",
      label: "燃える縁の幅",
      min: 0,
      max: 0.2,
      step: 0.005,
      value: 0.04,
    },
    {
      type: "range",
      key: "scale",
      label: "ノイズの細かさ",
      min: 0.5,
      max: 6,
      step: 0.1,
      value: 2.4,
    },
  ],
  legend: [
    { color: palette.amber, label: "燃える縁（しきい値付近）" },
    { color: palette.muted, label: "残っている部分" },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uThreshold: { value: 0.45 },
      uEdge: { value: 0.04 },
      uScale: { value: 2.4 },
      uRise: { value: 0 },
    };
    const material = new MeshStandardMaterial({
      color: "#9aa0a8",
      roughness: 0.75,
      metalness: 0.1,
      side: DoubleSide,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvObj = position;"
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          ${glslSimplex}
          uniform float uThreshold;
          uniform float uEdge;
          uniform float uScale;
          uniform float uRise;
          varying vec3 vObj;
          float dissolveValue() {
            float n = clamp(fbm3(vObj * uScale, 4) * 1.5 + 0.5, 0.0, 1.0);
            if (uRise > 0.5) {
              return clamp(vObj.y / ${HEIGHT.toFixed(1)} * 0.8 + n * 0.25, 0.0, 1.0);
            }
            return n;
          }`
        )
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
          float dissolve = dissolveValue();
          if (dissolve < uThreshold) discard;`
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float burn = 1.0 - smoothstep(0.0, uEdge, dissolve - uThreshold);
          totalEmissiveRadiance += mix(vec3(1.2, 0.25, 0.03), vec3(2.2, 1.2, 0.35), burn * burn) * burn * step(0.001, uEdge);
          diffuseColor.rgb *= 1.0 - burn * 0.8;`
        );
    };
    material.customProgramCacheKey = () => "dissolve-statue";
    const statue = new Mesh(statueGeometry(), material);
    statue.castShadow = true;
    // 影の描画にも同じ切り抜きを適用する（しないと消えた部分の影が残る）
    const depthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
    });
    depthMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvObj = position;"
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          ${glslSimplex}
          uniform float uThreshold;
          uniform float uScale;
          uniform float uRise;
          varying vec3 vObj;`
        )
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
          float n = clamp(fbm3(vObj * uScale, 4) * 1.5 + 0.5, 0.0, 1.0);
          float value = uRise > 0.5 ? clamp(vObj.y / ${HEIGHT.toFixed(1)} * 0.8 + n * 0.25, 0.0, 1.0) : n;
          if (value < uThreshold) discard;`
        );
    };
    depthMaterial.customProgramCacheKey = () => "dissolve-depth";
    statue.customDepthMaterial = depthMaterial;
    scene.add(statue);
    const pedestal = new Mesh(
      new CylinderGeometry(0.8, 0.9, 0.15, 48),
      standard("#3a4150", { roughness: 0.6 })
    );
    pedestal.position.y = 0.075;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const graph = hudGraph(context, {
      title: "しきい値の変化",
      xLabel: "時間",
    });
    graph.setSeries([{ fn: ping, color: palette.amber }]);
    let clock = 0.2;

    return {
      update({ dt }) {
        const auto = params["auto"] === true;
        if (auto) {
          clock += dt / 7;
        }
        const threshold = auto
          ? ping(clock) * 1.02 - 0.01
          : Number(params["progress"]);
        uniforms.uThreshold.value = threshold;
        uniforms.uEdge.value = Number(params["edge"]);
        uniforms.uScale.value = Number(params["scale"]);
        uniforms.uRise.value = params["mode"] === "rise" ? 1 : 0;
        statue.rotation.y += dt * 0.25;
        graph.setVisible(auto);
        graph.setMarker(clock % 1);
        context.readout("しきい値", threshold.toFixed(2));
        context.caption(
          "表面の各点のノイズ値がしきい値より小さければ描かない（discard）。しきい値より少しだけ大きい帯を発光させると、燃えて崩れる縁になる。"
        );
      },
    };
  },
};
