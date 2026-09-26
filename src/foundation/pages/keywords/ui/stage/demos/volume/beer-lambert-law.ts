import {
  BoxGeometry,
  CustomBlending,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  ZeroFactor,
  SrcColorFactor,
} from "three";
import { palette } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const THICKNESS = [0.25, 0.5, 1, 2, 3] as const;
const TANK_WIDTH = 0.85;
const TANK_HEIGHT = 1.3;

const liquids = {
  sea: { sigma: [0.9, 0.18, 0.08], label: "海水（赤を強く吸収）" },
  tea: { sigma: [0.08, 0.35, 1.2], label: "紅茶（青を強く吸収）" },
  smoke: { sigma: [0.45, 0.45, 0.45], label: "灰色の煙（全色を同じだけ）" },
} as const;
type Liquid = keyof typeof liquids;
const isLiquid = (value: unknown): value is Liquid =>
  typeof value === "string" && Object.hasOwn(liquids, value);

export const demo: DemoModule = {
  alt: "厚みの違う 5 つの水槽を通して、後ろの白い壁を見るビール・ランバート則のデモ。光は通り抜ける距離に対して指数関数的に弱まり、色ごとに弱まり方が違うと、厚いほど色が濃く変わっていく。海水は赤を吸収するので厚いほど青緑に、紅茶は青を吸収するので琥珀色になる。",
  camera: { position: [0, 1.25, 7.4], target: [0, 1, 0] },
  controls: [
    {
      type: "select",
      key: "liquid",
      label: "中身",
      value: "sea",
      options: [
        { value: "sea", label: "海水" },
        { value: "tea", label: "紅茶" },
        { value: "smoke", label: "煙" },
      ],
    },
    {
      type: "range",
      key: "density",
      label: "濃さ（吸収係数の倍率）",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1,
    },
  ],
  legend: [
    { color: palette.coral, label: "赤の透過率" },
    { color: palette.lime, label: "緑の透過率" },
    { color: palette.sky, label: "青の透過率" },
  ],
  setup(context) {
    const { scene, params } = context;
    // 明るい壁（縞模様）
    const wall = new Mesh(
      new PlaneGeometry(10, 3.4),
      new ShaderMaterial({
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            float stripe = step(0.5, fract(vUv.x * 30.0 + vUv.y * 4.0));
            vec3 color = mix(vec3(0.95), vec3(0.8), stripe * 0.4);
            gl_FragColor = vec4(color * 1.2, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    wall.position.set(0, 1.5, -2.2);
    scene.add(wall);

    const sigma = new Vector3(0.9, 0.18, 0.08);
    const uniforms = { uSigma: { value: sigma } };
    const edge = new LineBasicMaterial({
      color: "#b8c6d8",
      transparent: true,
      opacity: 0.5,
    });
    for (const [index, thickness] of THICKNESS.entries()) {
      const x = (index - 2) * 1.35;
      const half = new Vector3(TANK_WIDTH / 2, TANK_HEIGHT / 2, thickness / 2);
      const center = new Vector3(
        x,
        TANK_HEIGHT / 2 + 0.35,
        -1.4 + thickness / 2
      );
      const tank = new Mesh(
        new BoxGeometry(TANK_WIDTH, TANK_HEIGHT, thickness),
        new ShaderMaterial({
          uniforms: {
            ...uniforms,
            uCenter: { value: center },
            uHalf: { value: half },
          },
          transparent: true,
          depthWrite: false,
          blending: CustomBlending,
          blendSrc: ZeroFactor,
          blendDst: SrcColorFactor,
          vertexShader: /* glsl */ `
            varying vec3 vWorld;
            void main() {
              vec4 world = modelMatrix * vec4(position, 1.0);
              vWorld = world.xyz;
              gl_Position = projectionMatrix * viewMatrix * world;
            }
          `,
          fragmentShader: /* glsl */ `
            uniform vec3 uSigma;
            uniform vec3 uCenter;
            uniform vec3 uHalf;
            varying vec3 vWorld;
            void main() {
              // 視線が箱の中を通る長さ（厚み）を求め、色ごとに指数関数で弱める
              vec3 rd = normalize(vWorld - cameraPosition);
              vec3 inv = 1.0 / rd;
              vec3 t0 = (uCenter - uHalf - cameraPosition) * inv;
              vec3 t1 = (uCenter + uHalf - cameraPosition) * inv;
              vec3 lo = min(t0, t1);
              vec3 hi = max(t0, t1);
              float enter = max(max(lo.x, lo.y), lo.z);
              float exit = min(min(hi.x, hi.y), hi.z);
              float thickness = max(exit - max(enter, 0.0), 0.0);
              vec3 transmittance = exp(-uSigma * thickness);
              gl_FragColor = vec4(transmittance, 1.0);
            }
          `,
        })
      );
      tank.position.copy(center);
      const frame = new LineSegments(new EdgesGeometry(tank.geometry), edge);
      frame.position.copy(center);
      const label = context.label(`${thickness} m`, { size: "md" });
      label.position.set(x, TANK_HEIGHT + 0.6, -1.4);
      scene.add(tank, frame, label);
    }

    const graph = hudGraph(context, {
      title: "透過率 T = e^(−σd)（横軸：厚み 0〜4 m）",
      xMax: 4,
      xLabel: "4 m",
    });
    let drawn = "";

    return {
      update() {
        const liquid: Liquid = isLiquid(params["liquid"])
          ? params["liquid"]
          : "sea";
        const density = Number(params["density"]);
        const [r, g, b] = liquids[liquid].sigma;
        sigma.set(r * density, g * density, b * density);
        const key = `${liquid}:${density}`;
        if (key !== drawn) {
          drawn = key;
          graph.setSeries([
            {
              fn: (d) => Math.exp(-sigma.x * d),
              color: palette.coral,
              label: "赤",
            },
            {
              fn: (d) => Math.exp(-sigma.y * d),
              color: palette.lime,
              label: "緑",
            },
            {
              fn: (d) => Math.exp(-sigma.z * d),
              color: palette.sky,
              label: "青",
            },
          ]);
        }
        graph.setMarker(2);
        context.readout("中身", liquids[liquid].label);
        context.readout(
          "2 m 通過後の透過率（R/G/B）",
          [sigma.x, sigma.y, sigma.z]
            .map((s) => `${Math.round(Math.exp(-s * 2) * 100)}%`)
            .join(" / ")
        );
        context.caption(
          "同じ厚みを通るたびに、光は同じ割合ずつ減る（1 m で半分なら、2 m で 1/4）。色ごとに減り方が違うと、厚くなるほど残りやすい色が強調される。深い海が青いのはこのため。"
        );
      },
    };
  },
};
