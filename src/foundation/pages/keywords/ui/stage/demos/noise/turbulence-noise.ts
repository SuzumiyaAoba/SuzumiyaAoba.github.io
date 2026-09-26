import {
  AdditiveBlending,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { glslSimplex } from "../../glsl";
import { glowSprite, palette, perlin2, polyline } from "../../kit";
import type { DemoModule } from "../../types";

const CHART_Y = 0.35;
const CHART_WIDTH = 7;
const SAMPLES = 240;

export const demo: DemoModule = {
  alt: "燃え盛る太陽の球体。通常のフラクタルノイズとノイズの絶対値を重ねるタービュランスを切り替えると、表面に折り返しの鋭い筋が現れる。手前のグラフで 1 次元の波形を比べられる。",
  camera: { position: [0, 3, 8.6], target: [0, 1.9, 0] },
  studio: { floor: true, shadows: false },
  bloom: { strength: 0.55, radius: 0.5, threshold: 0.7 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "重ね方",
      value: "turbulence",
      options: [
        { value: "fbm", label: "fBm（そのまま）" },
        { value: "turbulence", label: "タービュランス（絶対値）" },
      ],
    },
    {
      type: "range",
      key: "octaves",
      label: "オクターブ数",
      min: 1,
      max: 7,
      step: 1,
      value: 5,
    },
    {
      type: "range",
      key: "speed",
      label: "うねりの速さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.6,
    },
    { type: "toggle", key: "chart", label: "1 次元の波形", value: true },
  ],
  legend: [
    { color: palette.sky, label: "第 1 オクターブ n(x)" },
    { color: palette.amber, label: "重ねた値（fBm または Σ|n|）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uMode: { value: 1 },
      uOctaves: { value: 5 },
    };
    const sun = new Mesh(
      new SphereGeometry(1.45, 128, 96),
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          ${glslSimplex}
          uniform float uTime;
          uniform float uMode;
          uniform float uOctaves;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vView;
          vec3 fire(float t) {
            t = clamp(t, 0.0, 1.0);
            vec3 c = mix(vec3(0.05, 0.004, 0.0), vec3(0.55, 0.06, 0.01), smoothstep(0.0, 0.4, t));
            c = mix(c, vec3(1.0, 0.32, 0.04), smoothstep(0.35, 0.7, t));
            return mix(c, vec3(1.5, 1.05, 0.45), smoothstep(0.78, 1.0, t));
          }
          void main() {
            vec3 p = vPosition * 1.1;
            float sum = 0.0;
            float amp = 0.5;
            float norm = 0.0;
            for (int i = 0; i < 7; i++) {
              if (float(i) >= uOctaves) break;
              float n = snoise(p + vec3(0.0, uTime * 0.25 * float(i + 1), uTime * 0.1));
              sum += (uMode > 0.5 ? abs(n) : n * 0.5 + 0.5) * amp;
              norm += amp;
              p *= 2.0;
              amp *= 0.5;
            }
            float v = sum / norm;
            float heat = uMode > 0.5 ? 1.0 - v * 1.35 : v;
            float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
            vec3 color = fire(heat) + vec3(0.9, 0.25, 0.04) * rim;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    );
    sun.position.y = 2.2;
    scene.add(sun);
    const corona = new Sprite(
      new SpriteMaterial({
        map: glowSprite(),
        color: "#ff8a3a",
        blending: AdditiveBlending,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    corona.scale.setScalar(5.2);
    corona.position.copy(sun.position);
    scene.add(corona);

    const raw = polyline([], palette.sky, { width: 1.6, opacity: 0.85 });
    const folded = polyline([], palette.amber, { width: 2.6 });
    const axis = polyline(
      [
        new Vector3(-CHART_WIDTH / 2, CHART_Y, 2.2),
        new Vector3(CHART_WIDTH / 2, CHART_Y, 2.2),
      ],
      palette.muted,
      { width: 1, opacity: 0.5, dashed: true, dashSize: 0.1, gapSize: 0.08 }
    );
    scene.add(raw, folded, axis);
    const zeroLabel = context.label("0", {
      tone: "muted",
      color: palette.muted,
    });
    zeroLabel.position.set(-CHART_WIDTH / 2 - 0.25, CHART_Y, 2.2);
    scene.add(zeroLabel);
    let clock = 0;

    return {
      update({ dt }) {
        clock += dt * Number(params["speed"]);
        const turbulence = params["mode"] === "turbulence";
        const octaves = Number(params["octaves"]);
        uniforms.uTime.value = clock;
        uniforms.uMode.value = turbulence ? 1 : 0;
        uniforms.uOctaves.value = octaves;
        sun.rotation.y += dt * 0.05;

        const showChart = params["chart"] === true;
        raw.visible = showChart;
        folded.visible = showChart;
        axis.visible = showChart;
        zeroLabel.visible = showChart;
        if (showChart) {
          const rawPoints: Vector3[] = [];
          const foldedPoints: Vector3[] = [];
          for (let sample = 0; sample <= SAMPLES; sample++) {
            const u = sample / SAMPLES;
            const x = (u - 0.5) * CHART_WIDTH;
            let sum = 0;
            let amp = 0.5;
            let norm = 0;
            let first = 0;
            for (let index = 0; index < octaves; index++) {
              const frequency = 2 ** index * 5;
              const n =
                perlin2(
                  u * frequency + clock * 0.2 * (index + 1),
                  0.37 + index
                ) * 1.4;
              if (index === 0) {
                first = n;
              }
              sum += (turbulence ? Math.abs(n) : n) * amp;
              norm += amp;
              amp *= 0.5;
            }
            rawPoints.push(new Vector3(x, CHART_Y + first * 0.7, 2.2));
            foldedPoints.push(
              new Vector3(x, CHART_Y + (sum / norm) * 1.3, 2.2)
            );
          }
          raw.setPoints(rawPoints);
          folded.setPoints(foldedPoints);
        }
        context.caption(
          turbulence
            ? "負の値を折り返す（絶対値）と、0 を横切る場所が鋭い谷になる。重ねると炎やガスの筋が現れる。"
            : "そのまま重ねたノイズは山も谷も丸く、柔らかな雲のような濃淡になる。"
        );
      },
    };
  },
};
