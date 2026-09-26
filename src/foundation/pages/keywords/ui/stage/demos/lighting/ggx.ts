import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { beckmannD, blinnPhongD, ggxD } from "../../brdf";
import { arrow, palette, rng, segments, standard, TAU } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const FACETS = 22;
const FACET_SIZE = 0.13;
const PATCH_CENTER = new Vector3(-2.3, 0.35, 0);
const SPHERE_CENTER = new Vector3(1.6, 1.1, 0);

const distributions = { ggx: 0, beckmann: 1, phong: 2 } as const;
type Distribution = keyof typeof distributions;
const isDistribution = (value: unknown): value is Distribution =>
  typeof value === "string" && Object.hasOwn(distributions, value);

export const demo: DemoModule = {
  alt: "表面を顕微鏡で見たときの小さな面（微小面）の向きのばらつきを GGX 分布で表すデモ。左は微小面の集まりで、各面が光を鏡のように反射する向きを線で示している。粗さを上げると微小面の向きがばらつき、反射が広がる。右の球では GGX・Beckmann・Blinn-Phong の 3 つの分布によるハイライトを比べられ、GGX はハイライトの周りに長い裾を持つ。",
  camera: { position: [0, 2.6, 7], target: [-0.2, 0.9, 0] },
  bloom: { strength: 0.5, radius: 0.4, threshold: 0.9 },
  controls: [
    {
      type: "range",
      key: "roughness",
      label: "粗さ",
      min: 0.05,
      max: 1,
      step: 0.01,
      value: 0.4,
    },
    {
      type: "select",
      key: "distribution",
      label: "球の分布関数",
      value: "ggx",
      options: [
        { value: "ggx", label: "GGX" },
        { value: "beckmann", label: "Beckmann" },
        { value: "phong", label: "Blinn-Phong" },
      ],
    },
    {
      type: "toggle",
      key: "rays",
      label: "微小面の反射方向を表示",
      value: true,
    },
    { type: "toggle", key: "orbit", label: "光源を回す", value: true },
  ],
  legend: [
    { color: palette.amber, label: "光" },
    { color: palette.sky, label: "微小面で反射した向き" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(4);
    const count = FACETS * FACETS;
    const seeds = Array.from(
      { length: count },
      () => [random(), random()] as const
    );
    const facets = new InstancedMesh(
      new BoxGeometry(FACET_SIZE * 0.96, 0.02, FACET_SIZE * 0.96),
      standard("#c8ced8", { metalness: 0.9, roughness: 0.25 }),
      count
    );
    facets.castShadow = true;
    const base = new Mesh(
      new BoxGeometry(
        FACETS * FACET_SIZE + 0.1,
        0.3,
        FACETS * FACET_SIZE + 0.1
      ),
      standard("#2a3240", { roughness: 0.7 })
    );
    base.position.copy(PATCH_CENTER).setY(0.15);
    const rays = segments([], palette.sky, { width: 1, opacity: 0.4 });
    const light = arrow(palette.amber, { radius: 0.03, emissive: 0.9 });
    const patchLabel = context.label("微小面の集まり（拡大図）", {
      size: "md",
    });
    patchLabel.position.copy(PATCH_CENTER).add(new Vector3(0, 1.9, 0));
    scene.add(base, facets, rays, light, patchLabel);

    const sphereUniforms = {
      uLight: { value: new Vector3(0.5, 0.8, 0.4).normalize() },
      uRoughness: { value: 0.4 },
      uDistribution: { value: 0 },
    };
    const sphere = new Mesh(
      new SphereGeometry(1, 96, 64),
      new ShaderMaterial({
        uniforms: sphereUniforms,
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            vNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uLight;
          uniform float uRoughness;
          uniform float uDistribution;
          varying vec3 vNormal;
          varying vec3 vWorld;
          const float PI = 3.14159265;
          float distribution(float nh, float roughness) {
            float a = max(roughness * roughness, 1e-3);
            float a2 = a * a;
            if (uDistribution < 0.5) {
              float d = nh * nh * (a2 - 1.0) + 1.0;
              return a2 / (PI * d * d);
            }
            if (uDistribution < 1.5) {
              float c2 = max(nh * nh, 1e-6);
              return exp((c2 - 1.0) / (c2 * a2)) / (PI * a2 * c2 * c2);
            }
            float exponent = 2.0 / a2 - 2.0;
            return (exponent + 2.0) / (2.0 * PI) * pow(max(nh, 0.0), exponent);
          }
          void main() {
            vec3 n = normalize(vNormal);
            vec3 v = normalize(cameraPosition - vWorld);
            vec3 l = normalize(uLight);
            vec3 h = normalize(l + v);
            float nl = max(dot(n, l), 0.0);
            float nv = max(dot(n, v), 1e-3);
            float nh = max(dot(n, h), 0.0);
            float k = (uRoughness + 1.0) * (uRoughness + 1.0) / 8.0;
            float g = (nl / (nl * (1.0 - k) + k)) * (nv / (nv * (1.0 - k) + k));
            float f = 0.04 + 0.96 * pow(1.0 - max(dot(h, v), 0.0), 5.0);
            float specular = distribution(nh, uRoughness) * g * f / (4.0 * max(nl, 1e-3) * nv);
            vec3 albedo = vec3(0.2, 0.26, 0.38);
            vec3 color = (albedo / PI + vec3(specular)) * nl * 3.2;
            color += albedo * 0.08;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    sphere.position.copy(SPHERE_CENTER);
    sphere.castShadow = true;
    scene.add(sphere);

    const graph = hudGraph(context, {
      title: "分布の形（対数目盛、中心 = 1、下端 = 1/1000）",
      xLabel: "法線とのずれ",
    });
    const drawGraph = (roughness: number) => {
      const shape =
        (fn: (cosH: number, r: number) => number) => (t: number) => {
          const angle = t * (Math.PI / 3);
          const ratio = fn(Math.cos(angle), roughness) / fn(1, roughness);
          // 対数目盛：1 〜 1/1000 を 1 〜 0 に写す
          return Math.max(0, (Math.log10(Math.max(ratio, 1e-6)) + 3) / 3);
        };
      graph.setSeries([
        { fn: shape(ggxD), color: palette.amber, label: "GGX" },
        {
          fn: shape(beckmannD),
          color: palette.cyan,
          label: "Beckmann",
          dashed: true,
        },
        {
          fn: shape(blinnPhongD),
          color: palette.pink,
          label: "Blinn-Phong",
          dashed: true,
        },
      ]);
    };

    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const normal = new Vector3();
    const center = new Vector3();
    const reflected = new Vector3();
    const toLight = new Vector3();
    const scale = new Vector3(1, 1, 1);
    let drawn = -1;
    let angle = 0.6;

    const rebuild = (roughness: number, showRays: boolean) => {
      const alpha = roughness * roughness;
      const lines: Vector3[] = [];
      for (let j = 0; j < FACETS; j++) {
        for (let i = 0; i < FACETS; i++) {
          const index = j * FACETS + i;
          const [u, w] = seeds[index] ?? [0.5, 0.5];
          // GGX 分布に従って微小面の法線を選ぶ
          const theta = Math.atan(alpha * Math.sqrt(u / Math.max(1 - u, 1e-6)));
          const phi = w * TAU;
          normal.set(
            Math.sin(theta) * Math.cos(phi),
            Math.cos(theta),
            Math.sin(theta) * Math.sin(phi)
          );
          rotation.setFromUnitVectors(up, normal);
          center.set(
            PATCH_CENTER.x + (i - (FACETS - 1) / 2) * FACET_SIZE,
            PATCH_CENTER.y + 0.02,
            PATCH_CENTER.z + (j - (FACETS - 1) / 2) * FACET_SIZE
          );
          matrix.compose(center, rotation, scale);
          facets.setMatrixAt(index, matrix);
          if (showRays && (i + j) % 2 === 0) {
            reflected.copy(toLight).multiplyScalar(-1).reflect(normal);
            if (reflected.y > 0) {
              lines.push(
                center.clone(),
                center.clone().addScaledVector(reflected, 0.9)
              );
            }
          }
        }
      }
      facets.instanceMatrix.needsUpdate = true;
      rays.setPoints(lines);
      rays.visible = showRays;
    };

    return {
      update({ dt }) {
        const roughness = Number(params["roughness"]);
        const distribution: Distribution = isDistribution(
          params["distribution"]
        )
          ? params["distribution"]
          : "ggx";
        if (params["orbit"] === true) {
          angle += dt * 0.5;
        }
        toLight
          .set(Math.cos(angle) * 0.6, 0.75, Math.sin(angle) * 0.6)
          .normalize();
        sphereUniforms.uLight.value.copy(toLight);
        sphereUniforms.uRoughness.value = roughness;
        sphereUniforms.uDistribution.value = distributions[distribution];
        rebuild(roughness, params["rays"] === true);
        light.set(
          PATCH_CENTER.clone()
            .addScaledVector(toLight, 2.2)
            .setY(PATCH_CENTER.y + toLight.y * 2.2),
          toLight.clone().multiplyScalar(-1.9)
        );
        if (roughness !== drawn) {
          drawn = roughness;
          drawGraph(roughness);
        }
        graph.setMarker(0);
        context.readout("α = 粗さ²", (roughness * roughness).toFixed(3));
        context.readout(
          "ハイライトの裾",
          distribution === "ggx"
            ? "長い（GGX）"
            : distribution === "beckmann"
              ? "短い"
              : "短い（古いモデル）"
        );
        context.caption(
          "表面は、目に見えないほど小さな鏡（微小面）の集まりとみなせる。その向きの散らばり方を表すのが法線分布関数で、GGX は中心が鋭く、周りに長い裾を持つので、現実の素材のハイライトに近い。"
        );
      },
    };
  },
};
