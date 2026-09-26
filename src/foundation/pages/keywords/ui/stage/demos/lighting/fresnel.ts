import {
  BoxGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { schlick } from "../../brdf";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const WATER_Y = 0.35;
const POOL = { width: 5.2, depth: 3.6 };
const POOL_CENTER = new Vector3(-1.3, WATER_Y, 0);
const BALL_CENTER = new Vector3(2.9, 1, 0);

const materials = {
  water: { f0: 0.02, label: "水" },
  glass: { f0: 0.04, label: "ガラス" },
  diamond: { f0: 0.17, label: "ダイヤモンド" },
  metal: { f0: 0.9, label: "金属（銀）" },
} as const;
type MaterialKey = keyof typeof materials;
const isMaterial = (value: unknown): value is MaterialKey =>
  typeof value === "string" && Object.hasOwn(materials, value);

/** 空と遠景の山並み。反射で映り込む景色として水面と球で共有する。 */
const environmentGlsl = /* glsl */ `
  vec3 environment(vec3 r) {
    float angle = atan(r.z, r.x);
    float ridge = 0.08 + 0.05 * sin(angle * 5.0) + 0.03 * sin(angle * 13.0 + 1.0);
    vec3 sky = mix(vec3(0.95, 0.7, 0.45), vec3(0.25, 0.45, 0.85), smoothstep(0.0, 0.6, r.y));
    vec3 sun = vec3(1.0, 0.85, 0.6) * pow(max(dot(r, normalize(vec3(-0.6, 0.35, -0.7))), 0.0), 220.0) * 3.0;
    vec3 color = sky + sun;
    if (r.y < ridge) color = mix(vec3(0.12, 0.18, 0.2), vec3(0.2, 0.28, 0.3), smoothstep(-0.2, ridge, r.y));
    return color;
  }
`;

export const demo: DemoModule = {
  alt: "プールの水面とガラス球で、見る角度によって反射の強さが変わるフレネル効果を示すデモ。真上から見下ろすと水底のタイルが透けて見え、浅い角度で遠くを見ると空と山並みが鏡のように映り込む。球も、正面はほとんど反射せず、縁ほど周囲を強く映す。",
  camera: { position: [0.4, 2.3, 7.6], target: [0.2, 0.6, 0] },
  bloom: { strength: 0.5, radius: 0.4, threshold: 0.9 },
  controls: [
    {
      type: "select",
      key: "material",
      label: "素材（F0 = 正面の反射率）",
      value: "water",
      options: [
        { value: "water", label: "水 2%" },
        { value: "glass", label: "ガラス 4%" },
        { value: "diamond", label: "ダイヤ 17%" },
        { value: "metal", label: "金属 90%" },
      ],
    },
    {
      type: "toggle",
      key: "fresnel",
      label: "フレネル効果",
      value: true,
      hint: "オフにすると、角度に関係なく反射率が F0 のままになります。",
    },
    { type: "toggle", key: "waves", label: "さざ波", value: true },
  ],
  legend: [{ color: palette.amber, label: "今の視線の角度での反射率" }],
  hint: "視点を上下にドラッグして、水面を見下ろす角度を変えてみてください。",
  setup(context) {
    const { scene, params, camera } = context;
    const uniforms = {
      uTime: { value: 0 },
      uF0: { value: 0.02 },
      uFresnel: { value: 1 },
      uWaves: { value: 1 },
    };
    const water = new Mesh(
      new PlaneGeometry(POOL.width, POOL.depth),
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uF0;
          uniform float uFresnel;
          uniform float uWaves;
          varying vec3 vWorld;
          ${environmentGlsl}
          vec3 waveNormal(vec2 p) {
            vec2 g = vec2(0.0);
            g += vec2(0.8, 0.3) * cos(dot(p, vec2(0.8, 0.3)) * 7.0 + uTime * 2.0) * 0.025;
            g += vec2(-0.4, 0.9) * cos(dot(p, vec2(-0.4, 0.9)) * 9.0 + uTime * 2.6) * 0.02;
            g += vec2(0.6, -0.7) * cos(dot(p, vec2(0.6, -0.7)) * 15.0 + uTime * 3.4) * 0.012;
            return normalize(vec3(-g.x * uWaves, 1.0, -g.y * uWaves));
          }
          vec3 poolBottom(vec3 q) {
            vec2 tile = abs(fract(q.xz * 2.5) - 0.5);
            float grout = smoothstep(0.44, 0.47, max(tile.x, tile.y));
            vec3 color = mix(vec3(0.3, 0.75, 0.85), vec3(0.9, 0.95, 0.95), grout);
            float lane = step(abs(q.z), 0.12) * step(abs(q.x - (${POOL_CENTER.x.toFixed(2)})), 2.0);
            return mix(color, vec3(0.05, 0.12, 0.3), lane * 0.8);
          }
          void main() {
            vec3 v = normalize(vWorld - cameraPosition);
            vec3 n = waveNormal(vWorld.xz);
            float cosTheta = clamp(dot(-v, n), 0.0, 1.0);
            float fresnel = uFresnel > 0.5 ? uF0 + (1.0 - uF0) * pow(1.0 - cosTheta, 5.0) : uF0;
            vec3 reflected = environment(reflect(v, n));
            // 屈折した視線が水底（深さ 1.2 m）に当たる点のタイルの色
            vec3 t = refract(v, n, 1.0 / 1.33);
            float depth = 1.2;
            float travel = depth / max(-t.y, 0.05);
            vec3 q = vWorld + t * travel;
            vec3 absorb = exp(-vec3(0.45, 0.12, 0.08) * travel);
            vec3 refracted = poolBottom(q) * absorb * 0.9;
            vec3 color = mix(refracted, reflected, fresnel);
            gl_FragColor = vec4(pow(color, vec3(2.2)), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.copy(POOL_CENTER);
    scene.add(water);
    const rim = standard("#c9c3b6", { roughness: 0.7 });
    const edges = [
      {
        size: [POOL.width + 0.5, 0.45, 0.25],
        at: [0, 0, POOL.depth / 2 + 0.125],
      },
      {
        size: [POOL.width + 0.5, 0.45, 0.25],
        at: [0, 0, -POOL.depth / 2 - 0.125],
      },
      { size: [0.25, 0.45, POOL.depth], at: [POOL.width / 2 + 0.125, 0, 0] },
      { size: [0.25, 0.45, POOL.depth], at: [-POOL.width / 2 - 0.125, 0, 0] },
    ] as const;
    for (const { size, at } of edges) {
      const edge = new Mesh(new BoxGeometry(size[0], size[1], size[2]), rim);
      edge.position.set(POOL_CENTER.x + at[0], 0.225, POOL_CENTER.z + at[2]);
      edge.castShadow = true;
      edge.receiveShadow = true;
      scene.add(edge);
    }

    const ball = new Mesh(
      new SphereGeometry(0.9, 96, 64),
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          varying vec3 vNormal;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            vNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uF0;
          uniform float uFresnel;
          varying vec3 vWorld;
          varying vec3 vNormal;
          ${environmentGlsl}
          void main() {
            vec3 v = normalize(vWorld - cameraPosition);
            vec3 n = normalize(vNormal);
            float cosTheta = clamp(dot(-v, n), 0.0, 1.0);
            float fresnel = uFresnel > 0.5 ? uF0 + (1.0 - uF0) * pow(1.0 - cosTheta, 5.0) : uF0;
            vec3 body = vec3(0.1, 0.13, 0.18) * (0.4 + 0.6 * max(n.y, 0.0));
            vec3 color = mix(body, environment(reflect(v, n)), fresnel);
            gl_FragColor = vec4(pow(color, vec3(2.2)), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    ball.position.copy(BALL_CENTER);
    ball.castShadow = true;
    scene.add(ball);

    const graph = hudGraph(context, {
      title: "反射率（横軸：視線と法線のなす角 0°〜90°）",
      xLabel: "90°",
    });
    let drawnF0 = -1;
    let drawnFresnel = true;
    const toCamera = new Vector3();
    let time = 0;

    return {
      update({ dt }) {
        time += dt;
        const material: MaterialKey = isMaterial(params["material"])
          ? params["material"]
          : "water";
        const { f0, label } = materials[material];
        const fresnel = params["fresnel"] === true;
        uniforms.uTime.value = time;
        uniforms.uF0.value = f0;
        uniforms.uFresnel.value = fresnel ? 1 : 0;
        uniforms.uWaves.value = params["waves"] === true ? 1 : 0;
        if (f0 !== drawnF0 || fresnel !== drawnFresnel) {
          drawnF0 = f0;
          drawnFresnel = fresnel;
          graph.setSeries([
            {
              fn: (t) =>
                fresnel ? schlick(Math.cos((t * Math.PI) / 2), f0) : f0,
              color: palette.amber,
              label,
            },
          ]);
        }
        // 水面の中央を見る視線の角度
        toCamera.subVectors(camera.position, POOL_CENTER).normalize();
        const angle = Math.acos(Math.max(0, Math.min(1, toCamera.y)));
        graph.setMarker(angle / (Math.PI / 2));
        const reflectance = fresnel ? schlick(Math.cos(angle), f0) : f0;
        context.readout(
          "視線の角度（水面の中央）",
          `${((angle * 180) / Math.PI).toFixed(0)}°`
        );
        context.readout(
          "その角度での反射率",
          `${(reflectance * 100).toFixed(1)} %`
        );
        context.caption(
          fresnel
            ? "物体に正面から当たる光はほとんど反射せず（水で 2%）、かすめるような浅い角度ほど強く反射して、90° では 100% に近づく。遠くの水面が空を映し、足元が透けるのはこのため。"
            : "フレネル効果がないと、角度に関係なく反射率が一定になる。遠くの水面も空を映さず、不自然にのっぺりと見える。"
        );
      },
    };
  },
};
